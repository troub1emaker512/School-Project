let capture;         
let snapshot;        
let processedImage;  
let redChannel, greenChannel, blueChannel; 
let hsvImage, ycbcrImage;

// Face API
let faceapi;
let detections = [];

// Freeze logic
let freeze = false;           
let thresholdInitialized = false;  

//Face filter mode
let faceFilterMode = 0;

// Store Sobel edge-detected image
let edgeImage;

// Slider element for edge threshold
let edgeSlider; 

function setup() {
  createCanvas(580, 860); 

  // Webcam
  capture = createCapture(VIDEO);
  capture.size(320, 240);
  capture.hide();

  textSize(16);
  textAlign(LEFT, TOP);

  // Face API init
  const faceOptions = {
    withLandmarks: true,
    withExpressions: false,
    withDescriptors: false
  };
  faceapi = ml5.faceApi(capture, faceOptions, modelReady);

  // Get edge threshold slider element
  edgeSlider = document.getElementById("edgeSlider");
  
  // Add an event listener to update the value beside the slider
  edgeSlider.addEventListener("input", function () {
    document.getElementById("edgeValue").innerText = edgeSlider.value;
    applyThresholdedEdgeDetection();
  });
}

function draw() {
  background(220);

  // If not frozen, grab a fresh frame from webcam
  if (!freeze && capture.loadedmetadata) {
    snapshot = capture.get();
    // Keep processed image for the other cells
    processedImage = snapshot.get();
    // Grayscale + brightness on processedImage
    processImage(); 
    // Split into R,G,B channels
    splitChannels();

    // Convert entire snapshot to HSV, YCbCr for other grid cells
    hsvImage = convertRGBtoHSV(snapshot);
    ycbcrImage = convertRGBtoYCbCr(snapshot);

    // Only initialize threshold images once
    if (!thresholdInitialized) {
      setupThresholding();
      thresholdInitialized = true;
    }
    // Apply thresholds
    applyThresholding();
  }

  // Draw the normal grid cells
  drawAllImages();

  // Face detection cell, but now with face-filter effect
  drawDetections();

  // Call new function to apply Sobel filter
  drawEdgeDetection();  
}

// Face API handling
function modelReady() {
  console.log('FaceAPI model loaded');
  faceapi.detect(gotResults);
}

// Called whenever FaceAPI finishes detecting faces in a video frame.
function gotResults(err, result) {
  if (err) {
    console.error(err);
    return;
  }
  detections = result;
  // Keep detecting in the background
  faceapi.detect(gotResults); 
}


// Key pressed
function keyPressed() {
  // Snapshot
  if (key === 's' || key === 'S') {
    if (capture.loadedmetadata) {
      freeze = true;
      capture.pause();
    }
  }
  // Resume live camera
  else if (key === 'r' || key === 'R') {
    if (capture.loadedmetadata) {
      freeze = false;
      capture.play();
      faceFilterMode = 0;
    }
  }

  // Save snapshot on 'D'
  else if (key === 'd' || key === 'D') {
    if (snapshot) {
      // Save the snapshot p5.Image to a file
      saveCanvas('my_canvas', 'png');
    }
  }

  // Face filters: '1'=grey entire, '2'=blur faces, '3'=HSV faces, '4'=pixelate faces
  if (key === '1') {
    faceFilterMode = 1;
  } 
  else if (key === '2') {
    faceFilterMode = 2;
  } 
  else if (key === '3') {
    faceFilterMode = 3;
  } 
  else if (key === '4') {
    faceFilterMode = 4;
  }
}

// Draw the face detection + face filter cell
function drawDetections() {
  noStroke();
  fill(0);
  text("Face Detection", 10, 700);

  // If have a current snapshot, create a filtered version for the face cell:
  let faceCellImage;
  if (snapshot) {
    faceCellImage = applyFaceFilter(snapshot, detections, faceFilterMode);
    image(faceCellImage, 10, 720, 160, 120);
  } else {
    // Otherwise just draw raw capture
    image(capture, 10, 720, 160, 120);
  }

  // Draw bounding boxes on top
  if (detections && detections.length > 0) {
    for (let i = 0; i < detections.length; i++) {
      let alignedRect = detections[i].alignedRect;
      let { _x, _y, _width, _height } = alignedRect._box;

      // Scale bounding box from 320x240 down to 160x120
      const scaleX = 160 / capture.width;
      const scaleY = 120 / capture.height;
      const scaledX = _x * scaleX + 10;
      const scaledY = _y * scaleY + 720;
      const scaledW = _width * scaleX;
      const scaledH = _height * scaleY;

      noFill();
      stroke(0, 255, 0);
      strokeWeight(2);
      rect(scaledX, scaledY, scaledW, scaledH);
    }
  } else {
    // Placeholder rect if no face
    noFill();
    stroke(150);
    rect(10, 720, 160, 120);
  }
  noStroke();
}

