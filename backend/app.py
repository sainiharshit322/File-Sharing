from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import os
import uuid
from mega import Mega

app = Flask(__name__)
CORS(app)

# Initialize MEGA
mega = Mega()
email = "email"  # Change to your MEGA email
password = "password"  # Change to your MEGA password
m = mega.login(email, password)

# Define folder name in MEGA where all files will be stored
MEGA_FOLDER_NAME = "Shared Files"
uploaded_files = {}


folders = m.get_files()
folder_id = None

for file_id, file_info in folders.items():
    if file_info["a"].get("n") == MEGA_FOLDER_NAME and file_info["t"] == 1:  # 't' == 1 means it's a folder
        folder_id = file_id
        break

if not folder_id:
    folder = m.create_folder(MEGA_FOLDER_NAME)
    folder_id = list(folder.values())[0]  # Get folder ID

@app.route("/upload", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file provided"}), 400

    file = request.files["file"]
    file_id = str(uuid.uuid4())
    timestamp = datetime.now() + timedelta(minutes=15)

    try:
        # Save file temporarily
        temp_path = f"temp_{file.filename}"
        file.save(temp_path)

        # Upload to MEGA inside the specific folder
        uploaded_file = m.upload(temp_path, folder_id)
        file_link = m.get_upload_link(uploaded_file)

        # Store metadata
        uploaded_files[file_id] = {
            "filename": file.filename,
            "download_url": file_link,
            "expires_at": timestamp
        }

        # Delete local file after upload
        os.remove(temp_path)

        return jsonify({
            "file_id": file_id,
            "download_url": file_link,
            "expires_at": timestamp
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/files", methods=["GET"])
def get_files():
    now = datetime.now()
    valid_files = {k: v for k, v in uploaded_files.items() if v["expires_at"] > now}
    return jsonify([
        {"file_id": k, "filename": v["filename"], "expires_at": v["expires_at"]}
        for k, v in valid_files.items()
    ])

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

    try:
        # Find and delete the file inside the MEGA folder
        files = m.get_files()
        for file_id_mega, file_info in files.items():
            if file_info["a"]["n"] == file_data["filename"] and file_info["p"] == folder_id:
                m.delete(file_id_mega)
                return jsonify({"message": "File deleted successfully"})

        return jsonify({"error": "File not found on MEGA"}), 404

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)






