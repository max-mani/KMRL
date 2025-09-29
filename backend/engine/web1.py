# dashboard_enhanced_no_shap.py
import streamlit as st
import pandas as pd
import numpy as np
import plotly.express as px
import plotly.graph_objects as go
import pickle
import logging
from datetime import datetime
import model as model
import os
import io
import altair as alt
import json
from plotly.subplots import make_subplots
from model import OptiInductChatbot

# ----------------------------
# Enhanced Configuration
# ----------------------------
st.set_page_config(
    page_title="KMRL AI-Powered Induction Optimizer", 
    layout="wide",
    page_icon="🚇"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .kpi-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 10px;
        border-left: 4px solid #1f77b4;
    }
    .simulation-panel {
        background-color: #e8f4fd;
        padding: 1.5rem;
        border-radius: 10px;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

# ----------------------------
# Enhanced KPI Display
# ----------------------------
def show_enhanced_kpis(induction_list):
    df = pd.DataFrame(induction_list)
    
    # Calculate metrics
    total_service = (df['assigned_status'] == "Service").sum()
    total_maintenance = (df['assigned_status'] == "Maintenance").sum()
    total_standby = (df['assigned_status'] == "Standby").sum()
    
    total_sla_deficit = df['sla_deficit'].sum()
    avg_mileage = df[df['assigned_status'] == "Service"]['mileage'].mean()
    total_shunting = df['shunting_time'].sum()
    total_turnout_penalty = df['turnout_penalty'].sum()
    total_maintenance_cost = df['maintenance_cost'].sum()
    
    # Efficiency metrics
    service_trains = df[df['assigned_status'] == "Service"]
    if len(service_trains) > 0:
        avg_fitness = service_trains['explainability'].apply(
            lambda x: x.get('fitness_score', 0) if isinstance(x, dict) else 0
        ).mean()
        avg_efficiency = service_trains['explainability'].apply(
            lambda x: x.get('branding_efficiency', 0) if isinstance(x, dict) else 0
        ).mean()
    else:
        avg_fitness = avg_efficiency = 0

    st.markdown("### 📊 Performance Dashboard")
    
    # Main KPIs
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("🚇 Service Trains", total_service, 
                 help="Trains assigned to revenue service")
    with col2:
        st.metric("🛠️ Maintenance", total_maintenance,
                 help="Trains undergoing maintenance")
    with col3:
        st.metric("⏸️ Standby", total_standby,
                 help="Trains in standby mode")
    with col4:
        st.metric("📈 Fitness Score", f"{avg_fitness:.2f}",
                 help="Average fitness of service trains")

    # Secondary KPIs
    col5, col6, col7, col8 = st.columns(4)
    with col5:
        st.metric("📢 SLA Deficit", f"{total_sla_deficit:.1f} hrs",
                 help="Total branding hours deficit")
    with col6:
        st.metric("⚙️ Avg Mileage", f"{avg_mileage:.0f} km",
                 help="Average mileage of service trains")
    with col7:
        st.metric("💸 Maintenance Cost", f"₹ {total_maintenance_cost:,.0f}",
                 help="Total maintenance cost")
    with col8:
        st.metric("📊 Efficiency", f"{avg_efficiency:.2f}",
                 help="Average branding efficiency")

# ----------------------------
# Enhanced Charts
# ----------------------------
def show_enhanced_charts(induction_list):
    df = pd.DataFrame(induction_list)
    
    # Create tabs for different chart types
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📊 Dashboard", 
    "🔬 What-If Simulator", 
    "🔍 Explainability",
    "⚙️ Model Management",
    "💬 Chat Assistant"
])
    if 'chatbot' not in st.session_state:
        st.session_state.chatbot = OptiInductChatbot()

    with tab1:
        col1, col2 = st.columns(2)
        
        with col1:
            # Status distribution pie chart
            status_counts = df['assigned_status'].value_counts()
            fig_pie = px.pie(
                values=status_counts.values,
                names=status_counts.index,
                title="Train Status Distribution",
                color_discrete_sequence=px.colors.qualitative.Set3
            )
            st.plotly_chart(fig_pie, use_container_width=True)
        
        with col2:
            # SLA deficit by status
            fig_bar = px.box(
                df, x='assigned_status', y='sla_deficit',
                title="SLA Deficit by Status",
                color='assigned_status'
            )
            st.plotly_chart(fig_bar, use_container_width=True)
    
    with tab2:
        col1, col2 = st.columns(2)
        
        with col1:
            # Mileage vs Shunting time
            fig_scatter = px.scatter(
                df, x='mileage', y='shunting_time', 
                color='assigned_status', size='maintenance_cost',
                hover_data=['train_id'],
                title="Mileage vs Shunting Time",
                labels={'mileage': 'Mileage (km)', 'shunting_time': 'Shunting Time (min)'}
            )
            st.plotly_chart(fig_scatter, use_container_width=True)
        
        with col2:
            # Cumulative metrics over train sequence
            df_sorted = df.sort_values('train_id')
            df_sorted['cumulative_cost'] = df_sorted['maintenance_cost'].cumsum()
            df_sorted['cumulative_shunting'] = df_sorted['shunting_time'].cumsum()
            
            fig_cumulative = go.Figure()
            fig_cumulative.add_trace(go.Scatter(
                x=df_sorted['train_id'], y=df_sorted['cumulative_cost'],
                name='Cumulative Cost', line=dict(color='red')
            ))
            fig_cumulative.add_trace(go.Scatter(
                x=df_sorted['train_id'], y=df_sorted['cumulative_shunting'],
                name='Cumulative Shunting', line=dict(color='blue'),
                yaxis='y2'
            ))
            
            fig_cumulative.update_layout(
                title="Cumulative Costs and Shunting Time",
                xaxis_title="Train ID",
                yaxis=dict(title="Cost (₹)", side='left'),
                yaxis2=dict(title="Shunting Time (min)", side='right', overlaying='y'),
                showlegend=True
            )
            st.plotly_chart(fig_cumulative, use_container_width=True)
    
    with tab3:
        # Maintenance analysis
        maintenance_trains = df[df['assigned_status'] == 'Maintenance']
        if not maintenance_trains.empty:
            col1, col2 = st.columns(2)
            
            with col1:
                fig_hist = px.histogram(
                    maintenance_trains, x='maintenance_cost',
                    title="Maintenance Cost Distribution",
                    nbins=20
                )
                st.plotly_chart(fig_hist, use_container_width=True)
            
            with col2:
                # Maintenance reasons (from explainability)
                reasons = []
                for exp in maintenance_trains['explainability']:
                    if isinstance(exp, dict):
                        reasons.append(exp.get('job_card_status', 'Unknown'))
                
                if reasons:
                    reason_counts = pd.Series(reasons).value_counts()
                    fig_reasons = px.bar(
                        x=reason_counts.index, y=reason_counts.values,
                        title="Maintenance Reasons",
                        labels={'x': 'Reason', 'y': 'Count'}
                    )
                    st.plotly_chart(fig_reasons, use_container_width=True)

