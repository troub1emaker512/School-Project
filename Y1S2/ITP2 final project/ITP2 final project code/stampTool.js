//stamp tool 
function stampTool(){
    // set an icon and a name for the object
    this.icon = "assets/stampicon.jpg";
    this.name = "stamptool";

    var heart;
    var star;
    var imageSelector;
    var selectedImage;
    var sizeSlider;
    var sizeSliderLabel;

    this.setup = function(){
        heart = loadImage("./assets/hearticon.webp");
        star = loadImage("./assets/star.png");
        console.log("in stamp tool setup")
    }
    this.setup();

    this.mousePressed = function(){
        if(!mouseOnCanvas(canvas)){
            return;
        }

        var StampSize = sizeSlider.value();
        var stampX = mouseX - StampSize + StampSize/2;
        var stampY = mouseY - StampSize + StampSize/2;
        image(selectedImage, stampX, stampY, StampSize, StampSize);
    };

    this.draw = function(){
        
    };

    this.populateOptions = function(){
        console.log("stamp tool selected");
        imageSelector = createSelect();
        imageSelector.parent("#options");
        imageSelector.option('heart');
        imageSelector.option('star');
        imageSelector.changed(this.mySelectEvent);
        selectedImage = heart;

        let sliderContainer = createDiv();
        sliderContainer.class('slider-container');
        sliderContainer.parent("#options");

        sizeSliderLabel = createP('Size');
        sizeSliderLabel.class('slider-label');
        sizeSliderLabel.parent(sliderContainer);

        sizeSlider = createSlider(5, 50, 20);
        sizeSlider.class('size-slider');
        sizeSlider.parent(sliderContainer);
        sizeSlider.show();
    };

    this.mySelectEvent = function(){
        var imageSelected = imageSelector.value();
        if(imageSelected == "heart"){
            selectedImage = heart;
        }
        else if(imageSelected == "star"){
            selectedImage = star;
        }
    };

    this.unselectTool = function(){
        console.log("stamp tool unselected");
        //clear options
        select("#options").html("");
    };
};