# app.py
from flask import Flask, request, jsonify
import pickle
import numpy as np

app = Flask(__name__)

# Load your models
first_model = pickle.load(open('first_model.pkl', 'rb'))
second_model = pickle.load(open('second_model.pkl', 'rb'))

@app.route('/predict', methods=['POST'])
def predict():
    data = request.json

    latitude = data['latitude']
    longitude = data['longitude']
    sample_type = data['sample_type']
    chemicals = data['chemicals']

    # Initialize results
    first_model_results = []
    second_model_results = []

    # First model predictions
    for distance in [5, 10, 15, 20, 25]:
        for chem in chemicals:
            input_features = [latitude, longitude, sample_type, distance] + chemicals[chem]
            prediction = first_model.predict([input_features])
            first_model_results.append({
                'distance': distance,
                'chemical': chem,
                'prediction': prediction[0]
            })

    # Get the furthest distance with the highest probability
    furthest_distance = max(first_model_results, key=lambda x: x['prediction'])['distance']

    # Second model predictions
    for depth in range(100):
        for chem in chemicals:
            input_features = [furthest_distance, depth, depth + 1, chemicals[chem]]
            prediction = second_model.predict([input_features])
            second_model_results.append({
                'depth_from': depth,
                'depth_to': depth + 1,
                'chemical': chem,
                'prediction': prediction[0]
            })

    return jsonify({
        'first_model_results': first_model_results,
        'second_model_results': second_model_results
    })

if __name__ == '__main__':
    app.run(debug=True)
