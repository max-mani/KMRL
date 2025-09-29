import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import classification_report
from deap import base, creator, tools, algorithms
import random
import pickle
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Configuration
NUM_TRAINSETS = 25
CLEANING_SLOTS = 5
DEPOT_BAYS = 10
MIN_REVENUE_TRAINS = 15  # KMRL requirement: At least 15 trains in revenue

# Load dataset
def load_dataset(file_path):
    try:
        df = pd.read_csv(file_path)
        logging.info(f"Loaded dataset with {len(df)} rows")
        if 'date' not in df.columns or df.empty:
            logging.error(f"Dataset missing 'date' column or is empty")
            raise ValueError("Invalid dataset: missing 'date' column or empty")
        return df
    except FileNotFoundError:
        logging.error(f"Dataset file {file_path} not found")
        raise
    except Exception as e:
        logging.error(f"Error loading dataset: {str(e)}")
        raise

# Preprocess dataset
def preprocess_data(df):
    # Encode categorical variables
    le_job = LabelEncoder()
    le_status = LabelEncoder()
    df['job_card_status'] = le_job.fit_transform(df['job_card_status'].fillna('unknown'))
    df['induction_status'] = le_status.fit_transform(df['induction_status'].fillna('maintenance'))
    
    # Handle boolean and nullable columns
    bool_cols = ['rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness', 'is_serviceable', 'branding_sla_met']
    for col in bool_cols:
        df[col] = df[col].astype(int).fillna(0)
    
    df['cleaning_slot'] = df['cleaning_slot'].fillna(0).astype(int).clip(0, CLEANING_SLOTS)
    df['stabling_bay'] = df['stabling_bay'].fillna(0).astype(int).clip(0, DEPOT_BAYS)
    df['branding_hours'] = df['branding_hours'].fillna(0.0)
    df['branding_total'] = df['branding_total'].fillna(0.0)
    df['mileage'] = df['mileage'].fillna(0.0)
    df['shunting_time_minutes'] = df['shunting_time_minutes'].fillna(0.0)
    df['mileage_balance_deviation'] = df['mileage_balance_deviation'].fillna(0.0)
    
    logging.info(f"Serviceable trains: {df['is_serviceable'].sum()}/{len(df)}")
    
    features = ['rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness', 
                'job_card_status', 'branding_hours', 'branding_total', 'mileage', 
                'cleaning_slot', 'stabling_bay', 'shunting_time_minutes', 
                'is_serviceable', 'branding_sla_met', 'mileage_balance_deviation']
    numerical_features = ['branding_hours', 'branding_total', 'mileage', 
                         'shunting_time_minutes', 'mileage_balance_deviation']
    target = 'induction_status'
    
    X = df[features]
    y = df[target]
    
    scaler = StandardScaler()
    X.loc[:, numerical_features] = scaler.fit_transform(X[numerical_features])
    
    return X, y, le_status, scaler, numerical_features, features

# Train Random Forest model
def train_rf_model(X, y):
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    rf_model = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    rf_model.fit(X_train, y_train)
    
    # Evaluate with specified labels to handle missing classes
    labels = ['maintenance', 'revenue', 'standby']
    y_pred = rf_model.predict(X_test)
    logging.info("Random Forest Classification Report:")
    logging.info(classification_report(y_test, y_pred, labels=range(len(labels)), target_names=labels, zero_division=0))
    
    logging.info(f"Feature importances: {dict(zip(X.columns, rf_model.feature_importances_))}")
    
    return rf_model, X_test, y_test

# Multi-objective optimization with NSGA-II
def evaluate_individual(individual, df_day, rf_model, scaler, numerical_features, feature_names):
    readiness_score = 0
    total_cost = 0
    sla_penalty = 0
    shunting_time = 0
    cleaning_count = 0
    revenue_count = 0
    bay_usage = set()
    
    features_df = df_day.iloc[individual][feature_names].copy()
    features_df.loc[:, numerical_features] = scaler.transform(features_df[numerical_features])
    statuses = rf_model.predict(features_df)
    
    for idx, status in zip(individual, statuses):
        row = df_day.iloc[idx]
        if not row['is_serviceable'] and status in [1, 2]:
            status = 0
            logging.debug(f"Train {row['train_id']} forced to maintenance due to is_serviceable=0")
        
        if status == 1:
            revenue_count += 1
            readiness_score += row['is_serviceable']
            sla_penalty += row.get('sla_penalty', 0)
            if row['cleaning_slot'] > 0 and cleaning_count < CLEANING_SLOTS:
                cleaning_count += 1
            else:
                features_df.loc[idx, 'cleaning_slot'] = 0
        elif status == 0:
            total_cost += row.get('maintenance_cost', 0)
        
        shunting_time += row['shunting_time_minutes']
        
        bay = row['stabling_bay']
        if bay > 0 and bay <= DEPOT_BAYS:
            bay_usage.add(bay)
        elif bay > DEPOT_BAYS:
            shunting_time += 1000
    
    if revenue_count < MIN_REVENUE_TRAINS:
        readiness_score -= (MIN_REVENUE_TRAINS - revenue_count) * 10000
    
    if len(bay_usage) > DEPOT_BAYS:
        shunting_time += 1000 * (len(bay_usage) - DEPOT_BAYS)
    
    return readiness_score, total_cost, sla_penalty, shunting_time

