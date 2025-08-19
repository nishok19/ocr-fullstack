import { useState } from "react";
import { Upload, File, CheckCircle, X } from "lucide-react";
import { BASE_SERVER_URL } from "../App";

function FileUpload() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("sample_report", selectedFile);

      const response = await fetch(`${BASE_SERVER_URL}/api/report`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("Upload successful:", result);
      setUploadSuccess(true);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setUploadSuccess(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="h-full w-full mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Upload File
      </h2>

      {/* File Input Area */}
      <div className="mb-6">
        <label className="block w-full">
          <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors">
            <Upload className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 text-center">
              Click to select a file
            </p>
            <p className="text-xs text-gray-400">or drag and drop</p>
          </div>
          <input
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="*/*"
            name="sample_report"
          />
        </label>
      </div>

      {/* Selected File Info */}
      {selectedFile && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <File className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="mb-4">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || uploading || uploadSuccess}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            !selectedFile || uploading || uploadSuccess
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          {uploading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Uploading...</span>
            </div>
          ) : uploadSuccess ? (
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Uploaded Successfully</span>
            </div>
          ) : (
            "Upload File"
          )}
        </button>
      </div>

      {/* Success Message */}
      {uploadSuccess && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800 text-center">
            File uploaded successfully!
          </p>
        </div>
      )}
    </div>
  );
}

export default FileUpload;
