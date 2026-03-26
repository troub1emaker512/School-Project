// Converts an RGB image into HSV color space.
function convertRGBtoHSV(srcImage) {
  let w = srcImage.width;
  let h = srcImage.height;
  let result = createImage(w, h);

  srcImage.loadPixels();
  result.loadPixels();

  for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
          let index = (x + y * w) * 4;
          // Normalize to [0..1] for hue/sat/val calculations
          let r = srcImage.pixels[index] / 255;
          let g = srcImage.pixels[index + 1] / 255;
          let b = srcImage.pixels[index + 2] / 255;

          // Calculate the min, max, and difference
          let maxVal = Math.max(r, g, b);
          let minVal = Math.min(r, g, b);
          let delta = maxVal - minVal;

          let hVal = 0;
          let sVal = (maxVal === 0) ? 0 : delta / maxVal;
          let vVal = maxVal;

          // Compute hue based on which channel is max
          if (delta !== 0) {
              if (maxVal === r) {
                  hVal = 60 * ((g - b) / delta % 6);
              } else if (maxVal === g) {
                  hVal = 60 * ((b - r) / delta + 2);
              } else {
                  hVal = 60 * ((r - g) / delta + 4);
              }
          }
          if (hVal < 0) hVal += 360; // Ensure positive Hue

          // Store True HSV Values (No Mapping to 255)
          result.pixels[index] = hVal;
          result.pixels[index + 1] = sVal * 255;  
          result.pixels[index + 2] = vVal * 255;  
          result.pixels[index + 3] = 255;   
      }
  }

  result.updatePixels();
  return result;
}

// Converts an RGB image into YCbCr color space
function convertRGBtoYCbCr(srcImage) {
  let w = srcImage.width;
  let h = srcImage.height;
  let result = createImage(w, h);
  
  srcImage.loadPixels();
  result.loadPixels();
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let index = (x + y * w) * 4;
      let R = srcImage.pixels[index];
      let G = srcImage.pixels[index + 1];
      let B = srcImage.pixels[index + 2];
  
      // Reference formula (BT.601)
      let Y  =  0.299 * R + 0.587 * G + 0.114 * B;
      let Cb = -0.1687 * R - 0.3313 * G + 0.5    * B + 128;
      let Cr =  0.5    * R - 0.4187 * G - 0.0813 * B + 128;
  
      // lamp to [0..255]
      let Yc  = constrain(floor(Y),  0, 255);
      let Cbc = constrain(floor(Cb), 0, 255);
      let Crc = constrain(floor(Cr), 0, 255);
  
      result.pixels[index]     = Yc;
      result.pixels[index + 1] = Cbc;
      result.pixels[index + 2] = Crc;
      result.pixels[index + 3] = 255;
    }
  }
  
  result.updatePixels();
  return result;
}