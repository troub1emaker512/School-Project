function EditableShape(){
     // set an icon and a name for the object
     this.icon = "assets/editicon.jpg";
     this.name = "editableShape";

     var editButton;
     var finishButton;

     var editMode = false;
     var currentShape = [];

     this.draw = function(){
        //set the strokeWeight as default
        strokeWeight(1);
        
        updatePixels();
        if(mouseOnCanvas(canvas) && mouseIsPressed){
            if(!editMode){
                // if drawing code 
                // save all the mouse position as vertices 
                currentShape.push({x:mouseX, y:mouseY})
            }
            else{
                // in edit editMode, look for the nearest vertex and 
                // move it with mouse position
                for (var i = 0; i < currentShape.length; i++){
                    if(dist(currentShape[i].x, currentShape[i].y, mouseX, mouseY) < 15){
                        currentShape[i].x = mouseX;
                        currentShape[i].y = mouseY;
                    }
                }
            }
        }

        beginShape();

        for(var i = 0; i < currentShape.length; i++){
            vertex(currentShape[i].x, currentShape[i].y);

            if(editMode){
                // if in editMode, draw each vertex as a small red circle 
                fill("red");
                ellipse(currentShape[i].x, currentShape[i].y, 10);
                noFill();
            }
        }

        endShape();

     }

     this.unselectTool = function(){
        console.log("unselectTool in EditableShape");
        select(".options").html("");
        // this is to fix the drawing on canvas
        // in case the user click on other tool icon while editing
        this.finishButtonPressed();
     }

    //  called when icon is clicked
     this.populateOptions = function(){
        noFill();
        loadPixels();

        // set up the two buttons
        editButton = createButton("Edit Shape");
        finishButton = createButton("Final Shape");
        editButton.mousePressed(this.editButtonPressed);
        finishButton.mousePressed(this.finishButtonPressed);
        editButton.parent("#options");
        finishButton.parent("#options");

        editButton.style("display", "none");
        finishButton.style("display", "none");
     }
     //edit button
     this.editButtonPressed = function(){
        if(editMode){
            editMode = false;
            editButton.html("Edit Shape");
        }
        else{
            editMode = true;
            editButton.html("Add Vertices");
        }
     }
     //finish pressing
     this.finishButtonPressed = function(){
        editButton.style("display", "none");
        finishButton.style("display", "none");

        editMode = false;
        draw();
        loadPixels();
        currentShape = [];
        editButton.html("Edit Shape");
     }

     this.mouseReleased = function(){
        if(mouseOnCanvas(canvas) && !editMode){
            editButton.style("display", "block");
            finishButton.style("display", "block");
        }
     }
}