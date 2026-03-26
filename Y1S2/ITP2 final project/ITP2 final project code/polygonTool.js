// polygon tool used to draw polygons up to 8 sides
function PolygonTool() {
    this.icon = "assets/polygon.png"; // Update this icon as needed
    this.name = "Polygon";

    var startMouseX = -1;
    var startMouseY = -1;
    var drawing = false;
    var numSides = 5; // Default to pentagon

    this.draw = function() {
        // Only draw when the mouse is clicked
        if (mouseIsPressed) {
            if (startMouseX == -1) {
                startMouseX = mouseX;
                startMouseY = mouseY;
                drawing = true;
                loadPixels();
            } else {
                updatePixels();
                strokeWeight(2);
                noFill();
                polygon(startMouseX, startMouseY, dist(startMouseX, startMouseY, mouseX, mouseY), numSides);
            }
        } else if (drawing) {
            loadPixels();
            drawing = false;
            startMouseX = -1;
            startMouseY = -1;
        }
    };

    // Create buttons for number of sides (5 to 8)
    this.populateOptions = function() {
        select("#options").html(""); // Clear existing options

        let btn5 = createButton("5 sides");
        btn5.parent("#options");
        btn5.mousePressed(() => numSides = 5);

        let btn6 = createButton("6 sides");
        btn6.parent("#options");
        btn6.mousePressed(() => numSides = 6);

        let btn7 = createButton("7 sides");
        btn7.parent("#options");
        btn7.mousePressed(() => numSides = 7);

        let btn8 = createButton("8 sides");
        btn8.parent("#options");
        btn8.mousePressed(() => numSides = 8);
    };

    // Function to draw a polygon with the given number of sides
    function polygon(x, y, radius, npoints) {
        let angle = TWO_PI / npoints;
        beginShape();
        for (let i = 0; i < TWO_PI; i += angle) {
            let sx = x + cos(i) * radius;
            let sy = y + sin(i) * radius;
            vertex(sx, sy);
        }
        endShape(CLOSE);
    }

    this.unselectTool = function() {
        select("#options").html(""); // Clear options when tool is unselected
    };
}
