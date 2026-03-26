function HelperFunctions() {
    select("#clearButton").mouseClicked(function() {
        background(255);
        uploadedImage = null;
        loadPixels();
    });

    select("#saveImageButton").mouseClicked(function() {
        saveCanvas("myPicture", "jpg");
    });

    uploadImageButton.addEventListener("change", function() {
        const reader = new FileReader();
        reader.addEventListener("load", () => {
            // Prompt user for image dimensions
            let width = prompt("Enter the desired width for the image:", "400");
            let height = prompt("Enter the desired height for the image:", "300");
            
            // Validate inputs
            width = parseInt(width) || 400;
            height = parseInt(height) || 300;

            if(width > windowWidth || height > windowHeight || width < 1 || height < 1)
            {
                alert("height or width is invalid.");
            }
            else
            {
            // Create a p5 Image object and draw it with specified dimensions
            uploadedImage = loadImage(reader.result, (img) => {
                // Resize the image
                img.resize(width, height);
                
                // Clear the canvas and draw the resized image
                clear();
                background(255);
                image(img, imagePosition.x, imagePosition.y);
                loadPixels(); // Update the canvas state after drawing the image
            });
            }   
        });
        reader.readAsDataURL(this.files[0]);
    });

    // Toggle palette button functionality
    select("#togglePaletteButton").mouseClicked(function() {
        let palette = select(".colourPalette");
        if (palette.style("display") === "none") {
            palette.style("display", "flex");
        } else {
            palette.style("display", "none");
        }
    });

}

function mouseOnCanvas(canvas){
    if(mouseX > 0 && mouseY>0 && mouseY<canvas.height){
        return true;
    }else{
        return false;
    }
}