// Apply the selected filter to the face-detection cell
function applyFaceFilter(baseImage, detections, mode) {
  // Copy the base so that it does not destroy the original
  let result = baseImage.get();

  if (mode === 1) {
    // Greyscale entire image
    doGrayscale(result);
  } 
  else if (mode === 2) {
    // Blur each face region
    if (detections && detections.length > 0) {
      for (let det of detections) {
        let box = det.alignedRect._box;
        doBlurRegion(result, box._x, box._y, box._width, box._height);
      }
    }
  }
  else if (mode === 3) {
    // HSV each face region
    if (detections && detections.length > 0) {
      for (let det of detections) {
        let box = det.alignedRect._box;
        doHSVRegion(result, box._x, box._y, box._width, box._height);
      }
    }
  }
  else if (mode === 4) {
    // Pixelate each face region
    if (detections && detections.length > 0) {
      for (let det of detections) {
        let box = det.alignedRect._box;
        doPixelateRegion(result, box._x, box._y, box._width, box._height);
      }
    }
  }

  return result;
}

// Greyscale entire image in place
function doGrayscale(img) {
  img.loadPixels();
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let i = 4 * (y * img.width + x);
      let r = img.pixels[i+0];
      let g = img.pixels[i+1];
      let b = img.pixels[i+2];
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      img.pixels[i+0] = gray;
      img.pixels[i+1] = gray;
      img.pixels[i+2] = gray;
    }
  }
  img.updatePixels();
}

// Blur only face region
function doBlurRegion(img, fx, fy, fw, fh) {
  // Bound check
  fx = floor(fx); fy = floor(fy);
  fw = floor(fw); fh = floor(fh);
  if (fx < 0) fx = 0;
  if (fy < 0) fy = 0;
  if (fx + fw > img.width) fw = img.width - fx;
  if (fy + fh > img.height) fh = img.height - fy;

  // Copy face region to a temp image
  let temp = createImage(fw, fh);
  temp.copy(img, fx, fy, fw, fh, 0, 0, fw, fh);

  // Apply built-in blur
  temp.filter(BLUR, 3);

  // Copy blurred region back
  img.copy(temp, 0, 0, fw, fh, fx, fy, fw, fh);
}

// HSV only face region
function doHSVRegion(img, fx, fy, fw, fh) {
  fx = floor(fx); fy = floor(fy);
  fw = floor(fw); fh = floor(fh);
  // Bound check
  if (fx < 0) fx = 0;
  if (fy < 0) fy = 0;
  if (fx + fw > img.width) fw = img.width - fx;
  if (fy + fh > img.height) fh = img.height - fy;

  // Copy region
  let temp = createImage(fw, fh);
  temp.copy(img, fx, fy, fw, fh, 0, 0, fw, fh);

  // Re-use existing convertRGBtoHSV from ConvertImage.js
  let hsvTemp = convertRGBtoHSV(temp);
  // Copy back into main
  img.copy(hsvTemp, 0, 0, fw, fh, fx, fy, fw, fh);
}

