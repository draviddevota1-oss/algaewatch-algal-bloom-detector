from flask import Blueprint, send_file, jsonify
import os

download_bp = Blueprint("download", __name__)

RESULTS_DIR = os.path.join(os.path.dirname(__file__), "..", "results")


@download_bp.route("/download/<filename>", methods=["GET"])
def download(filename):
    """Download a result image by filename."""
    safe_name = os.path.basename(filename)
    filepath = os.path.join(RESULTS_DIR, safe_name)

    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404

    return send_file(
        filepath,
        mimetype="image/png",
        as_attachment=True,
        download_name=safe_name,
    )


@download_bp.route("/results/<filename>", methods=["GET"])
def serve_result(filename):
    """Serve a result image for display (not attachment)."""
    safe_name = os.path.basename(filename)
    filepath = os.path.join(RESULTS_DIR, safe_name)

    if not os.path.exists(filepath):
        return jsonify({"error": "File not found"}), 404

    return send_file(filepath, mimetype="image/png")
