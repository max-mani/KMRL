# model_enhanced_no_shap.py
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, f1_score
from xgboost import XGBClassifier
from deap import base, creator, tools, algorithms
import random
import pickle
import logging
import warnings
from datetime import datetime

warnings.filterwarnings("ignore")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Default Configuration
DEFAULT_NUM_TRAINSETS = 25
DEFAULT_CLEANING_SLOTS = 5
DEFAULT_DEPOT_BAYS = 10
DEFAULT_MIN_REVENUE_TRAINS = 15

class EnhancedTrainInductionModel:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.preprocessor = None
        self.feature_names = []
        self.categorical_features = ['job_card_status']
        self.numerical_features = [
            'rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness',
            'is_serviceable', 'branding_sla_met', 'branding_hours', 
            'branding_total', 'mileage', 'shunting_time_minutes',
            'cleaning_slot', 'stabling_bay', 'mileage_balance_deviation'
        ]
        self.derived_features = []
        
    def create_derived_features(self, df):
        """Create advanced derived features for better model performance"""
        df = df.copy()
        
        # Branding efficiency metrics
        df['branding_efficiency'] = np.where(
            df['branding_total'] > 0,
            df['branding_hours'] / df['branding_total'],
            0
        )
        df['branding_deficit'] = (df['branding_total'] - df['branding_hours']).clip(lower=0)
        df['branding_urgency'] = df['branding_deficit'] / (df['branding_total'] + 1e-6)
        
        # Fitness composite score
        df['fitness_score'] = (
            df['rolling_stock_fitness'] + 
            df['signalling_fitness'] + 
            df['telecom_fitness']
        ) / 3.0
        
        # Maintenance urgency indicators
        df['mileage_utilization'] = df['mileage'] / (df['branding_total'] + 1e-6)
        df['maintenance_urgency'] = (
            (1 - df['fitness_score']) * 0.4 +
            (df['mileage_balance_deviation'] / (df['mileage'] + 1e-6)) * 0.3 +
            (df['branding_urgency']) * 0.3
        )
        
        # Operational constraints
        df['cleaning_priority'] = ((df['cleaning_slot'] == 0) & (df['is_serviceable'] == 1)).astype(int)
        df['bay_efficiency'] = np.where(
            df['stabling_bay'] > 0,
            1 / (df['stabling_bay']),  # Lower bay numbers are more efficient
            0
        )
        
        # Time-based features (if date available)
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'])
            df['day_of_week'] = df['date'].dt.dayofweek
            df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        self.derived_features = [
            'branding_efficiency', 'branding_deficit', 'branding_urgency',
            'fitness_score', 'mileage_utilization', 'maintenance_urgency',
            'cleaning_priority', 'bay_efficiency'
        ]
        
        if 'day_of_week' in df.columns:
            self.derived_features.extend(['day_of_week', 'is_weekend'])
            
        return df

    def build_preprocessor(self):
        """Build advanced preprocessing pipeline"""
        numerical_transformer = Pipeline(steps=[
            ('scaler', StandardScaler())
        ])
        
        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore', sparse_output=False))
        ])
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', numerical_transformer, self.numerical_features),
                ('cat', categorical_transformer, self.categorical_features)
            ]
        )
        
    def preprocess_data(self, df, training=True):
        """Enhanced preprocessing with derived features"""
        df = self.create_derived_features(df)
        
        # Prepare feature set
        all_features = self.numerical_features + self.categorical_features + self.derived_features
        
        # Ensure all expected columns exist
        for feature in all_features:
            if feature not in df.columns:
                df[feature] = 0  # Add missing features with default value
        
        X = df[all_features]
        
        if training:
            self.build_preprocessor()
            X_processed = self.preprocessor.fit_transform(X)
            
            # Get feature names after preprocessing
            numerical_names = self.numerical_features
            categorical_names = self.preprocessor.named_transformers_['cat'].named_steps['onehot'].get_feature_names_out(self.categorical_features)
            derived_names = self.derived_features
            
            self.feature_names = list(numerical_names) + list(categorical_names) + list(derived_names)
        else:
            X_processed = self.preprocessor.transform(X)
            
        return X_processed

    def train_model(self, X, y, model_type='xgboost', tune_hyperparams=True):
        """Train with choice of model and hyperparameter tuning"""
        
        if model_type == 'xgboost':
            if tune_hyperparams:
                param_grid = {
                    'n_estimators': [100, 200, 300],
                    'max_depth': [3, 6, 9],
                    'learning_rate': [0.01, 0.1, 0.2],
                    'subsample': [0.8, 0.9, 1.0]
                }
                model = XGBClassifier(random_state=42, eval_metric='logloss')
                gs = GridSearchCV(model, param_grid, cv=5, scoring='f1_macro', n_jobs=-1, verbose=1)
                gs.fit(X, y)
                self.model = gs.best_estimator_
                logging.info(f"XGBoost best params: {gs.best_params_}")
            else:
                self.model = XGBClassifier(
                    n_estimators=200, max_depth=6, learning_rate=0.1,
                    subsample=0.9, random_state=42, eval_metric='logloss'
                )
                self.model.fit(X, y)
                
        elif model_type == 'random_forest':
            if tune_hyperparams:
                param_grid = {
                    'n_estimators': [100, 200, 300],
                    'max_depth': [None, 10, 20],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                }
                model = RandomForestClassifier(random_state=42, class_weight='balanced')
                gs = GridSearchCV(model, param_grid, cv=5, scoring='f1_macro', n_jobs=-1, verbose=1)
                gs.fit(X, y)
                self.model = gs.best_estimator_
                logging.info(f"Random Forest best params: {gs.best_params_}")
            else:
                self.model = RandomForestClassifier(
                    n_estimators=200, random_state=42, 
                    class_weight='balanced', max_depth=20
                )
                self.model.fit(X, y)
        
        # Cross-validation score
        cv_scores = cross_val_score(self.model, X, y, cv=5, scoring='f1_macro')
        logging.info(f"Cross-validation F1 scores: {cv_scores}")
        logging.info(f"Mean CV F1: {cv_scores.mean():.3f} (+/- {cv_scores.std() * 2:.3f})")
        
        return self.model

    def predict_with_confidence(self, X):
        """Predict with confidence scores"""
        if hasattr(self.model, 'predict_proba'):
            probabilities = self.model.predict_proba(X)
            confidence = np.max(probabilities, axis=1)
            predictions = self.model.predict(X)
            return predictions, confidence, probabilities
        else:
            predictions = self.model.predict(X)
            return predictions, np.ones(len(predictions)), None

    def get_feature_importance(self):
        """Get feature importance without SHAP"""
        if hasattr(self.model, 'feature_importances_'):
            importance_df = pd.DataFrame({
                'feature': self.feature_names,
                'importance': self.model.feature_importances_
            }).sort_values('importance', ascending=False)
            return importance_df
        return None

