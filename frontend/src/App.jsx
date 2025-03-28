import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./styles.css";

const API_BASE_URL = "http://localhost:5000";

function App() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/files`);
      setFiles(response.data);
    } catch (error) {
      console.error("Error fetching files", error);
    }
  };

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file!");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload`, formData, {
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
    if (!fileId) {
      toast.error("Invalid file ID!");
      return;
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/download/${fileId}`);
      if (response.status === 200) {
        const link = response.data.download_url;
        navigator.clipboard.writeText(link);
        toast.info("Shareable link copied! (Valid for 15 mins)");
      }
    } catch (error) {
      toast.error("Failed to generate share link");
      console.error("Error generating share link", error);
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
            <button onClick={() => generateShareLink(file.file_id)}>Share</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