// Pixelate only face region
function doPixelateRegion(img, fx, fy, fw, fh, blockSize = 5) {
  fx = floor(fx); fy = floor(fy);
  fw = floor(fw); fh = floor(fh);

  // Bound check
  if (fx < 0) fx = 0;
  if (fy < 0) fy = 0;
  if (fx + fw > img.width) fw = img.width - fx;
  if (fy + fh > img.height) fh = img.height - fy;

  img.loadPixels();

  // Convert the entire face region to grayscale first
  for (let py = fy; py < fy + fh; py++) {
    for (let px = fx; px < fx + fw; px++) {
      let idx = 4 * (py * img.width + px);
      let r = img.pixels[idx + 0];
      let g = img.pixels[idx + 1];
      let b = img.pixels[idx + 2];

      let gray = 0.299 * r + 0.587 * g + 0.114 * b; 
      img.pixels[idx + 0] = gray;
      img.pixels[idx + 1] = gray;
      img.pixels[idx + 2] = gray;
    }
  }
  
  // Update grayscale image before pixelating
  img.updatePixels(); 

  // Now perform pixelation on grayscale image
  for (let py = fy; py < fy + fh; py += blockSize) {
    for (let px = fx; px < fx + fw; px += blockSize) {
      let sumIntensity = 0;
      let count = 0;

      // Compute the average intensity of each 5x5 block
      for (let sy = 0; sy < blockSize; sy++) {
        for (let sx = 0; sx < blockSize; sx++) {
          let tx = px + sx;
          let ty = py + sy;
          if (tx < 0 || ty < 0 || tx >= img.width || ty >= img.height) continue;

          let idx = 4 * (ty * img.width + tx);
          let intensity = img.pixels[idx];
          sumIntensity += intensity;
          count++;
        }
      }

      let avgIntensity = sumIntensity / count;

      // Fill the block with the average intensity
      for (let sy = 0; sy < blockSize; sy++) {
        for (let sx = 0; sx < blockSize; sx++) {
          let tx = px + sx;
          let ty = py + sy;
          if (tx < 0 || ty < 0 || tx >= img.width || ty >= img.height) continue;

          let idx = 4 * (ty * img.width + tx);
          img.pixels[idx + 0] = avgIntensity;
          img.pixels[idx + 1] = avgIntensity;
          img.pixels[idx + 2] = avgIntensity;
        }
      }
    }
  }

  img.updatePixels();
}

function drawAllImages() {
  fill(0);

  // Webcam (live/frozen) at top-left
  text("Webcam Image", 10, 10);
  if (snapshot) {
    image(snapshot, 10, 30, 160, 120);
  } else {
    image(capture, 10, 30, 160, 120);
  }

  // Grayscale + brightness cell
  text("Grayscale + Brightness", 200, 10);
  if (processedImage) {
    image(processedImage, 200, 30, 160, 120);
  }

  // R, G, B channels
  text("Red Channel", 10, 180);
  if (redChannel) image(redChannel, 10, 200, 160, 120);

  text("Green Channel", 200, 180);
  if (greenChannel) image(greenChannel, 200, 200, 160, 120);

  text("Blue Channel", 390, 180);
  if (blueChannel) image(blueChannel, 390, 200, 160, 120);

  // Thresholded R, G, B
  text("Thresholded Red", 10, 350);
  if (redThresholded) image(redThresholded, 10, 370, 160, 120);

  text("Thresholded Green", 200, 350);
  if (greenThresholded) image(greenThresholded, 200, 370, 160, 120);

  text("Thresholded Blue", 390, 350);
  if (blueThresholded) image(blueThresholded, 390, 370, 160, 120);

  // Snapshot vs HSV vs YCbCr
  text("Webcam Image(Repeat)", 10, 520);
  if (snapshot) {
    image(snapshot, 10, 540, 160, 120);
  } else {
    image(capture, 10, 540, 160, 120);
  }

  text("HSV Image", 200, 520);
  if (hsvImage) image(hsvImage, 200, 540, 160, 120);

  text("YCbCr Image", 390, 520);
  if (ycbcrImage) image(ycbcrImage, 390, 540, 160, 120);

  // Thresholded HSV and YCbCr
  text("Thresholded HSV", 200, 700);
  if (hsvThresholded) image(hsvThresholded, 200, 720, 160, 120);

  text("Thresholded YCbCr", 390, 700);
  if (ycbcrThresholded) image(ycbcrThresholded, 390, 720, 160, 120);
}