def initialize_nsga2(df_day, rf_model, scaler, numerical_features, feature_names):
    creator.create("FitnessMulti", base.Fitness, weights=(1.0, -1.0, -1.0, -1.0))
    creator.create("Individual", list, fitness=creator.FitnessMulti)
    
    toolbox = base.Toolbox()
    toolbox.register("indices", np.random.permutation, len(df_day))
    toolbox.register("individual", tools.initIterate, creator.Individual, toolbox.indices)
    toolbox.register("population", tools.initRepeat, list, toolbox.individual)
    toolbox.register("evaluate", evaluate_individual, df_day=df_day, rf_model=rf_model, 
                     scaler=scaler, numerical_features=numerical_features, feature_names=feature_names)
    toolbox.register("mate", tools.cxOrdered)
    toolbox.register("mutate", tools.mutShuffleIndexes, indpb=0.1)
    toolbox.register("select", tools.selNSGA2)
    
    return toolbox

def optimize_induction(df_day, rf_model, scaler, numerical_features, feature_names, le_status):
    logging.info(f"Sample day serviceable trains: {df_day['is_serviceable'].sum()}/{len(df_day)}")
    if df_day['is_serviceable'].sum() < MIN_REVENUE_TRAINS:
        logging.warning(f"Only {df_day['is_serviceable'].sum()} serviceable trains available, cannot meet {MIN_REVENUE_TRAINS} revenue requirement")
    
    toolbox = initialize_nsga2(df_day, rf_model, scaler, numerical_features, feature_names)
    population = toolbox.population(n=50)
    algorithms.eaMuPlusLambda(population, toolbox, mu=50, lambda_=100, cxpb=0.7, mutpb=0.3, ngen=20, verbose=False)
    best_solution = tools.selBest(population, k=1)[0]
    
    induction_list = []
    cleaning_count = 0
    revenue_count = 0
    bay_usage = set()
    features_df = df_day.iloc[best_solution][feature_names].copy()
    features_df.loc[:, numerical_features] = scaler.transform(features_df[numerical_features])
    statuses = rf_model.predict(features_df)
    
    for idx, status in zip(best_solution, statuses):
        row = df_day.iloc[idx]
        if not row['is_serviceable'] and status in [1, 2]:
            status = 0
        if status == 1:
            if cleaning_count >= CLEANING_SLOTS and row['cleaning_slot'] > 0:
                features_df.loc[idx, 'cleaning_slot'] = 0
            if row['cleaning_slot'] > 0:
                cleaning_count += 1
            revenue_count += 1
        
        bay = row['stabling_bay']
        if bay > DEPOT_BAYS or bay < 0:
            bay = 0
        
        induction_list.append({
            'train_id': int(row['train_id']),
            'induction_status': le_status.inverse_transform([status])[0],
            'cleaning_slot': int(features_df.loc[idx, 'cleaning_slot']),
            'stabling_bay': int(bay),
            'explainability': f"Assigned status {le_status.inverse_transform([status])[0]} based on fitness={row['is_serviceable']}, branding={row['branding_sla_met']}, mileage_deviation={row['mileage_balance_deviation']:.2f}, cleaning_slot={features_df.loc[idx, 'cleaning_slot']}, stabling_bay={bay}"
        })
        
        if bay > 0:
            bay_usage.add(bay)
    
    logging.info(f"Assigned {revenue_count} trains to revenue, {cleaning_count} cleaning slots used, {len(bay_usage)} stabling bays used")
    if revenue_count < MIN_REVENUE_TRAINS:
        logging.warning(f"Insufficient revenue trains: {revenue_count}/{MIN_REVENUE_TRAINS}")
    if cleaning_count > CLEANING_SLOTS:
        logging.warning(f"Cleaning slot limit exceeded: {cleaning_count}/{CLEANING_SLOTS}")
    if len(bay_usage) > DEPOT_BAYS:
        logging.warning(f"Stabling bay limit exceeded: {len(bay_usage)}/{DEPOT_BAYS}")
    
    return induction_list

# Main execution
if __name__ == "__main__":
    try:
        dataset = load_dataset("train_induction_dataset.csv")
        X, y, le_status, scaler, numerical_features, feature_names = preprocess_data(dataset)
        
        rf_model, X_test, y_test = train_rf_model(X, y)
        
        with open("rf_model.pkl", "wb") as f:
            pickle.dump(rf_model, f)
        with open("scaler.pkl", "wb") as f:
            pickle.dump(scaler, f)
        with open("le_status.pkl", "wb") as f:
            pickle.dump(le_status, f)
        
        sample_day = dataset[dataset['date'] == dataset['date'].iloc[0]]
        logging.info(f"Optimizing induction for {len(sample_day)} trains on {dataset['date'].iloc[0]}")
        induction_list = optimize_induction(sample_day, rf_model, scaler, numerical_features, feature_names, le_status)
        
        with open("induction_list.pkl", "wb") as f:
            pickle.dump(induction_list, f)
        logging.info(f"Saved induction list with {len(induction_list)} entries")
        
        print("Optimized Induction List for Sample Day:")
        for entry in induction_list:
            print(f"Train {entry['train_id']}: Status={entry['induction_status']}, Cleaning Slot={entry['cleaning_slot']}, Stabling Bay={entry['stabling_bay']}, Reason={entry['explainability']}")
    except Exception as e:
        logging.error(f"Error during execution: {str(e)}")
        raise