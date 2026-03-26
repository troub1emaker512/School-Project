var toolbox = null;
var colourP = null;
var spectrumSelector = null;
var helpers = null;
var canvas = null;

var uploadedImage = null; // Store uploaded image
var imagePosition = { x: 0, y: 0}; // Default position of the image

var isDragging = false;
var dragStart = { x: 0, y: 0 };

function setup() {
    canvasContainer = select('#content');
    var c = createCanvas(canvasContainer.size().width, canvasContainer.size().height);
    c.parent("content");
    canvas = c;
    
    background(255);
    helpers = new HelperFunctions();
    colourP = new ColourPalette();
    spectrumSelector = new SpectrumPalette();
    toolbox = new Toolbox();

    toolbox.addTool(new FreehandTool());
    toolbox.addTool(new BrushTool());
    toolbox.addTool(new LineToTool());
    toolbox.addTool(new ShapeTool());
    toolbox.addTool(new PolygonTool());
    toolbox.addTool(new SprayCanTool());
    toolbox.addTool(new mirrorDrawTool());
    toolbox.addTool(new stampTool());
    toolbox.addTool(new EditableShape());
    toolbox.addTool(new eraserTool());

}

function draw() {
    if (toolbox.selectedTool.hasOwnProperty("draw")) {
        toolbox.selectedTool.draw();
    } else {
        alert("it doesn't look like your tool has a draw method!");
    }
}


function mousePressed() {
    if (toolbox.selectedTool.hasOwnProperty("mousePressed")) {
        toolbox.selectedTool.mousePressed();
    }
    
    if (uploadedImage) {
        if (mouseX > imagePosition.x && mouseX < imagePosition.x + uploadedImage.width &&
            mouseY > imagePosition.y && mouseY < imagePosition.y + uploadedImage.height) {
            isDragging = true;
            dragStart.x = mouseX - imagePosition.x;
            dragStart.y = mouseY - imagePosition.y;
        }
    }
}

function mouseDragged() {
    if (isDragging && uploadedImage) {
        imagePosition.x = mouseX - dragStart.x;
        imagePosition.y = mouseY - dragStart.y;
        // remove clear if you want the drawing to remain
        clear();
        background(255);
        image(uploadedImage, imagePosition.x, imagePosition.y);
    }
}

function mouseReleased() {
    if (toolbox.selectedTool.hasOwnProperty("mouseReleased")) {
        toolbox.selectedTool.mouseReleased();
    }
    isDragging = false;
}
