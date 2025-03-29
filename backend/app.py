import cloudinary
import cloudinary.uploader
import cloudinary.api
from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
from dotenv import load_dotenv
import os
from flask_socketio import SocketIO
import uuid

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

load_dotenv()

cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME"),
    api_key=os.getenv("API_KEY"),
    api_secret=os.getenv("API_SECRET")
)

uploaded_files = {}

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    file_id = str(uuid.uuid4())
    timestamp = datetime.now() + timedelta(minutes=15)
    try:
        upload_result = cloudinary.uploader.upload(file, resource_type="auto")

        download_url = upload_result["secure_url"]
        public_id = upload_result["public_id"]

        uploaded_files[file_id] = {
            "filename": file.filename,
            "download_url": download_url,
            "public_id": public_id,
            "expires_at": timestamp
        }

        return jsonify({
            "file_id": file_id,
            "download_url": download_url,
            "public_id": public_id,
            "expires_at": timestamp
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/files", methods=["GET"])
def get_files():
    now = datetime.now()
    valid_files = {
        k: v for k, v in uploaded_files.items() if v["expires_at"] > now
    }
    return jsonify([{"file_id": k, "filename": v["filename"], "expires_at": v["expires_at"]} for k, v in valid_files.items()])

@app.route("/download/<file_id>", methods=["GET"])
def download_file(file_id):
    if file_id in uploaded_files:
        file_info = uploaded_files[file_id]
        if datetime.now() > file_info["expires_at"]:
            return jsonify({"error": "Link expired"}), 410
        return jsonify({"download_url": file_info["download_url"]})
    return jsonify({"error": "File not found"}), 404

@app.route("/delete/<file_id>", methods=["DELETE"])
def delete_file(file_id):
    if file_id not in uploaded_files:
        return jsonify({"error": "File not found"}), 404

    file_data = uploaded_files.pop(file_id)
    public_id = file_data.get("public_id")

    if not public_id:
        return jsonify({"error": "Public ID missing"}), 400

    try:
        cloudinary.uploader.destroy(public_id)

        return jsonify({"message": "File deleted successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