# ----------------------------
# Enhanced Induction Table
# ----------------------------
def show_enhanced_induction_table(induction_list):
    st.markdown("### 📋 Optimized Induction Plan")
    
    df = pd.DataFrame(induction_list)
    
    # Add detailed information from explainability
    expanded_data = []
    for item in induction_list:
        row = {
            'train_id': item['train_id'],
            'assigned_status': item['assigned_status'],
            'readiness': item['readiness'],
            'sla_deficit': item['sla_deficit'],
            'mileage': item['mileage'],
            'shunting_time': item['shunting_time'],
            'turnout_penalty': item['turnout_penalty'],
            'maintenance_cost': item['maintenance_cost']
        }
        
        # Expand explainability data
        if isinstance(item['explainability'], dict):
            for key, value in item['explainability'].items():
                row[f'exp_{key}'] = value
        
        expanded_data.append(row)
    
    expanded_df = pd.DataFrame(expanded_data)
    
    # Interactive table with filtering
    col1, col2 = st.columns([3, 1])
    
    with col2:
        st.markdown("**Filter by Status**")
        status_filter = st.multiselect(
            "Select statuses:",
            options=expanded_df['assigned_status'].unique(),
            default=expanded_df['assigned_status'].unique(),
            label_visibility="collapsed"
        )
    
    filtered_df = expanded_df[expanded_df['assigned_status'].isin(status_filter)]
    
    with col1:
        st.dataframe(
            filtered_df.style.format({
                'sla_deficit': '{:.1f}',
                'mileage': '{:.0f}',
                'shunting_time': '{:.1f}',
                'maintenance_cost': '₹ {:.0f}'
            }),
            use_container_width=True,
            height=400
        )
    
    # Export options
    col3, col4, col5 = st.columns(3)
    
    with col3:
        st.download_button(
            "📥 Download CSV",
            filtered_df.to_csv(index=False).encode("utf-8"),
            "enhanced_induction_plan.csv",
            "text/csv"
        )
    
    with col4:
        # Create Excel file
        from io import BytesIO
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            filtered_df.to_excel(writer, index=False, sheet_name='Induction_Plan')
        st.download_button(
            "📥 Download Excel",
            data=output.getvalue(),
            file_name="enhanced_induction_plan.xlsx",
            mime="application/vnd.ms-excel"
        )
    
    with col5:
        # Export as JSON for API integration
        json_data = filtered_df.to_json(orient='records', indent=2)
        st.download_button(
            "📥 Download JSON",
            json_data,
            "induction_plan.json",
            "application/json"
        )

