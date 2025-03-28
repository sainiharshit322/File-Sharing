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

    socket.on("file_deleted", (data) => {
      toast.info(`File deleted: ${data.filename}`);
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

  const generateShareLink = (fileId) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;

    const expirationTime = new Date(file.expires_at).toLocaleTimeString();
    const link = `${window.location.origin}/download/${fileId}`;
    navigator.clipboard.writeText(link);
    toast.info(`Shareable link copied! Expires at ${expirationTime}`);
  };

  const handleDelete = async (fileId) => {
    try {
      const response = await api.delete(`/delete/${fileId}`);
      if (response.status === 200) {
        toast.success("File deleted successfully!");
        fetchFiles();
      }
    } catch (error) {
      toast.error("Error deleting file");
      console.error("Delete Error:", error);
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
            <button onClick={() => generateShareLink(file.id)}>Share</button>
            <button onClick={() => handleDelete(file.id)} className="delete-btn">Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
