//new brush tool
function BrushTool() {
    this.icon = "assets/brush.jpg"; // Update with your icon path
    this.name = "Brush";

    var currentBrush = "circle"; // Default brush type

    this.draw = function() {
        // Only draw when the mouse is pressed
        if (mouseIsPressed) {
            strokeWeight(2);
            noStroke();
            
            // Depending on the current brush type, draw different brush shapes
            switch (currentBrush) {
                case "circle":
                    ellipse(mouseX, mouseY, 20, 20);
                    break;
                case "star":
                    drawStar(mouseX, mouseY, 10, 20, 5); // Star with 5 points
                    break;
                case "splatter":
                    drawSplatter(mouseX, mouseY);
                    break;
            }
        }
    };

    // This function populates the options with buttons to choose the brush type
    this.populateOptions = function() {
        select("#options").html(""); // Clear existing options

        let circleBtn = createButton("Circle Brush");
        circleBtn.parent("#options");
        circleBtn.mousePressed(() => currentBrush = "circle");

        let starBtn = createButton("Star Brush");
        starBtn.parent("#options");
        starBtn.mousePressed(() => currentBrush = "star");

        let splatterBtn = createButton("Splatter Brush");
        splatterBtn.parent("#options");
        splatterBtn.mousePressed(() => currentBrush = "splatter");
    };

    this.unselectTool = function() {
        select("#options").html(""); // Clear options when the tool is unselected
    };

    // Helper function to draw a star
    function drawStar(x, y, radius1, radius2, npoints) {
        let angle = TWO_PI / npoints;
        let halfAngle = angle / 2.0;
        beginShape();
        for (let a = 0; a < TWO_PI; a += angle) {
            let sx = x + cos(a) * radius2;
            let sy = y + sin(a) * radius2;
            vertex(sx, sy);
            sx = x + cos(a + halfAngle) * radius1;
            sy = y + sin(a + halfAngle) * radius1;
            vertex(sx, sy);
        }
        endShape(CLOSE);
    }

    // Helper function to draw a splatter effect
    function drawSplatter(x, y) {
        let numSplats = random(5, 10);
        for (let i = 0; i < numSplats; i++) {
            let splatX = x + random(-15, 15);
            let splatY = y + random(-15, 15);
            let splatSize = random(5, 15);
            ellipse(splatX, splatY, splatSize, splatSize);
        }
    }
}
