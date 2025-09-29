import streamlit as st
import pandas as pd
import plotly.express as px
import pickle
import logging
from datetime import datetime
import model
import model2
import os
import io

# Configure logging with a StringIO buffer for capturing logs
log_buffer = io.StringIO()
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(log_buffer), logging.StreamHandler()]
)

# Configuration
NUM_TRAINSETS = 25
CLEANING_SLOTS = 5
DEPOT_BAYS = 10
MIN_REVENUE_TRAINS = 15

# Set page configuration
st.set_page_config(page_title="KMRL OptiInduct Dashboard", layout="wide")

# Load Tailwind CSS via CDN
st.markdown("""
<link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
""", unsafe_allow_html=True)

# Load pre-trained model and related objects
@st.cache_resource
def load_model():
    try:
        with open("rf_model.pkl", "rb") as f:
            rf_model = pickle.load(f)
        with open("scaler.pkl", "rb") as f:
            scaler = pickle.load(f)
        with open("le_status.pkl", "rb") as f:
            le_status = pickle.load(f)
        logging.info("Loaded pre-trained model, scaler, and label encoder")
        return rf_model, scaler, le_status
    except FileNotFoundError:
        logging.error("Model files (rf_model.pkl, scaler.pkl, le_status.pkl) not found")
        st.error("Model files not found. Please train the model first using train_model.py.")
        return None, None, None

# Preprocess uploaded data to ensure compatibility and align with training
def preprocess_uploaded_data(df):
    required_columns = ['date', 'rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness',
                       'job_card_status', 'branding_hours', 'branding_total', 'mileage',
                       'cleaning_slot', 'stabling_bay', 'shunting_time_minutes',
                       'is_serviceable', 'branding_sla_met', 'mileage_balance_deviation']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        logging.error(f"Missing columns in uploaded data: {missing_columns}")
        st.error(f"Missing required columns: {missing_columns}. Please ensure all necessary fields are present.")
        return None
    
    # Fill missing values and ensure correct types
    for col in ['rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness', 'is_serviceable', 'branding_sla_met']:
        df[col] = df[col].astype(int).fillna(0)
    df['cleaning_slot'] = df['cleaning_slot'].fillna(0).astype(int).clip(0, CLEANING_SLOTS)
    df['stabling_bay'] = df['stabling_bay'].fillna(0).astype(int).clip(0, DEPOT_BAYS)
    df['branding_hours'] = df['branding_hours'].fillna(df['branding_hours'].mean()).astype(float)
    df['branding_total'] = df['branding_total'].fillna(df['branding_total'].mean()).astype(float)
    df['mileage'] = df['mileage'].fillna(df['mileage'].mean()).astype(float)
    df['shunting_time_minutes'] = df['shunting_time_minutes'].fillna(df['shunting_time_minutes'].mean()).astype(float)
    df['mileage_balance_deviation'] = df['mileage_balance_deviation'].fillna(df['mileage_balance_deviation'].mean()).astype(float)
    
    # Ensure job_card_status is valid and categorical; if numeric, map to categories
    if pd.api.types.is_numeric_dtype(df['job_card_status']):
        df['job_card_status'] = df['job_card_status'].apply(lambda v: 'closed' if v >= 50 else 'open')
    df['job_card_status'] = df['job_card_status'].fillna('unknown').astype(str)
    
    return df

