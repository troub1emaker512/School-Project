// spectrum colour palette selector
function SpectrumPalette() {
    this.selectedColour = "black";

    var self = this;

    // Function to handle color selection from the spectrum
    var spectrumClick = function() {
        var spectrum = select(".spectrumSelector");
        var spectrumRect = spectrum.elt.getBoundingClientRect();
        var x = mouseX - spectrumRect.left;
        var spectrumWidth = spectrum.elt.offsetWidth;
        var position = x / spectrumWidth;
        var color = getColorAtPosition(position);

        self.selectedColour = color;
        fill(color);
        stroke(color);

        // Draw the indicator circle
        drawColorIndicator(mouseX, mouseY, color);
    };

      // Function to get color from spectrum at a specific position
    function getColorAtPosition(position) {
        // Ensure position is within [0, 1]
        position = constrain(position, 0, 1);

        // Map position to a hue value from 0 to 360
        var hue = map(position, 0, 1, 0, 360);

        // Convert hue to RGB
        var color = hueToRgb(hue);
        return color.toString();
    }

    // Function to convert hue to RGB
    function hueToRgb(hue) {
        var r, g, b;
        var c = 1; // Chroma
        var x = c * (1 - Math.abs((hue / 60) % 2 - 1));
        var m = 0;

        if (hue >= 0 && hue < 60) {
            r = c; g = x; b = m;
        } else if (hue >= 60 && hue < 120) {
            r = x; g = c; b = m;
        } else if (hue >= 120 && hue < 180) {
            r = m; g = c; b = x;
        } else if (hue >= 180 && hue < 240) {
            r = m; g = x; b = c;
        } else if (hue >= 240 && hue < 300) {
            r = x; g = m; b = c;
        } else if (hue >= 300 && hue < 360) {
            r = c; g = m; b = x;
        }

        // Convert to RGB color
        return color((r + m) * 255, (g + m) * 255, (b + m) * 255);
    }

    // Function to draw the indicator circle
    function drawColorIndicator(x, y, color) {
        push();
        stroke(0);
        strokeWeight(1);
        fill(color);
        ellipse(x, y, 10, 10);
        pop();
    }

    // Attach the click event listener to the spectrum
    select(".spectrumSelector").mouseClicked(spectrumClick);
}