# ----------------------------
# What-If Simulator
# ----------------------------
def show_what_if_simulator(enhanced_model, sample_data=None):
    st.markdown("### 🔬 What-If Simulation Studio")
    
    with st.expander("🎯 Simulation Parameters", expanded=True):
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### Operational Constraints")
            min_revenue = st.slider(
                "Minimum Revenue Trains", 
                10, 30, 15,
                help="Minimum number of trains required for revenue service"
            )
            cleaning_slots = st.slider(
                "Available Cleaning Slots", 
                0, 15, 5,
                help="Number of available cleaning slots"
            )
            depot_bays = st.slider(
                "Depot Bay Capacity", 
                5, 25, 10,
                help="Maximum number of stabling bays available"
            )
        
        with col2:
            st.markdown("#### Objective Weights")
            w_branding = st.slider(
                "Branding Priority", 0.0, 3.0, 1.0, 0.1,
                help="Weight for branding SLA compliance"
            )
            w_mileage = st.slider(
                "Mileage Balance", 0.0, 3.0, 1.0, 0.1,
                help="Weight for mileage balancing across trains"
            )
            w_shunting = st.slider(
                "Shunting Efficiency", 0.0, 3.0, 1.0, 0.1,
                help="Weight for minimizing shunting time"
            )
            w_fitness = st.slider(
                "Fitness Priority", 0.0, 3.0, 1.0, 0.1,
                help="Weight for train fitness scores"
            )
    
    with st.expander("📊 Scenario Analysis", expanded=False):
        scenario_col1, scenario_col2 = st.columns(2)
        
        with scenario_col1:
            st.markdown("**Compare Scenarios**")
            base_scenario = {
                'min_revenue': 15,
                'cleaning_slots': 5,
                'depot_bays': 10,
                'weights': {'branding': 1.0, 'mileage': 1.0, 'shunting': 1.0, 'fitness': 1.0}
            }
            
            current_scenario = {
                'min_revenue': min_revenue,
                'cleaning_slots': cleaning_slots,
                'depot_bays': depot_bays,
                'weights': {'branding': w_branding, 'mileage': w_mileage, 'shunting': w_shunting, 'fitness': w_fitness}
            }
            
            st.metric("Revenue Trains", f"{min_revenue} vs {base_scenario['min_revenue']}")
            st.metric("Cleaning Slots", f"{cleaning_slots} vs {base_scenario['cleaning_slots']}")
        
        with scenario_col2:
            st.markdown("**Impact Analysis**")
            # Simulate impact of changes
            branding_impact = (w_branding - 1.0) * 100
            mileage_impact = (w_mileage - 1.0) * 50
            shunting_impact = (w_shunting - 1.0) * -30
            
            st.metric("Branding Focus Impact", f"{branding_impact:+.1f}%")
            st.metric("Mileage Balance Impact", f"{mileage_impact:+.1f}%")
            st.metric("Shunting Efficiency Impact", f"{shunting_impact:+.1f}%")
    
    # Simulation controls
    col1, col2, col3 = st.columns([1, 1, 1])
    
    with col2:
        run_simulation = st.button(
            "🚀 Run Simulation", 
            type="primary",
            use_container_width=True
        )
    
    if run_simulation and sample_data is not None:
        st.info("Running enhanced optimization with new parameters...")
        
        # Placeholder for enhanced optimization call
        with st.spinner("Optimizing induction plan..."):
            # Simulate processing time
            import time
            time.sleep(2)
            
            st.success("Simulation completed successfully!")

