import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import "./App.css";
import logoImage from "./assets/img/1mb-converter-logo.png";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(import.meta.env.VITE_WS_URL);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.progress !== undefined) {
        setProgress(data.progress);
        setConverting(true);
        setUploading(false);
      }

      // If conversion is complete
      if (data.path) {
        setDownloadLink(data.path);
        setConverting(false);
      }
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    setDownloadLink(null);
    setProgress(null);
    setShowProgress(false);
  }, [file]);

  // Hantera filer via drag & drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "video/*": [".mp4", ".mov", ".avi", ".mkv", ".webm"] },
    maxFiles: 1,
  });
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Välj en fil först.");
      return;
    }

    setUploading(true);
    setConverting(false);
    setShowProgress(true);
    setMessage("");
    setDownloadLink(null);
    setProgress(0);

    const formData = new FormData();
    formData.append("videoFile", file);

    // Skapa en XMLHttpRequest för att övervaka uppladdningen
    const xhr = new XMLHttpRequest();

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = (event.loaded / event.total) * 100;
        setProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status === 200) {
        // Upload is complete, now conversion starts
        setUploading(false); // Set uploading to false to show "Konvertering" text
        setConverting(true);
        setProgress(0); // Reset progress for conversion phase

        const data = JSON.parse(xhr.responseText);
        setMessage(`Uppladdning lyckades: ${data.filename}`);

        // Only set download link if it's available immediately
        // Otherwise, it will likely be set by the WebSocket updates
        if (data.path) {
          setDownloadLink(data.path);
          setConverting(false);
        }
      } else {
        setMessage(`Fel vid uppladdning: ${xhr.statusText}`);
        setUploading(false);
        setConverting(false);
      }
    };

    xhr.onerror = () => {
      setMessage("Ett fel inträffade vid uppladdning.");
      setUploading(false);
      setConverting(false);
    };

    xhr.open("POST", "/api/upload/video", true);
    xhr.send(formData);
  };

  return (
    <div className="app">
      <div className={`logo ${converting ? "animating" : ""}`}>
        <img
          className="logo-img"
          src={logoImage}
          alt="8MB Video converter logo"
        />
      </div>
      <div className="container">
        <h2>1MB Video Converter</h2>
        {/* Drag & Drop Area */}
        <div {...getRootProps()} className="dropzone">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Släpp filen här...</p>
          ) : (
            <p>Dra & släpp en fil här, eller klicka för att välja en fil</p>
          )}
        </div>
        {/* Alternativ: Välj fil via knapp */}
        <input
          type="file"
          accept="video/*"
          onChange={handleFileChange}
          style={{ display: "none" }} // Döljer den ursprungliga filväljaren
          id="file-upload"
        />

        <label htmlFor="file-upload" className="custom-file-upload">
          {file ? file.name : "Välj en fil"}
        </label>

        {downloadLink ? (
          <div className="download-container">
            <a href={downloadLink} download className="download-button">
              ⬇ Hämta video
            </a>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || uploading || converting}
          >
            {uploading
              ? "Laddar upp..."
              : converting
              ? "Konverterar..."
              : "Ladda upp"}
          </button>
        )}

        {/* Progress container med animation */}
        <div className={`progress-container ${showProgress ? "show" : ""}`}>
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
          <div className="progress-text">
            {progress !== null && (
              <p>
                {uploading
                  ? "Uppladdning"
                  : converting
                  ? "Konvertering"
                  : "Klar"}
                : {downloadLink ? "100" : progress.toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        <div className="progress-message">{message && <p>{message}</p>}</div>
      </div>
    </div>
  );
}

export default App;
