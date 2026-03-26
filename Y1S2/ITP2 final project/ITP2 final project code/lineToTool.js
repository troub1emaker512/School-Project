//a tool for drawing straight lines to the screen. Allows the user to preview
//the a line to the current mouse position before drawing the line to the 
//pixel array.
function LineToTool(){
	this.icon = "assets/lineTo.jpg";
	this.name = "LineTo";

	var startMouseX = -1;
	var startMouseY = -1;
	var drawing = false;

	var LineSizeSlider;

	//draws the line to the screen 
	this.draw = function(){
		var LineSize = LineSizeSlider.value();

		//only draw when mouse is clicked
		if(mouseIsPressed){
			//if it's the start of drawing a new line
			if(startMouseX == -1){
				startMouseX = mouseX;
				startMouseY = mouseY;
				drawing = true;
				//save the current pixel Array
				loadPixels();
			}

			else{
				//update the screen with the saved pixels to hide any previous
				//line between mouse pressed and released
				updatePixels();
				//draw the line
				strokeWeight(LineSize);
				line(startMouseX, startMouseY, mouseX, mouseY);
			}

		}

		else if(drawing){
			//save the pixels with the most recent line and reset the
			//drawing bool and start locations
			loadPixels();
			drawing = false;
			startMouseX = -1;
			startMouseY = -1;
		}
	};

	this.populateOptions = function(){      
        let sliderContainer = createDiv();
        sliderContainer.class('slider-container');
        sliderContainer.parent("#options");

        sizeSliderLabel = createP('Size');
        sizeSliderLabel.class('slider-label');
        sizeSliderLabel.parent(sliderContainer);

        LineSizeSlider = createSlider(5, 50, 20);
        LineSizeSlider.class('size-slider');
        LineSizeSlider.parent(sliderContainer);
        LineSizeSlider.show();
    };
    
    //This method will be called by this.selectTool() in toolbox.js
    //when this tool is unselected
    //It is useful to remove the GUI control for this tool
    this.unselectTool = function(){
		//clear options
        select("#options").html("");
    };
}



