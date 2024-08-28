from flask import Flask, render_template
from flask_cors import CORS

import os
app = Flask(__name__)
CORS(app)

from routes import api_routes
app.register_blueprint(api_routes)

# web routes
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)