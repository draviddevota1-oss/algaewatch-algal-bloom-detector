from flask import Blueprint, request, jsonify
from services.algae_detection import run_algae_detection
import traceback

detection_bp = Blueprint("detection", __name__)


@detection_bp.route("/detect", methods=["POST"])
def detect():
    """
    Endpoint to run algae bloom detection.
    Expects JSON body:
    {
        "bbox": [min_lon, min_lat, max_lon, max_lat],
        "start_date": "YYYY-MM-DD",
        "end_date": "YYYY-MM-DD",
        "cloud_cover": 20
    }
    """
    try:
        data = request.get_json()

        bbox = data.get("bbox")
        start_date = data.get("start_date", "2022-01-01")
        end_date = data.get("end_date", "2022-01-31")
        cloud_cover = data.get("cloud_cover", 20)

        if not bbox or len(bbox) != 4:
            return jsonify({"error": "Invalid bounding box. Expected [min_lon, min_lat, max_lon, max_lat]"}), 400

        result = run_algae_detection(
            bbox=bbox,
            start_date=start_date,
            end_date=end_date,
            cloud_cover=cloud_cover,
        )

        return jsonify(result), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500
