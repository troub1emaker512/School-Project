function SprayCanTool(){
	
	this.name = "sprayCanTool";
	this.icon = "assets/sprayCan.jpg";

	var spraySizeSlider;

	var points = 13;

	this.draw = function(){
		var spread = spraySizeSlider.value();
		strokeWeight(1);
		var r = random(5,10);
		if(mouseIsPressed){
			for(var i = 0; i < points; i++){
				point(random(mouseX-spread, mouseX + spread), random(mouseY-spread, mouseY+spread));
			}
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

        spraySizeSlider = createSlider(5, 50, 20);
        spraySizeSlider.class('size-slider');
        spraySizeSlider.parent(sliderContainer);
        spraySizeSlider.show();
    };
    
    //This method will be called by this.selectTool() in toolbox.js
    //when this tool is unselected
    //It is useful to remove the GUI control for this tool
    this.unselectTool = function(){
        //clear options
        select("#options").html("");
    };
}