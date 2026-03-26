// Convert to grayscale + increase brightness
function processImage() {
  processedImage.loadPixels();

  for (let y = 0; y < processedImage.height; y++) {
    for (let x = 0; x < processedImage.width; x++) {
      let i = 4 * (y * processedImage.width + x);
      
      // Extract red, green, blue
      let r = processedImage.pixels[i + 0];
      let g = processedImage.pixels[i + 1];
      let b = processedImage.pixels[i + 2];
  
      // Convert to grayscale
      let gray = 0.299 * r + 0.587 * g + 0.114 * b; 
      // Increase brightness by 20%
      gray *= 1.2; 
      // Clamp between 0-255
      gray = constrain(gray, 0, 255); 
      
      // Overwrite the pixel with the new grayscale value
      processedImage.pixels[i + 0] = gray;
      processedImage.pixels[i + 1] = gray;
      processedImage.pixels[i + 2] = gray;
    }
  }
  
  processedImage.updatePixels();
}
  