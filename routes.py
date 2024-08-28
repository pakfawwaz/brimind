from flask import Blueprint, jsonify
import requests
# api routes
api_routes = Blueprint('api_routes', __name__)

@api_routes.route('/api/data', methods=['GET'])
def get_data():
    return jsonify({"message": "Hello from Flask!"})

@api_routes.route('/api/testing', methods=['GET'])
def get_testing():
    try:
        response = requests.get('https://reqres.in/api/users')
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500