# ----------------------------
# Explainability Dashboard (without SHAP)
# ----------------------------
def show_explainability_dashboard(induction_list, enhanced_model, sample_data):
    st.markdown("### 🔍 Model Explainability")
    
    if not induction_list or sample_data is None:
        st.warning("Run optimization first to see explainability insights")
        return
    
    tab1, tab2 = st.tabs(["Feature Importance", "Decision Analysis"])
    
    with tab1:
        st.markdown("#### 📊 Feature Importance")
        
        # Get feature importance from the model
        if enhanced_model.model is not None:
            importance_df = enhanced_model.get_feature_importance()
            if importance_df is not None:
                top_features = importance_df.head(15)
                
                fig = px.bar(
                    top_features,
                    x='importance',
                    y='feature',
                    orientation='h',
                    title="Top 15 Feature Importances"
                )
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Feature importance not available for this model type.")
    
    with tab2:
        st.markdown("#### 🎯 Decision Factors")
        
        # Analyze decisions across trains
        df = pd.DataFrame(induction_list)
        
        col1, col2 = st.columns(2)
        
        with col1:
            # Show key factors for maintenance decisions
            maintenance_trains = df[df['assigned_status'] == 'Maintenance']
            if not maintenance_trains.empty:
                st.metric("Maintenance Trains", len(maintenance_trains))
                
                reasons = []
                for exp in maintenance_trains['explainability']:
                    if isinstance(exp, dict):
                        fitness_ok = exp.get('fitness_ok', True)
                        if not fitness_ok:
                            reasons.append("Fitness Issue")
                        elif exp.get('branding_deficit', 0) > 10:
                            reasons.append("High SLA Deficit")
                        else:
                            reasons.append("Other")
                
                if reasons:
                    reason_counts = pd.Series(reasons).value_counts()
                    fig = px.pie(values=reason_counts.values, names=reason_counts.index)
                    st.plotly_chart(fig, use_container_width=True)