function saveSelectedImage() {
  let selection = document.getElementById("saveDropdown").value;
  // Get checkbox state
  let mirrorEnabled = document.getElementById("mirrorCheckbox").checked; 

  if (selection === "canvas") {
    saveCanvas('my_canvas', 'png'); 
  } else {
    let imgToSave = null;
    let filename = "saved_image.png";

    // Assign the selected image to imgToSave
    if (selection === "webcam" && snapshot) {
      imgToSave = snapshot;
      filename = "webcam_image.png";
    } 
    else if (selection === "processed" && processedImage) {
      imgToSave = processedImage;
      filename = "processed_image.png";
    } 
    else if (selection === "red" && redChannel) {
      imgToSave = redChannel;
      filename = "red_channel.png";
    } 
    else if (selection === "green" && greenChannel) {
      imgToSave = greenChannel;
      filename = "green_channel.png";
    } 
    else if (selection === "blue" && blueChannel) {
      imgToSave = blueChannel;
      filename = "blue_channel.png";
    } 
    else if (selection === "thresh_red" && redThresholded) {
      imgToSave = redThresholded;
      filename = "threshold_red.png";
    } 
    else if (selection === "thresh_green" && greenThresholded) {
      imgToSave = greenThresholded;
      filename = "threshold_green.png";
    } 
    else if (selection === "thresh_blue" && blueThresholded) {
      imgToSave = blueThresholded;
      filename = "threshold_blue.png";
    } 
    else if (selection === "hsv" && hsvImage) {
      imgToSave = hsvImage;
      filename = "hsv_image.png";
    } 
    else if (selection === "ycbcr" && ycbcrImage) {
      imgToSave = ycbcrImage;
      filename = "ycbcr_image.png";
    } 
    else if (selection === "thresh_hsv" && hsvThresholded) {
      imgToSave = hsvThresholded;
      filename = "threshold_hsv.png";
    } 
    else if (selection === "thresh_ycbcr" && ycbcrThresholded) {
      imgToSave = ycbcrThresholded;
      filename = "threshold_ycbcr.png";
    }
    else if (selection === "face" && snapshot) {
      let faceCellImage = applyFaceFilter(snapshot, detections, faceFilterMode);
      imgToSave = faceCellImage;
      filename = "face_detection.png";
    }
    else if (selection === "edge" && snapshot) {
      let edgeThreshold = parseInt(edgeSlider.value);
      imgToSave = applySobelFilter(snapshot, edgeThreshold);
      filename = "edge_detection.png";
    }

    // Apply mirroring if the checkbox is checked
    if (imgToSave) {
      if (mirrorEnabled) {
        imgToSave = mirrorImage(imgToSave);
      }
      save(imgToSave, filename);
    } else {
      console.log("No image available for saving.");
    }
  }
}

// Mirrors the given image horizontally (flips left-to-right).
function mirrorImage(img) {
  let mirrored = createImage(img.width, img.height);
  img.loadPixels();
  mirrored.loadPixels();

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let srcIdx = (y * img.width + x) * 4;
      let destIdx = (y * img.width + (img.width - x - 1)) * 4;

      // Red
      mirrored.pixels[destIdx] = img.pixels[srcIdx];      
      // Green
      mirrored.pixels[destIdx + 1] = img.pixels[srcIdx + 1]; 
      // Blue
      mirrored.pixels[destIdx + 2] = img.pixels[srcIdx + 2]; 
      // Alpha
      mirrored.pixels[destIdx + 3] = img.pixels[srcIdx + 3]; 
    }
  }

  mirrored.updatePixels();
  return mirrored;
}

// Sobel Edge Detection
function drawEdgeDetection() {
  noStroke();
  fill(0);
  text("Sobel Edge Detection", 390, 10);

  if (snapshot) {
    let edgeThreshold = parseInt(edgeSlider.value);
    edgeImage = applySobelFilter(snapshot, edgeThreshold);
    image(edgeImage, 390, 30, 160, 120);
  } else {
    fill(150);
    rect(390, 30, 160, 120);
  }
}

// Apply Sobel Filter
function applySobelFilter(img, threshold) {
  let w = img.width;
  let h = img.height;
  let result = createImage(w, h);

  img.loadPixels();
  result.loadPixels();

  let gx, gy, gray;

  // Sobel kernels
  let sobelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  let sobelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sumX = 0;
      let sumY = 0;

      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          let index = ((x + kx) + (y + ky) * w) * 4;
          gray = (img.pixels[index] * 0.299 + img.pixels[index + 1] * 0.587 + img.pixels[index + 2] * 0.114);

          sumX += sobelX[ky + 1][kx + 1] * gray;
          sumY += sobelY[ky + 1][kx + 1] * gray;
        }
      }

      let edgeVal = sqrt(sumX * sumX + sumY * sumY);

      // Apply threshold to show strong edges only
      edgeVal = edgeVal >= threshold ? 255 : 0;

      let index = (x + y * w) * 4;
      result.pixels[index] = edgeVal;
      result.pixels[index + 1] = edgeVal;
      result.pixels[index + 2] = edgeVal;
      result.pixels[index + 3] = 255;
    }
  }

  result.updatePixels();
  return result;
}

function applyThresholdedEdgeDetection() {
  drawEdgeDetection();
}
