#!/usr/bin/env python3
"""
Test script for the Python optimization service
"""

import json
import sys
import os

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from python_optimization_service import PythonOptimizationService

def test_optimization():
    """Test the optimization service with sample data"""
    
    # Sample test data
    test_data = [
        {
            "trainId": "T001",
            "fitnessCertificate": 95,
            "jobCardStatus": 90,
            "brandingPriority": 85,
            "mileageBalancing": 80,
            "cleaningDetailing": 75,
            "stablingGeometry": 70
        },
        {
            "trainId": "T002", 
            "fitnessCertificate": 60,
            "jobCardStatus": 45,
            "brandingPriority": 70,
            "mileageBalancing": 65,
            "cleaningDetailing": 50,
            "stablingGeometry": 55
        },
        {
            "trainId": "T003",
            "fitnessCertificate": 100,
            "jobCardStatus": 100,
            "brandingPriority": 100,
            "mileageBalancing": 95,
            "cleaningDetailing": 90,
            "stablingGeometry": 85
        }
    ]
    
    print("Testing Python Optimization Service...")
    print("=" * 50)
    
    # Create service instance
    service = PythonOptimizationService()
    
    # Check if model is loaded
    if not service.model:
        print("❌ Model not loaded. Please ensure model files exist:")
        print("   - rf_model.pkl")
        print("   - scaler.pkl") 
        print("   - le_status.pkl")
        return False
    
    print("✅ Model loaded successfully")
    
    # Run optimization
    print("\nRunning optimization...")
    result = service.run_optimization(test_data)
    
    if result['success']:
        print("✅ Optimization completed successfully")
        print(f"\nSummary:")
        print(f"  Total Trains: {result['summary']['total_trains']}")
        print(f"  Revenue Trains: {result['summary']['revenue_trains']}")
        print(f"  Standby Trains: {result['summary']['standby_trains']}")
        print(f"  Maintenance Trains: {result['summary']['maintenance_trains']}")
        print(f"  Average Score: {result['summary']['average_score']}")
        print(f"  Highest Score: {result['summary']['highest_score']}")
        print(f"  Lowest Score: {result['summary']['lowest_score']}")
        
        print(f"\nDetailed Results:")
        print("-" * 80)
        for i, train in enumerate(result['results'], 1):
            print(f"{i:2d}. {train['train_id']:4s} | "
                  f"Status: {train['induction_status']:10s} | "
                  f"Score: {train['overall_score']:5.1f} | "
                  f"Fitness: {train['fitness_score']:5.1f} | "
                  f"Job Card: {train['job_card_score']:5.1f} | "
                  f"Branding: {train['branding_score']:5.1f}")
        
        return True
    else:
        print(f"❌ Optimization failed: {result['error']}")
        return False

if __name__ == "__main__":
    success = test_optimization()
    sys.exit(0 if success else 1)
