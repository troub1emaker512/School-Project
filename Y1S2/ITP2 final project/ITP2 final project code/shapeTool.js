// draw shapes (square, circle, triangle)
function ShapeTool() {
    this.icon = "assets/shapes.png"; // Update this icon as needed
    this.name = "ShapeTool";

    var startMouseX = -1;
    var startMouseY = -1;
    var drawing = false;
    var selectedShape = 'rectangle'; // Default shape

    // Draw the selected shape to the screen
    this.draw = function() {
        // Only draw when the mouse is clicked
        if (mouseIsPressed) {
            // If it's the start of drawing a new shape
            if (startMouseX == -1) {
                startMouseX = mouseX;
                startMouseY = mouseY;
                drawing = true;
                // Save the current pixel array
                loadPixels();
            } else {
                // Update the screen with the saved pixels to hide any previous shape
                updatePixels();
                strokeWeight(2);
                noFill(); // You can change this to fill the shapes if needed

                // Draw based on the selected shape
                if (selectedShape === 'rectangle') {
                    rect(startMouseX, startMouseY, mouseX - startMouseX, mouseY - startMouseY);
                } else if (selectedShape === 'circle') {
                    let diameter = dist(startMouseX, startMouseY, mouseX, mouseY) * 2;
                    ellipse(startMouseX, startMouseY, diameter, diameter);
                } else if (selectedShape === 'triangle') {
                    let x2 = mouseX;
                    let y2 = mouseY;
                    let x3 = startMouseX - (mouseX - startMouseX);
                    let y3 = mouseY;
                    triangle(startMouseX, startMouseY, x2, y2, x3, y3);
                }
            }
        } else if (drawing) {
            // Save the pixels with the most recent shape and reset the drawing bool
            loadPixels();
            drawing = false;
            startMouseX = -1;
            startMouseY = -1;
        }
    };

    this.populateOptions = function() {
        let shapeContainer = createDiv();
        shapeContainer.class('shape-container');
        shapeContainer.parent("#options");

        let shapeButtons = ['Rectangle', 'Circle', 'Triangle'];

        // Create buttons for each shape
        shapeButtons.forEach(shape => {
            let shapeButton = createButton(shape);
            shapeButton.class('shape-button');
            shapeButton.mousePressed(() => {
                selectedShape = shape.toLowerCase(); // Set the selected shape based on the button clicked
            });
            shapeButton.parent(shapeContainer);
        });
    };

    // Unselect the tool and remove GUI control
    this.unselectTool = function() {
        select("#options").html(""); // Clear options
    };
}
