function eraserTool(){
	//set an icon and a name for the object
	this.icon = "assets/eraserimage.png";
	this.name = "eraser";

	var previousMouseX = -1;
	var previousMouseY = -1;

    var eraserSizeSlider;

	this.draw = function(){
        //set strokeWeight to the value of the slider
        var eraserLineSize = eraserSizeSlider.value();
        
		//if the mouse is pressed
		if(mouseIsPressed){
			//check if they previousX and Y are -1. set them to the current
			//mouse X and Y if they are.
			if (previousMouseX == -1){
				previousMouseX = mouseX;
				previousMouseY = mouseY;
			}
			//if we already have values for previousX and Y we can draw a line from 
			//there to the current mouse location
			else{
                //set the eraser thickness to the thickness selected by the user
                fill(255);
                stroke(255);
                strokeWeight(eraserLineSize);
				line(previousMouseX, previousMouseY, mouseX, mouseY);
				previousMouseX = mouseX;
				previousMouseY = mouseY;
			}
		}
		//if the user has released the mouse we want to set the previousMouse values 
		//back to -1.
		//try and comment out these lines and see what happens!
		else{
			previousMouseX = -1;
			previousMouseY = -1;
		}
	};
    
    //This method will be called by this.selectTool() in toolbox.js
    //when this tool is selected
    //It is useful to setup the GUI control for this tool
    this.populateOptions = function(){      
        let sliderContainer = createDiv();
        sliderContainer.class('slider-container');
        sliderContainer.parent("#options");

        sizeSliderLabel = createP('Size');
        sizeSliderLabel.class('slider-label');
        sizeSliderLabel.parent(sliderContainer);

        eraserSizeSlider = createSlider(5, 50, 20);
        eraserSizeSlider.class('size-slider');
        eraserSizeSlider.parent(sliderContainer);
        eraserSizeSlider.show();
    };
    
    //This method will be called by this.selectTool() in toolbox.js
    //when this tool is unselected
    //It is useful to remove the GUI control for this tool
    this.unselectTool = function(){
        //clear options
        select("#options").html("");
    };
}