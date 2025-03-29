import React, { useState, useEffect } from "react";
import api from "./api";
import { io } from "socket.io-client";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

const socket = io("http://localhost:5000");

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchFiles();
    socket.on("file_uploaded", (data) => {
      toast.success(`New file uploaded: ${data.filename}`);
      fetchFiles();
    });
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await api.get("/files");
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files", error);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 200) {
        toast.success("File uploaded successfully!");
        fetchFiles();
      }
    } catch (error) {
      toast.error("Upload failed");
      console.error("Error uploading file", error);
    }
  };

  const generateShareLink = async (fileId) => {
    try {
      const response = await api.get(`/download/${fileId}`);
      if (response.data.download_url) {
        navigator.clipboard.writeText(response.data.download_url);
        toast.success(
          "Download link copied to clipboard! (Valid only for 15 minutes)"
        );
      } else {
        toast.error("File not found or expired");
      }
    } catch (error) {
      toast.error("Error fetching download link");
      console.error("Download error:", error);
    }
  };

  const handleDelete = async (fileId, publicId) => {
    try {
      const response = await api.delete(`/delete/${fileId}`, {
        data: { public_id: publicId },
      });

      if (response.status === 200) {
        toast.success("File deleted successfully!");
        fetchFiles();
      }
    } catch (error) {
      toast.error("Failed to delete file");
      console.error("Error deleting file", error);
    }
  };

  return (
    <div className="container">
      <ToastContainer />
      <h1>File Sharing App</h1>
      <div className="upload-box">
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>

      <h2>Available Files</h2>
      <ul className="file-list">
        {files.map((file, index) => (
          <li key={index} className="file-item">
            <span>{file.filename}</span>
            <button onClick={() => generateShareLink(file.file_id)}>
              Share
            </button>
            <button onClick={() => handleDelete(file.file_id, file.public_id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
