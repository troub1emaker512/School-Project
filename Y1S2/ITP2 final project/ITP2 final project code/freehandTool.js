function FreehandTool(){
	//set an icon and a name for the object
	this.icon = "assets/freehand.jpg";
	this.name = "freehand";

	//to smoothly draw we'll draw a line from the previous mouse location
	//to the current mouse location. The following values store
	//the locations from the last frame. They are -1 to start with because
	//we haven't started drawing yet.
	var previousMouseX = -1;
	var previousMouseY = -1;

	var freehandSizeSlider;

	this.draw = function(){
        var freehandLineSize = freehandSizeSlider.value();

        if(!mouseOnCanvas(canvas)){
            return;
        }
        
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
				strokeWeight(freehandLineSize);
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

        freehandSizeSlider = createSlider(5, 50, 20);
        freehandSizeSlider.class('size-slider');
        freehandSizeSlider.parent(sliderContainer);
        freehandSizeSlider.show();
    }
    
    //This method will be called by this.selectTool() in toolbox.js
    //when this tool is unselected
    //It is useful to remove the GUI control for this tool
    this.unselectTool = function(){
        console.log("Freehand tool Unselected");   
		//clear options
		select("#options").html("");
    }
    
}