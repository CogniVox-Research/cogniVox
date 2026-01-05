# CogniVox Biometric Service

A FastAPI-based stress prediction service that uses machine learning models trained on the WESAD (Wearable Stress and Affect Detection) dataset to classify stress levels from physiological signals.

## Overview

This service provides real-time stress detection through two specialized machine learning models:

- **RF Model**: Full-featured Random Forest model using EDA, BVP, temperature, and accelerometer data
- **Lite Model**: Lightweight Random Forest model using only BVP and accelerometer data (ideal for devices without EDA sensors)

The API automatically selects the appropriate model based on the input features provided.

## Features

- Dual-model architecture for flexible deployment scenarios
- Automatic model selection based on available sensor data
- Granular stress level classification with actionable suggestions
- RESTful API with JSON input/output
- Pre-trained models included for immediate deployment

## Project Structure

```
biometric_service/
├── app.py                                    # FastAPI application server
├── test_api.py                              # API testing script
├── cognivox_wesad_rf.joblib                 # Full RF model (with EDA)
├── cognivox_wesad_lite_enhanced.joblib      # Lite model (BVP + ACC only)
└── training/                                # Model training scripts
    ├── cognivox_wesad_Model.py              # RF model training
    ├── cognivox_wesad_Model.ipynb           # RF model notebook
    ├── cognivox_wesad_lite_enhanced.py      # Lite model training
    └── cognivox_wesad_lite_enhanced.ipynb   # Lite model notebook
```

## Requirements

- Python 3.7+
- FastAPI
- Uvicorn
- Pydantic
- NumPy
- Scikit-learn
- Joblib

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd biometric_service
```

2. Install dependencies:
```bash
pip install fastapi uvicorn pydantic numpy scikit-learn joblib
```

## Usage

### Starting the Server

Run the FastAPI server:

```bash
python app.py
```

The server will start on `http://0.0.0.0:8000` and be accessible via your local IP address.

### API Endpoint

**POST** `/predict_stress`

#### Request Body

The API accepts a JSON payload with the following optional fields:

**For RF Model (with EDA sensor):**
```json
{
  "eda_mean": 0.5,
  "eda_std": 0.1,
  "eda_min": 0.2,
  "eda_max": 0.8,
  "bvp_mean": 0.5,
  "bvp_std": 0.1,
  "temp_mean": 30.0,
  "temp_std": 0.5,
  "acc_mag_mean": 1.0,
  "acc_mag_std": 0.1
}
```

**For Lite Model (without EDA sensor):**
```json
{
  "bvp_mean": 0.5,
  "bvp_std": 0.1,
  "bvp_min": 0.0,
  "bvp_max": 1.0,
  "bvp_range": 1.0,
  "bvp_energy": 0.5,
  "acc_mean": 0.5,
  "acc_std": 0.1,
  "acc_max": 1.0
}
```

#### Response

```json
{
  "model_used": "RF",
  "label": 1,
  "stress_score": 0.75,
  "suggestion": "State: Stressed. Detected physiological stress. Try 'Box Breathing' (4s in, 4s hold, 4s out, 4s hold)."
}
```

**Response Fields:**
- `model_used`: Which model was used ("RF" or "Lite")
- `label`: Binary classification (0 = non-stressed, 1 = stressed)
- `stress_score`: Probability score between 0.0 and 1.0
- `suggestion`: Contextual feedback based on stress level

### Stress Level Zones

The service provides granular feedback based on stress score ranges:

| Score Range | State | Suggestion |
|-------------|-------|------------|
| 0.0 - 0.2 | Deeply Relaxed | Excellent condition. Great for focus or recovery. |
| 0.2 - 0.45 | Calm | You are balanced and doing well. Keep it up. |
| 0.45 - 0.6 | Elevated | You may be experiencing slight pressure. Consider a short break soon. |
| 0.6 - 0.8 | Stressed | Detected physiological stress. Try 'Box Breathing' (4s in, 4s hold, 4s out, 4s hold). |
| 0.8 - 1.0 | Highly Stressed | Strong markers detected. Stop what you are doing, close your eyes, and take 5 deep breaths. |

### Testing the API

Use the provided test script:

```bash
python test_api.py
```

This will send sample requests to both models and display the responses.

## Model Details

### RF Model (Full)

- **Features**: 10 features from EDA, BVP, temperature, and accelerometer
- **Algorithm**: Random Forest Classifier
- **Training Data**: WESAD dataset
- **Window**: 10-second windows with 5-second step
- **Use Case**: Devices with full sensor suite (e.g., Empatica E4)

### Lite Model (Enhanced)

- **Features**: 9 features from BVP and accelerometer only
- **Algorithm**: Random Forest Classifier (300 estimators)
- **Training Data**: WESAD dataset
- **Window**: 10-second windows with 5-second step
- **Use Case**: Smartwatches and fitness trackers without EDA sensors

## Model Training

The training scripts are located in the `training/` directory. Both Python scripts and Jupyter notebooks are provided for:

1. **RF Model Training** (`cognivox_wesad_Model.py`):
   - Loads WESAD dataset
   - Extracts features from all sensors
   - Trains Random Forest classifier
   - Exports model to joblib format

2. **Lite Model Training** (`cognivox_wesad_lite_enhanced.py`):
   - Loads WESAD dataset
   - Extracts enhanced BVP and accelerometer features
   - Trains optimized Random Forest classifier
   - Exports model to joblib format

### Training Requirements

- Access to WESAD dataset
- Google Colab or local Python environment
- Additional packages: pandas, scipy

## Integration

This service is designed to work with the CogniVox mobile application ecosystem, receiving real-time physiological data from wearable devices and returning stress predictions.

### Example Integration Flow

1. Wearable device collects sensor data (BVP, ACC, optionally EDA)
2. Mobile app calculates statistical features over 10-second windows
3. Features are sent to this API endpoint
4. API returns stress classification and actionable suggestions
5. Mobile app displays results to user

## Performance Considerations

- Models are loaded once at startup for fast inference
- Prediction latency is typically under 100ms
- Server can handle multiple concurrent requests
- Model files are approximately 2-32 MB in size

## License

This project uses the WESAD dataset for training. Please refer to the WESAD dataset license for usage restrictions.

## Citation

If you use this service in your research, please cite the WESAD dataset:

```
Schmidt, P., Reiss, A., Duerichen, R., Marberger, C. and Van Laerhoven, K., 2018, September. 
Introducing WESAD, a multimodal dataset for wearable stress and affect detection. 
In Proceedings of the 20th ACM international conference on multimodal interaction (pp. 400-408).
```

## Support

For issues, questions, or contributions, please contact the CogniVox development team.