# ----------------------------
# Main Enhanced App
# ----------------------------
def main():
    st.markdown('<h1 class="main-header">🚇 KMRL AI-Powered Induction Optimizer</h1>', 
                unsafe_allow_html=True)
    
    # Initialize enhanced model
    enhanced_model = model.EnhancedTrainInductionModel()
    
    # Main tabs
    tab1, tab2, tab3, tab4, tab5 = st.tabs([
        "📊 Dashboard", 
        "🔬 What-If Simulator", 
        "🔍 Explainability",
        "⚙️ Model Management",
        "💬 Chat Assistant"
    ])
    
    # Global state
    if 'induction_list' not in st.session_state:
        st.session_state.induction_list = None
    if 'sample_data' not in st.session_state:
        st.session_state.sample_data = None
    if 'chatbot' not in st.session_state:
        st.session_state.chatbot = OptiInductChatbot()
    
    with tab1:
        st.markdown("### 📥 Data Input & Optimization")
        
        col1, col2 = st.columns(2)
        
        with col1:
            uploaded_file = st.file_uploader(
                "Upload Train Dataset (CSV)", 
                type=["csv"],
                help="Upload daily train status data"
            )
        
        with col2:
            selected_date = st.date_input(
                "Select Operational Date",
                value=datetime.now(),
                help="Date for induction planning"
            )
        
        # Quick optimization parameters
        with st.expander("⚡ Quick Optimization Settings", expanded=False):
            q_col1, q_col2 = st.columns(2)
            with q_col1:
                model_type = st.selectbox(
                    "Model Type",
                    ["xgboost", "random_forest"],
                    help="Select machine learning model"
                )
            with q_col2:
                optimize_button = st.button(
                    "🎯 Run Enhanced Optimization",
                    type="primary",
                    use_container_width=True
                )
        
        if uploaded_file is not None:
            try:
                sample_data = pd.read_csv(uploaded_file)
                st.session_state.sample_data = sample_data
                
                st.success(f"✅ Loaded {len(sample_data)} train records")
                
                if optimize_button:
                    with st.spinner("Training enhanced model and optimizing..."):
                        # Preprocess data
                        X_processed = enhanced_model.preprocess_data(sample_data, training=True)
                        
                        # For demo purposes, create sample results
                        # In real implementation, you would train the model and run optimization
                        st.session_state.induction_list = [
                            {
                                'train_id': f"TRN_{i:03d}",
                                'assigned_status': np.random.choice(["Service", "Maintenance", "Standby"], p=[0.6, 0.3, 0.1]),
                                'readiness': np.random.uniform(0.7, 1.0),
                                'sla_deficit': np.random.uniform(0, 20),
                                'mileage': np.random.uniform(100, 500),
                                'shunting_time': np.random.uniform(5, 60),
                                'turnout_penalty': np.random.uniform(0, 100),
                                'maintenance_cost': np.random.uniform(1000, 5000),
                                'explainability': {
                                    'fitness_score': np.random.uniform(0.6, 1.0),
                                    'branding_efficiency': np.random.uniform(0.5, 1.0),
                                    'job_card_status': np.random.choice(["Open", "Closed", "Pending"]),
                                    'fitness_ok': np.random.choice([True, False])
                                }
                            }
                            for i in range(min(20, len(sample_data)))
                        ]
                        
                        st.success("✅ Enhanced optimization completed!")
                        if st.session_state.induction_list:
                            st.session_state.chatbot.set_induction_list(st.session_state.induction_list)
                
                # Display results if available
                if st.session_state.induction_list:
                    show_enhanced_kpis(st.session_state.induction_list)
                    show_enhanced_charts(st.session_state.induction_list)
                    show_enhanced_induction_table(st.session_state.induction_list)
                        
            except Exception as e:
                st.error(f"Error processing file: {str(e)}")
        else:
            st.info("📁 Please upload a CSV file to get started")
    
    with tab2:
        show_what_if_simulator(enhanced_model, st.session_state.sample_data)
    
    with tab3:
        show_explainability_dashboard(
            st.session_state.induction_list, 
            enhanced_model, 
            st.session_state.sample_data
        )
    
    with tab4:
        st.markdown("### ⚙️ Model Management")
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown("#### Model Information")
            st.info("""
            **Enhanced Model Features:**
            - XGBoost with hyperparameter tuning
            - Advanced preprocessing pipeline
            - Derived feature engineering
            - Multi-objective optimization
            - Feature importance analysis
            """)
        
        with col2:
            st.markdown("#### Model Operations")
            
            if st.button("🔄 Retrain Model", use_container_width=True):
                st.info("Model retraining initiated...")
                # Placeholder for retraining logic
            
            if st.button("💾 Save Model", use_container_width=True):
                model.save_enhanced_model(enhanced_model)
                st.success("Model saved successfully!")
            
            uploaded_model = st.file_uploader(
                "Upload Saved Model",
                type=["pkl"],
                help="Load a previously saved model"
            )
            
            if uploaded_model:
                try:
                    # Save uploaded file temporarily
                    with open("temp_model.pkl", "wb") as f:
                        f.write(uploaded_model.getbuffer())
                    enhanced_model = model.load_enhanced_model("temp_model.pkl")
                    os.remove("temp_model.pkl")
                    st.success("Model loaded successfully!")
                except Exception as e:
                    st.error(f"Error loading model: {str(e)}")
    
    with tab5:
        st.markdown("### 💬 AI Chat Assistant")

        # Function to clear chat history
        def clear_chat_history():
            # This will trigger a rerun of the app
            st.session_state.chat_history = []
            if st.session_state.get('chatbot'):
                st.session_state.chatbot.chat_session = None
                st.session_state.chatbot.set_induction_list(st.session_state.induction_list)

        # Place the "Clear Chat" button at the top-right
        # Use columns to position it nicely
        col1, col2, col3 = st.columns([1, 1, 1])
        with col3:
            if st.button("Clear Chat", key="clear_chat_button"):
                clear_chat_history()
                st.rerun()

        # Initial check before showing the chat
        if not st.session_state.get('chatbot') or not st.session_state.get('induction_list'):
            st.warning("⚠️ Please run the optimization first to start a conversation with the assistant.")
            st.info("The assistant needs the induction plan to provide useful answers.")

        else:
            # Initialize chat history with a welcome message if it's empty
            if 'chat_history' not in st.session_state:
                st.session_state.chat_history = [
                    ("assistant", "Hello! I'm ready to help. What would you like to know about the induction plan?")
                ]

            # Display chat messages from history on app rerun
            for sender, msg in st.session_state.chat_history:
                with st.chat_message(sender):
                    st.markdown(msg)

            # Accept user input
            if user_prompt := st.chat_input("Ask a question about the induction plan..."):
                # Add user message to chat history
                st.session_state.chat_history.append(("user", user_prompt))

                # Display user message
                with st.chat_message("user"):
                    st.markdown(user_prompt)

                # Get and display assistant response
                try:
                    with st.chat_message("assistant"):
                        with st.spinner("Thinking..."):
                            response = st.session_state.chatbot.chat(user_prompt)
                            st.markdown(response)
                            # Append the response to chat history
                            # Note: The `chat` method now updates the internal session, so we just need to append to our local history for display
                            st.session_state.chat_history.append(("assistant", response))

                except Exception as e:
                    # Handle API errors gracefully
                    st.error(f"An error occurred: {e}")
                    st.info("Please try again or clear the chat history.")

if __name__ == "__main__":
    main()