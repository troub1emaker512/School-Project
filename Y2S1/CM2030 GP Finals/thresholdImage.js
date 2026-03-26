let redThresholded, greenThresholded, blueThresholded;
let redSlider, greenSlider, blueSlider;
let hsvThresholded, ycbcrThresholded;
let hueSlider, saturationSlider, valueSlider;
let ySlider, cbSlider, crSlider;

function setupThresholding() {
    // Create blank images for thresholded output
    redThresholded = createImage(snapshot.width, snapshot.height);
    greenThresholded = createImage(snapshot.width, snapshot.height);
    blueThresholded = createImage(snapshot.width, snapshot.height);

    // Get slider elements
    redSlider = document.getElementById("redSlider");
    greenSlider = document.getElementById("greenSlider");
    blueSlider = document.getElementById("blueSlider");

    // Create blank images for thresholded output
    hsvThresholded = createImage(snapshot.width, snapshot.height);
    ycbcrThresholded = createImage(snapshot.width, snapshot.height);
    const mergedHsv = document.getElementById("mergedHsvSlider");
  const mergedYcbcr = document.getElementById("mergedYcbcrSlider");

  // Main HSV updates slider all three HSV sliders
  mergedHsv.addEventListener("input", function () {
    let val = parseInt(mergedHsv.value);
    document.getElementById("mergedHsvValue").innerText = val;

    // Set each HSV slider to val
    hueSlider.value = val;
    saturationSlider.value = val;
    valueSlider.value = val;

    // Re-apply threshold
    applyThresholding();
  });

  // Main YCbCr slider updates all three YCbCr sliders
  mergedYcbcr.addEventListener("input", function () {
    let val = parseInt(mergedYcbcr.value);
    document.getElementById("mergedYcbcrValue").innerText = val;

    ySlider.value = val;
    cbSlider.value = val;
    crSlider.value = val;

    applyThresholding();
  });


    // Get slider elements for HSV
    hueSlider = document.getElementById("hueSlider");
    saturationSlider = document.getElementById("saturationSlider");
    valueSlider = document.getElementById("valueSlider");

    // Get slider elements for YCbCr
    ySlider = document.getElementById("ySlider");
    cbSlider = document.getElementById("cbSlider");
    crSlider = document.getElementById("crSlider");

    // Attach event listeners to sliders
    redSlider.addEventListener("input", applyThresholding);
    greenSlider.addEventListener("input", applyThresholding);
    blueSlider.addEventListener("input", applyThresholding);
    hueSlider.addEventListener("input", applyThresholding);
    saturationSlider.addEventListener("input", applyThresholding);
    valueSlider.addEventListener("input", applyThresholding);
    ySlider.addEventListener("input", applyThresholding);
    cbSlider.addEventListener("input", applyThresholding);
    crSlider.addEventListener("input", applyThresholding);
}

// Function to apply thresholding on R, G, B channels
function applyThresholding() {
    // Ensure HSV/YCbCr images exist
    if (!hsvImage || !ycbcrImage) return;

    // Read integer threshold values
    let redThreshold = parseInt(redSlider.value);
    let greenThreshold = parseInt(greenSlider.value);
    let blueThreshold = parseInt(blueSlider.value);

    // Convert HSV sliders from 0..255 into actual ranges
    let hueThreshold = parseInt(hueSlider.value) * (360 / 255);  
    let saturationThreshold = parseFloat(saturationSlider.value) / 255;  
    let valueThreshold = parseFloat(valueSlider.value) / 255; 
    
    // YCbCr thresholds
    let yThreshold = parseInt(ySlider.value);
    let cbThreshold = parseInt(cbSlider.value);
    let crThreshold = parseInt(crSlider.value);

    // Update UI values
    document.getElementById("redValue").innerText = redThreshold;
    document.getElementById("greenValue").innerText = greenThreshold;
    document.getElementById("blueValue").innerText = blueThreshold;
    document.getElementById("hueValue").innerText = hueThreshold.toFixed(1); 
    document.getElementById("saturationValue").innerText = saturationThreshold.toFixed(1);
    document.getElementById("valueValue").innerText = valueThreshold.toFixed(1);;
    document.getElementById("yValue").innerText = yThreshold;
    document.getElementById("cbValue").innerText = cbThreshold;
    document.getElementById("crValue").innerText = crThreshold;

    // Load pixel data for threshold images and the base images
    redThresholded.loadPixels();
    greenThresholded.loadPixels();
    blueThresholded.loadPixels();
    hsvThresholded.loadPixels();
    ycbcrThresholded.loadPixels();
    hsvImage.loadPixels();
    ycbcrImage.loadPixels();

    // Threshold for R, G, B
    for (let y = 0; y < snapshot.height; y++) {
        for (let x = 0; x < snapshot.width; x++) {
            let i = 4 * (y * snapshot.width + x);
            
            // Original snapshot R,G,B
            let r = snapshot.pixels[i + 0];
            let g = snapshot.pixels[i + 1];
            let b = snapshot.pixels[i + 2];

            // Apply thresholding
            redThresholded.pixels[i + 0] = r >= redThreshold ? 255 : 0;
            redThresholded.pixels[i + 1] = 0;
            redThresholded.pixels[i + 2] = 0;
            redThresholded.pixels[i + 3] = 255;

            greenThresholded.pixels[i + 0] = 0;
            greenThresholded.pixels[i + 1] = g >= greenThreshold ? 255 : 0;
            greenThresholded.pixels[i + 2] = 0;
            greenThresholded.pixels[i + 3] = 255;

            blueThresholded.pixels[i + 0] = 0;
            blueThresholded.pixels[i + 1] = 0;
            blueThresholded.pixels[i + 2] = b >= blueThreshold ? 255 : 0;
            blueThresholded.pixels[i + 3] = 255;
        }
    }

    // Threshold for HSV and YCbCr
    for (let y = 0; y < hsvImage.height; y++) {
        for (let x = 0; x < hsvImage.width; x++) {
            let i = 4 * (y * hsvImage.width + x);

            // HSV values: hue [0..360], saturation [0..1], value [0..1]
            let h = hsvImage.pixels[i];
            let s = hsvImage.pixels[i + 1] / 255;   
            let v = hsvImage.pixels[i + 2] / 255;   
            let Y = ycbcrImage.pixels[i];
            let Cb = ycbcrImage.pixels[i + 1];
            let Cr = ycbcrImage.pixels[i + 2];

            // Handle cyclic nature of hue by measuring difference
            let hueDiff = Math.abs(h - hueThreshold);
            if (hueDiff > 180) hueDiff = 360 - hueDiff; 

            // Adjust thresholding logic for correct HSV range
            hsvThresholded.pixels[i] = (hueDiff <= 30) ? 255 : 0;
            hsvThresholded.pixels[i + 1] = (s >= saturationThreshold) ? 255 : 0;
            hsvThresholded.pixels[i + 2] = (v >= valueThreshold) ? 255 : 0;
            hsvThresholded.pixels[i + 3] = 255;

            ycbcrThresholded.pixels[i] = Y >= yThreshold ? 255 : 0;
            ycbcrThresholded.pixels[i + 1] = Cb >= cbThreshold ? 255 : 0;
            ycbcrThresholded.pixels[i + 2] = Cr >= crThreshold ? 255 : 0;
            ycbcrThresholded.pixels[i + 3] = 255;
        }
    }

    // Update the pixel arrays with the new thresholded data
    redThresholded.updatePixels();
    greenThresholded.updatePixels();
    blueThresholded.updatePixels();
    hsvThresholded.updatePixels();
    ycbcrThresholded.updatePixels();
}
