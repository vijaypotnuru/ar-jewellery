import React, { useRef, useState } from 'react';
import './App.css';
import * as tf from '@tensorflow/tfjs';
import * as facemesh from '@tensorflow-models/facemesh';
import Webcam from 'react-webcam';
import { drawMesh } from './utilities';

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
      typeof webcamRef.current !== 'undefined' &&
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
      const ctx = canvasRef.current.getContext('2d');
      drawMesh(face, ctx);

      // Draw earrings if image is uploaded and face is detected
      if (earringImage && face.length > 0) {
        face.forEach((prediction) => {
          // Get ear landmark points (approximately points 356 and 127 for left and right ears)
          const leftEar = prediction.scaledMesh[356];
          const rightEar = prediction.scaledMesh[127];

          // Draw earrings at ear positions
          const earringWidth = 40; // Adjust size as needed
          const earringHeight = 60;

          ctx.drawImage(
            earringImage,
            leftEar[0] - earringWidth / 2,
            leftEar[1] - earringHeight / 2,
            earringWidth,
            earringHeight
          );

          ctx.drawImage(
            earringImage,
            rightEar[0] - earringWidth / 2,
            rightEar[1] - earringHeight / 2,
            earringWidth,
            earringHeight
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
                style={{ maxWidth: '100px' }}
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
                position: 'absolute',
                marginLeft: 'auto',
                marginRight: 'auto',
                left: 0,
                right: 0,
                textAlign: 'center',
                zIndex: 9,
                width: 640,
                height: 480,
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                marginLeft: 'auto',
                marginRight: 'auto',
                left: 0,
                right: 0,
                textAlign: 'center',
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
