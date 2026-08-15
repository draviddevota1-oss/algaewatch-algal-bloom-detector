from flask import Flask
from flask_cors import CORS
from routes.detection import detection_bp
from routes.download import download_bp

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(detection_bp, url_prefix="/api")
app.register_blueprint(download_bp, url_prefix="/api")

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