# Main dashboard
def main():
    st.markdown("""
    <div class="bg-blue-600 text-white p-4 mb-4 rounded-lg">
        <h1 class="text-3xl font-bold">KMRL OptiInduct Dashboard</h1>
        <p class="text-lg">Test and Optimize Train Induction for Kochi Metro Rail Limited</p>
    </div>
    """, unsafe_allow_html=True)

    # Sidebar for inputs
    st.sidebar.markdown("<h2 class='text-xl font-semibold'>Controls</h2>", unsafe_allow_html=True)
    
    # Date picker
    selected_date = st.sidebar.date_input("Select Date for Induction", value=datetime.now())
    selected_date_str = selected_date.strftime("%Y-%m-%d")
    
    # File uploader
    uploaded_file = st.sidebar.file_uploader("Upload Dataset (CSV)", type=["csv"])
    
    # Button to run optimization
    run_optimization_btn = st.sidebar.button("Run Optimization")
    
    # Load model
    rf_model, scaler, le_status = load_model()
    if rf_model is None:
        return

    # Load or optimize induction list
    induction_list = None
    if run_optimization_btn and uploaded_file:
        dataset_path = "temp_dataset.csv"
        try:
            with open(dataset_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            logging.info(f"Successfully saved uploaded file to {dataset_path}")
            
            # Load and preprocess the dataset
            df = model.load_dataset(dataset_path)
            df = preprocess_uploaded_data(df)
            if df is None:
                return
            
            # Filter for the selected date and optimize
            sample_day = df[df['date'] == selected_date_str]
            if sample_day.empty:
                logging.warning(f"No data found for date {selected_date_str}")
                st.warning(f"No data available for {selected_date_str}")
                return
            
            # Build features in the exact training order and scale only numerical cols
            feature_order = [
                'rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness',
                'job_card_status', 'branding_hours', 'branding_total', 'mileage',
                'cleaning_slot', 'stabling_bay', 'shunting_time_minutes',
                'is_serviceable', 'branding_sla_met', 'mileage_balance_deviation'
            ]
            numerical_features = ['branding_hours', 'branding_total', 'mileage', 'shunting_time_minutes', 'mileage_balance_deviation']

            # Encode job_card_status (fallback factorize like service)
            sample_day = sample_day.copy()
            sample_day['job_card_status'] = sample_day['job_card_status'].fillna('unknown').astype(str)
            sample_day['job_card_status'] = pd.factorize(sample_day['job_card_status'])[0]

            # Scale numerical features
            sample_day.loc[:, numerical_features] = scaler.transform(sample_day[numerical_features])

            # Optimize induction using model2 API (expects feature_names and numerical_features)
            induction_list = model2.optimize_induction(sample_day, rf_model, scaler, numerical_features, feature_order, le_status)
            
            if induction_list:
                with open("induction_list.pkl", "wb") as f:
                    pickle.dump(induction_list, f)
                logging.info(f"Saved optimized induction list for {selected_date_str}")
            else:
                logging.error("Optimization returned None, no induction list saved")
                st.error("Optimization failed to generate an induction list.")
        except PermissionError:
            logging.error(f"Permission denied when writing to {dataset_path}")
            st.error("Permission denied. Please run as administrator or change the save location.")
        except pd.errors.ParserError:
            logging.error("Uploaded file is not a valid CSV")
            st.error("Invalid CSV file. Please upload a correctly formatted dataset.")
        except Exception as e:
            logging.error(f"Error processing uploaded file: {str(e)}")
            st.error(f"Error processing file: {str(e)}")
        finally:
            if os.path.exists(dataset_path):
                os.remove(dataset_path)
    else:
        try:
            with open("induction_list.pkl", "rb") as f:
                induction_list = pickle.load(f)
            logging.info("Loaded existing induction list from induction_list.pkl")
        except FileNotFoundError:
            logging.warning("No precomputed induction_list.pkl found")
            st.warning("No precomputed induction list available. Upload a dataset and run optimization.")

    if induction_list is None:
        st.markdown("<p class='text-red-500'>No induction list available. Please upload a dataset and run optimization.</p>", unsafe_allow_html=True)
        st.write("Latest log messages:", log_buffer.getvalue() if log_buffer.getvalue() else "No logs captured")
        return

    # Convert to DataFrame for visualization
    df_induction = pd.DataFrame(induction_list)
    if 'induction_status' not in df_induction.columns:
        st.error("Error: 'induction_status' column not found in induction list.")
        st.write("DataFrame columns:", df_induction.columns.tolist())
        return

    # KPIs
    revenue_count = len(df_induction[df_induction['induction_status'] == 'revenue'])
    cleaning_count = len(df_induction[df_induction['cleaning_slot'] > 0])
    bay_usage = len(df_induction[df_induction['stabling_bay'] > 0]['stabling_bay'].unique())
    
    st.markdown("<h2 class='text-2xl font-semibold mt-4'>Key Performance Indicators</h2>", unsafe_allow_html=True)
    col1, col2, col3 = st.columns(3)
    with col1:
        status = "✅" if revenue_count >= MIN_REVENUE_TRAINS else "❌"
        st.markdown(f"<p class='text-lg'>Revenue Trains: {revenue_count}/{MIN_REVENUE_TRAINS} {status}</p>", unsafe_allow_html=True)
    with col2:
        status = "✅" if cleaning_count <= CLEANING_SLOTS else "❌"
        st.markdown(f"<p class='text-lg'>Cleaning Slots Used: {cleaning_count}/{CLEANING_SLOTS} {status}</p>", unsafe_allow_html=True)
    with col3:
        status = "✅" if bay_usage <= DEPOT_BAYS else "❌"
        st.markdown(f"<p class='text-lg'>Stabling Bays Used: {bay_usage}/{DEPOT_BAYS} {status}</p>", unsafe_allow_html=True)
    
    # Visualizations
    st.markdown("<h2 class='text-2xl font-semibold mt-4'>Visualizations</h2>", unsafe_allow_html=True)
    col1, col2 = st.columns(2)
    
    with col1:
        status_counts = df_induction['induction_status'].value_counts().reset_index()
        status_counts.columns = ['induction_status', 'count']
        fig_pie = px.pie(status_counts, names='induction_status', values='count', 
                         title="Induction Status Distribution",
                         color_discrete_sequence=['#FF6B6B', '#4ECDC4', '#45B7D1'])
        st.plotly_chart(fig_pie, use_container_width=True)
    
    with col2:
        df_induction['mileage_balance_deviation'] = df_induction['explainability'].str.extract(r'mileage_deviation=(\d+\.\d+)').astype(float).fillna(0)
        fig_bar = px.bar(df_induction, x='train_id', y='mileage_balance_deviation', 
                         title="Mileage Balance Deviation by Train",
                         color='induction_status',
                         color_discrete_map={'maintenance': '#FF6B6B', 'revenue': '#4ECDC4', 'standby': '#45B7D1'})
        st.plotly_chart(fig_bar, use_container_width=True)
    
    # Induction list table
    st.markdown("<h2 class='text-2xl font-semibold mt-4'>Induction List</h2>", unsafe_allow_html=True)
    st.dataframe(df_induction[['train_id', 'induction_status', 'cleaning_slot', 'stabling_bay', 'explainability']],
                 column_config={
                     "train_id": "Train ID",
                     "induction_status": "Status",
                     "cleaning_slot": "Cleaning Slot",
                     "stabling_bay": "Stabling Bay",
                     "explainability": "Reason"
                 }, use_container_width=True)

    # Display logs
    st.markdown("<h2 class='text-2xl font-semibold mt-4'>Latest Log Messages</h2>", unsafe_allow_html=True)
    st.text(log_buffer.getvalue() if log_buffer.getvalue() else "No logs captured")

if __name__ == "__main__":
    main()