# Enhanced NSGA-II evaluation
def enhanced_evaluate_individual(individual, df_day, model, preprocessor, feature_names,
                                min_revenue_trains=DEFAULT_MIN_REVENUE_TRAINS,
                                cleaning_slots=DEFAULT_CLEANING_SLOTS,
                                depot_bays=DEFAULT_DEPOT_BAYS,
                                weights=None):
    """
    Enhanced multi-objective evaluation with better objective functions
    """
    if weights is None:
        weights = {
            'branding': 1.0, 'mileage': 1.0, 'shunting': 1.0,
            'fitness': 1.0, 'efficiency': 1.0
        }

    readiness_score = 0
    total_cost = 0.0
    sla_penalty = 0.0
    shunting_time = 0.0
    fitness_score = 0.0
    efficiency_score = 0.0
    revenue_count = 0
    bay_usage = set()
    cleaning_usage = set()
    mileage_list = []
    branding_deficits = []

    # Prepare features for prediction
    features_df = df_day.iloc[list(individual)][feature_names].copy()
    X_processed = preprocessor.transform(features_df)
    
    # Predict with confidence
    predictions, confidence, _ = model.predict_with_confidence(X_processed)

    for idx, (pred, conf) in enumerate(zip(predictions, confidence)):
        row = df_day.iloc[idx]
        original_idx = individual[idx]

        # Hard constraint enforcement
        if row.get('is_serviceable', 0) == 0 and pred != 0:
            pred = 0  # Force maintenance if not serviceable

        if pred == 1:  # revenue/service
            readiness_score += 1
            revenue_count += 1
            
            # Enhanced SLA penalty with urgency consideration
            deficit = float(row.get('branding_deficit', 0.0))
            urgency = float(row.get('branding_urgency', 0.0))
            sla_penalty += deficit * (1 + urgency) * weights.get('branding', 1.0)
            branding_deficits.append(deficit)
            
            # Enhanced shunting with bay efficiency
            base_shunting = float(row.get('shunting_time_minutes', 0.0))
            bay_efficiency = float(row.get('bay_efficiency', 1.0))
            shunting_time += base_shunting * (2 - bay_efficiency) * weights.get('shunting', 1.0)
            
            # Fitness contribution
            fitness = float(row.get('fitness_score', 0.0))
            fitness_score += fitness * weights.get('fitness', 1.0)
            
            # Efficiency metrics
            efficiency = float(row.get('branding_efficiency', 0.0))
            efficiency_score += efficiency * weights.get('efficiency', 1.0)
            
            mileage_list.append(float(row.get('mileage', 0.0)))
            
            # Resource usage
            bay = int(row.get('stabling_bay', 0))
            if 0 < bay <= depot_bays:
                bay_usage.add(bay)
                
            cleaning_slot = int(row.get('cleaning_slot', 0))
            if 0 < cleaning_slot <= cleaning_slots:
                cleaning_usage.add(cleaning_slot)
                
        elif pred == 0:  # maintenance
            maintenance_cost = float(row.get('maintenance_cost', 10.0))
            urgency = float(row.get('maintenance_urgency', 0.0))
            total_cost += maintenance_cost * (1 + urgency)

    # Enhanced constraints with progressive penalties
    revenue_penalty = max(0, min_revenue_trains - revenue_count) ** 2 * 1000
    bay_penalty = max(0, len(bay_usage) - depot_bays) * 500
    cleaning_penalty = max(0, len(cleaning_usage) - cleaning_slots) * 300
    
    # Enhanced mileage variance with distribution consideration
    if len(mileage_list) > 1:
        mileage_variance = np.var(mileage_list) * weights.get('mileage', 1.0)
        # Penalize uneven mileage distribution
        mileage_penalty = np.std(mileage_list) / (np.mean(mileage_list) + 1e-6) * 100
    else:
        mileage_variance = 0.0
        mileage_penalty = 1000  # Heavy penalty if no revenue trains

    # Enhanced branding deficit variance penalty
    if branding_deficits:
        branding_variance_penalty = np.var(branding_deficits) * 10
    else:
        branding_variance_penalty = 0

    total_penalty = (
        revenue_penalty + bay_penalty + cleaning_penalty + 
        mileage_penalty + branding_variance_penalty
    )

    # Return objectives (maximize readiness and fitness, minimize others)
    return (
        readiness_score + fitness_score + efficiency_score,  # Maximize
        -total_cost - total_penalty,  # Minimize (negative for minimization)
        -sla_penalty,  # Minimize
        -shunting_time,  # Minimize
        -mileage_variance,  # Minimize
        -total_penalty  # Minimize
    )

def safe_create_deap_types():
    """Create DEAP creator types if not already created"""
    if "FitnessMulti" not in creator.__dict__:
        creator.create("FitnessMulti", base.Fitness, weights=(1.0, -1.0, -1.0, -1.0, -1.0, -1.0))
    if "Individual" not in creator.__dict__:
        creator.create("Individual", list, fitness=creator.FitnessMulti)

def load_dataset(file_path):
    """Load dataset from CSV"""
    try:
        df = pd.read_csv(file_path)
        logging.info(f"Loaded dataset with {len(df)} rows from {file_path}")
        return df
    except Exception as e:
        logging.error(f"Error loading dataset: {str(e)}")
        raise

# Save enhanced model components
def save_enhanced_model(model, filename="enhanced_model.pkl"):
    """Save the complete enhanced model"""
    with open(filename, "wb") as f:
        pickle.dump(model, f)
    logging.info(f"Enhanced model saved to {filename}")

def load_enhanced_model(filename="enhanced_model.pkl"):
    """Load the enhanced model"""
    with open(filename, "rb") as f:
        model = pickle.load(f)
    logging.info(f"Enhanced model loaded from {filename}")
    return model

## Chatbot implementation removed from the Python engine.