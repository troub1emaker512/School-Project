// Split image into Red, Green, and Blue channels
function splitChannels() {
    if (!snapshot) {
        console.log("No snapshot available.");
        return;
    }

    // Load pixel data from snapshot
    snapshot.loadPixels(); 

    redChannel = createImage(snapshot.width, snapshot.height);
    greenChannel = createImage(snapshot.width, snapshot.height);
    blueChannel = createImage(snapshot.width, snapshot.height);

    redChannel.loadPixels();
    greenChannel.loadPixels();
    blueChannel.loadPixels();

    for (let y = 0; y < snapshot.height; y++) {
        for (let x = 0; x < snapshot.width; x++) {
            let i = 4 * (y * snapshot.width + x);

            let r = snapshot.pixels[i + 0];
            let g = snapshot.pixels[i + 1];
            let b = snapshot.pixels[i + 2];

            // Red channel: Keep only red, set G and B to 0
            redChannel.pixels[i + 0] = r;
            redChannel.pixels[i + 1] = 0;
            redChannel.pixels[i + 2] = 0;
            redChannel.pixels[i + 3] = 255; // Alpha

            // Green channel: Keep only green, set R and B to 0
            greenChannel.pixels[i + 0] = 0;
            greenChannel.pixels[i + 1] = g;
            greenChannel.pixels[i + 2] = 0;
            greenChannel.pixels[i + 3] = 255; // Alpha

            // Blue channel: Keep only blue, set R and G to 0
            blueChannel.pixels[i + 0] = 0;
            blueChannel.pixels[i + 1] = 0;
            blueChannel.pixels[i + 2] = b;
            blueChannel.pixels[i + 3] = 255; // Alpha
        }
    }

    // Push updated pixel data back
    redChannel.updatePixels();
    greenChannel.updatePixels();
    blueChannel.updatePixels();
}
