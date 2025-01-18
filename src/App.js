import React, { useRef, useState } from "react";
import "./App.css";
import * as tf from "@tensorflow/tfjs";
import * as facemesh from "@tensorflow-models/facemesh";
import Webcam from "react-webcam";
import { drawMesh } from "./utilities";

function App() {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [earringImage, setEarringImage] = useState(null);

  // Handle earring image upload
  const handleEarringUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        img.onload = () => {
          setEarringImage(img);
        };
      };
      reader.readAsDataURL(file);
    }
  };

  // load Facemesh
  const runFacemesh = async () => {
    const net = await facemesh.load({
      inputResolution: { width: 640, height: 480 },
      scale: 0.8,
    });
    setInterval(() => {
      detect(net);
    }, 100);
  };

  // Detect function
  const detect = async (net) => {
    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null &&
      webcamRef.current.video.readyState === 4
    ) {
      // Get Video Properties
      const video = webcamRef.current.video;
      const videoWidth = webcamRef.current.video.videoWidth;
      const videoHeight = webcamRef.current.video.videoHeight;

      // Set video width
      webcamRef.current.video.width = videoWidth;
      webcamRef.current.video.height = videoHeight;

      // Set canvas width
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;

      // Make detections
      const face = await net.estimateFaces(video);

      // Get canvas context for drawing
      const ctx = canvasRef.current.getContext("2d");
      drawMesh(face, ctx);

      // Draw earrings if image is uploaded and face is detected
      if (earringImage && face.length > 0) {
        face.forEach((prediction) => {
          // Get more accurate ear landmark points
          const leftEarTop = prediction.scaledMesh[356]; // Top of left ear
          const leftEarBottom = prediction.scaledMesh[454]; // Bottom of left ear
          const rightEarTop = prediction.scaledMesh[127]; // Top of right ear
          const rightEarBottom = prediction.scaledMesh[234]; // Bottom of right ear

          // Additional points for better positioning
          const leftEarTragion = prediction.scaledMesh[234]; // Ear connection point
          const rightEarTragion = prediction.scaledMesh[454]; // Ear connection point

          // Calculate ear heights to scale earrings proportionally
          const leftEarHeight = Math.abs(leftEarBottom[1] - leftEarTop[1]);
          const rightEarHeight = Math.abs(rightEarBottom[1] - rightEarTop[1]);

          // Scale earrings based on ear size (increased size by adjusting multipliers)
          const leftEarringHeight = leftEarHeight * 1.8; // Increased from 1.2 to 1.8
          const leftEarringWidth = leftEarringHeight * 0.7; // Increased from 0.6 to 0.7
          const rightEarringHeight = rightEarHeight * 1.8;
          const rightEarringWidth = rightEarringHeight * 0.7;

          // Improved position calculations using ear tragion points
          const leftEarCenter = [
            leftEarTragion[0] - leftEarringWidth * 0.3, // Offset from ear connection point
            leftEarTragion[1] - leftEarringHeight * 0.2, // Slightly above ear connection
          ];

          const rightEarCenter = [
            rightEarTragion[0] + rightEarringWidth * 0.3, // Offset from ear connection point
            rightEarTragion[1] - rightEarringHeight * 0.2, // Slightly above ear connection
          ];

          // Draw earrings with improved positioning
          ctx.drawImage(
            earringImage,
            leftEarCenter[0] - leftEarringWidth / 2,
            leftEarCenter[1] - leftEarringHeight / 2,
            leftEarringWidth,
            leftEarringHeight
          );

          ctx.drawImage(
            earringImage,
            rightEarCenter[0] - rightEarringWidth / 2,
            rightEarCenter[1] - rightEarringHeight / 2,
            rightEarringWidth,
            rightEarringHeight
          );
        });
      }
    }
  };

  runFacemesh();

  return (
    <div className="App">
      <div className="container">
        <div className="upload-section">
          <h2>Upload Earring Image</h2>
          <input
            type="file"
            accept="image/png"
            onChange={handleEarringUpload}
            className="file-input"
          />
          {earringImage && (
            <div className="preview">
              <h3>Preview:</h3>
              <img
                src={earringImage.src}
                alt="Earring preview"
                style={{ maxWidth: "100px" }}
              />
            </div>
          )}
        </div>

        <div className="camera-section">
          <h2>Try On Earrings</h2>
          <div className="camera-container">
            <Webcam
              ref={webcamRef}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                zIndex: 9,
                width: 640,
                height: 480,
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                zIndex: 9,
                width: 640,
                height: 480,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
