#!/usr/bin/env python3
"""
Python optimization service for KMRL train induction
This service provides an API to run optimization using the pre-trained model
"""

import sys
import json
import pandas as pd
import numpy as np
import pickle
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the model functions
from model import EnhancedTrainInductionModel, load_dataset, safe_create_deap_types

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PythonOptimizationService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.le_status = None
        self.feature_names = []
        self.numerical_features = []
        self.load_model()
    
    def load_model(self):
        """Load the pre-trained model and related objects"""
        try:
            model_path = os.path.join(os.path.dirname(__file__), 'rf_model.pkl')
            scaler_path = os.path.join(os.path.dirname(__file__), 'scaler.pkl')
            le_status_path = os.path.join(os.path.dirname(__file__), 'le_status.pkl')
            
            if not all(os.path.exists(p) for p in [model_path, scaler_path, le_status_path]):
                logger.error("Model files not found. Please train the model first.")
                return False
            
            with open(model_path, 'rb') as f:
                self.model = pickle.load(f)
            with open(scaler_path, 'rb') as f:
                self.scaler = pickle.load(f)
            with open(le_status_path, 'rb') as f:
                self.le_status = pickle.load(f)
            
            logger.info("Successfully loaded pre-trained model, scaler, and label encoder")
            return True
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            return False
    
    def preprocess_uploaded_data(self, data: List[Dict[str, Any]]) -> Optional[pd.DataFrame]:
        """Preprocess uploaded data to match model requirements"""
        try:
            df = pd.DataFrame(data)
            
            # Required columns mapping from frontend to model
            column_mapping = {
                'trainId': 'train_id',
                'fitnessCertificate': 'fitness_score',
                'jobCardStatus': 'job_card_status',
                'brandingPriority': 'branding_hours',
                'mileageBalancing': 'mileage',
                'cleaningDetailing': 'cleaning_slot',
                'stablingGeometry': 'stabling_bay'
            }
            
            # Rename columns if they exist
            for old_col, new_col in column_mapping.items():
                if old_col in df.columns:
                    df[new_col] = df[old_col]
            
            # Ensure required columns exist with defaults
            required_columns = [
                'train_id', 'rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness',
                'job_card_status', 'branding_hours', 'branding_total', 'mileage',
                'cleaning_slot', 'stabling_bay', 'shunting_time_minutes',
                'is_serviceable', 'branding_sla_met', 'mileage_balance_deviation'
            ]
            
            # Add missing columns with default values
            for col in required_columns:
                if col not in df.columns:
                    if col == 'train_id':
                        df[col] = [f'T{i+1:03d}' for i in range(len(df))]
                    elif col in ['rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness', 'is_serviceable', 'branding_sla_met']:
                        df[col] = 1  # Default to valid
                    elif col == 'job_card_status':
                        df[col] = 'closed'  # Default to closed
                    elif col in ['branding_hours', 'branding_total']:
                        df[col] = 8.0  # Default SLA hours
                    elif col == 'mileage':
                        df[col] = 50000.0  # Default mileage
                    elif col == 'cleaning_slot':
                        df[col] = 0  # Default no cleaning slot
                    elif col == 'stabling_bay':
                        df[col] = 0  # Default no bay assigned
                    elif col == 'shunting_time_minutes':
                        df[col] = 30.0  # Default shunting time
                    elif col == 'mileage_balance_deviation':
                        df[col] = 0.0  # Default no deviation
            
            # Convert data types
            df['rolling_stock_fitness'] = df['rolling_stock_fitness'].astype(int)
            df['signalling_fitness'] = df['signalling_fitness'].astype(int)
            df['telecom_fitness'] = df['telecom_fitness'].astype(int)
            df['is_serviceable'] = df['is_serviceable'].astype(int)
            df['branding_sla_met'] = df['branding_sla_met'].astype(int)
            df['cleaning_slot'] = df['cleaning_slot'].fillna(0).astype(int).clip(0, 5)
            df['stabling_bay'] = df['stabling_bay'].fillna(0).astype(int).clip(0, 10)
            df['branding_hours'] = df['branding_hours'].fillna(8.0).astype(float)
            df['branding_total'] = df['branding_total'].fillna(8.0).astype(float)
            df['mileage'] = df['mileage'].fillna(50000.0).astype(float)
            df['shunting_time_minutes'] = df['shunting_time_minutes'].fillna(30.0).astype(float)
            df['mileage_balance_deviation'] = df['mileage_balance_deviation'].fillna(0.0).astype(float)
            
            # Calculate derived features
            df['fitness_score'] = (df['rolling_stock_fitness'] + df['signalling_fitness'] + df['telecom_fitness']) / 3.0
            df['branding_efficiency'] = np.where(df['branding_total'] > 0, df['branding_hours'] / df['branding_total'], 0)
            df['branding_deficit'] = (df['branding_total'] - df['branding_hours']).clip(lower=0)
            df['branding_urgency'] = df['branding_deficit'] / (df['branding_total'] + 1e-6)
            df['mileage_utilization'] = df['mileage'] / (df['branding_total'] + 1e-6)
            df['maintenance_urgency'] = (
                (1 - df['fitness_score']) * 0.4 +
                (df['mileage_balance_deviation'] / (df['mileage'] + 1e-6)) * 0.3 +
                df['branding_urgency'] * 0.3
            )
            df['cleaning_priority'] = ((df['cleaning_slot'] == 0) & (df['is_serviceable'] == 1)).astype(int)
            df['bay_efficiency'] = np.where(df['stabling_bay'] > 0, 1 / df['stabling_bay'], 0)
            
            # Add date column for consistency
            df['date'] = datetime.now().strftime('%Y-%m-%d')
            
            logger.info(f"Successfully preprocessed {len(df)} records")
            return df
            
        except Exception as e:
            logger.error(f"Error preprocessing data: {str(e)}")
            return None
    
    def run_optimization(self, data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Run optimization on the provided data"""
        try:
            if not self.model or not self.scaler or not self.le_status:
                return {
                    'success': False,
                    'error': 'Model not loaded. Please train the model first.'
                }
            
            # Preprocess the data
            df = self.preprocess_uploaded_data(data)
            if df is None:
                return {
                    'success': False,
                    'error': 'Failed to preprocess data'
                }
            
            # Align with exact training feature order from model2.preprocess_data
            # features = ['rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness',
            #             'job_card_status', 'branding_hours', 'branding_total', 'mileage',
            #             'cleaning_slot', 'stabling_bay', 'shunting_time_minutes',
            #             'is_serviceable', 'branding_sla_met', 'mileage_balance_deviation']
            all_features = [
                'rolling_stock_fitness', 'signalling_fitness', 'telecom_fitness',
                'job_card_status', 'branding_hours', 'branding_total', 'mileage',
                'cleaning_slot', 'stabling_bay', 'shunting_time_minutes',
                'is_serviceable', 'branding_sla_met', 'mileage_balance_deviation'
            ]
            numerical_features = [
                'branding_hours', 'branding_total', 'mileage',
                'shunting_time_minutes', 'mileage_balance_deviation'
            ]
            
            # Ensure all features exist
            for feature in all_features:
                if feature not in df.columns:
                    df[feature] = 0
            
            X = df[all_features].copy()

            # Encode job_card_status similar to training (label encoding of strings)
            # If numeric is provided (e.g., percentages), coerce to categories first.
            if pd.api.types.is_numeric_dtype(X['job_card_status']):
                X['job_card_status'] = np.where(X['job_card_status'] >= 50, 'closed', 'open')
            X['job_card_status'] = X['job_card_status'].fillna('unknown').astype(str)
            # Fallback encoding without the original encoder: stable factorize mapping
            X['job_card_status'] = pd.factorize(X['job_card_status'])[0]

            # Scale numerical features exactly as in training
            X.loc[:, numerical_features] = self.scaler.transform(X[numerical_features])

            # Predict induction status
            predictions = self.model.predict(X)
            
            # Calculate scores and rankings
            results = []
            for idx, (_, row) in enumerate(df.iterrows()):
                prediction = predictions[idx]
                
                # Calculate overall score based on factors
                fitness_score = row['fitness_score'] * 100
                job_card_score = 100 if row['job_card_status'] == 'closed' else 0
                branding_score = min(100, (row['branding_hours'] / 8.0) * 100)  # 8 hours is SLA
                mileage_score = max(0, 100 - (row['mileage_balance_deviation'] / 1000))
                cleaning_score = 100 if row['cleaning_slot'] > 0 else 50
                geometry_score = 100 if row['stabling_bay'] > 0 else 50
                
                # Weighted overall score
                overall_score = (
                    fitness_score * 0.25 +
                    job_card_score * 0.20 +
                    branding_score * 0.15 +
                    mileage_score * 0.15 +
                    cleaning_score * 0.10 +
                    geometry_score * 0.15
                )
                
                # Determine induction status based on prediction and score
                if prediction == 1 and overall_score >= 70:
                    induction_status = 'revenue'
                elif prediction == 2 or (prediction == 1 and overall_score >= 50):
                    induction_status = 'standby'
                else:
                    induction_status = 'maintenance'
                
                result = {
                    'train_id': row['train_id'],
                    'induction_status': induction_status,
                    'overall_score': round(overall_score, 2),
                    'fitness_score': round(fitness_score, 2),
                    'job_card_score': round(job_card_score, 2),
                    'branding_score': round(branding_score, 2),
                    'mileage_score': round(mileage_score, 2),
                    'cleaning_score': round(cleaning_score, 2),
                    'geometry_score': round(geometry_score, 2),
                    'cleaning_slot': int(row['cleaning_slot']),
                    'stabling_bay': int(row['stabling_bay']),
                    'explainability': f"Score: {overall_score:.1f} - Fitness: {fitness_score:.1f}, Job Card: {job_card_score:.1f}, Branding: {branding_score:.1f}, Mileage: {mileage_score:.1f}, Cleaning: {cleaning_score:.1f}, Geometry: {geometry_score:.1f}"
                }
                results.append(result)
            
            # Sort by overall score (descending)
            results.sort(key=lambda x: x['overall_score'], reverse=True)
            
            # Calculate summary statistics
            total_trains = len(results)
            revenue_trains = len([r for r in results if r['induction_status'] == 'revenue'])
            standby_trains = len([r for r in results if r['induction_status'] == 'standby'])
            maintenance_trains = len([r for r in results if r['induction_status'] == 'maintenance'])
            average_score = sum(r['overall_score'] for r in results) / total_trains if total_trains > 0 else 0
            
            return {
                'success': True,
                'results': results,
                'summary': {
                    'total_trains': total_trains,
                    'revenue_trains': revenue_trains,
                    'standby_trains': standby_trains,
                    'maintenance_trains': maintenance_trains,
                    'average_score': round(average_score, 2),
                    'highest_score': max(r['overall_score'] for r in results) if results else 0,
                    'lowest_score': min(r['overall_score'] for r in results) if results else 0
                }
            }
            
        except Exception as e:
            logger.error(f"Error running optimization: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

def main():
    """Main function for command line usage"""
    if len(sys.argv) < 2:
        print("Usage: python python_optimization_service.py <json_data>")
        sys.exit(1)
    
    try:
        # Parse input data
        input_data = json.loads(sys.argv[1])
        
        # Create service and run optimization
        service = PythonOptimizationService()
        result = service.run_optimization(input_data)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        error_result = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
