# Python Optimization Engine

This directory contains the Python-based optimization engine that uses machine learning models to optimize train induction for KMRL.

## Files

- `python_optimization_service.py` - Main Python service that provides optimization API
- `model.py` - Enhanced machine learning model with NSGA-II optimization
- `model2.py` - Alternative model implementation
- `web.py` - Streamlit web interface (legacy)
- `dat.py` - Data generation utilities
- `requirements.txt` - Python dependencies
- `test_optimization.py` - Test script for the optimization service

## Model Files Required

The optimization service requires these pre-trained model files:
- `rf_model.pkl` - Random Forest model
- `scaler.pkl` - Data scaler
- `le_status.pkl` - Label encoder for status
- `induction_list.pkl` - Optimized induction list (generated)

## Setup

1. Install Python dependencies:
```bash
cd backend/engine
pip install -r requirements.txt
```

2. Ensure model files exist (train the model first if needed)

3. Test the service:
```bash
python test_optimization.py
```

## Usage

The Python service can be called from Node.js using the `PythonOptimizationService` class:

```typescript
import { PythonOptimizationService } from '../services/pythonOptimizationService';

const data = [
  {
    trainId: 'T001',
    fitnessCertificate: 95,
    jobCardStatus: 90,
    brandingPriority: 85,
    mileageBalancing: 80,
    cleaningDetailing: 75,
    stablingGeometry: 70
  }
];

const result = await PythonOptimizationService.runOptimization(data);
```

## API

The service accepts data in the following format:
- `trainId`: Train identifier
- `fitnessCertificate`: Fitness certificate score (0-100)
- `jobCardStatus`: Job card status score (0-100)
- `brandingPriority`: Branding priority score (0-100)
- `mileageBalancing`: Mileage balancing score (0-100)
- `cleaningDetailing`: Cleaning detailing score (0-100)
- `stablingGeometry`: Stabling geometry score (0-100)

Returns optimization results with:
- Overall score and ranking
- Induction status (revenue/standby/maintenance)
- Six-factor analysis scores
- Cleaning slot and stabling bay assignments
- Detailed explanations

## Health Check

Check if the Python service is running:
```bash
curl http://localhost:3000/api/upload/health
```
