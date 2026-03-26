    /*

    - Copy your game project code into this file
    - for the p5.Sound library look here https://p5js.org/reference/#/libraries/p5.sound
    - for finding cool sounds perhaps look here
    https://freesound.org/


    */

    var gameChar_x;
    var gameChar_y;
    var gameChar_width;
    var floorPos_y;
    var cameraPosX;

    var isLeft;
    var isRight;
    var isPlummeting;
    var isFalling;
    var isFound;

    var collectables;
    var canyons;
    var clouds;
    var mountains;
    var tree_x;

    var game_score;
    var flagpole;
    var lives;
    var enemies;
    var platforms;

    var bgmloop;
    var jumpSound;
    var collectSound;
    var fallingSound;

    function preload()
    {
        soundFormats('mp3','wav');

        //load your sounds here
        bgmloop = loadSound('assets/bgm.mp3');
        bgmloop.setVolume(0.5);
        jumpSound = loadSound('assets/jump.wav');
        jumpSound.setVolume(0.3);
        collectSound = loadSound('assets/collect.mp3');
        collectSound.setVolume(3);
        fallingSound = loadSound('assets/falling.mp3');
        fallingSound.setVolume(1);
    }

    function setup()
    {
        createCanvas(1024, 576);
        floorPos_y = height * 3/4;

        // init lives
        lives = 3;

        startGame();
    }

    function startGame()
    {
        gameChar_y = floorPos_y;
        gameChar_x = width/2;
        gameChar_width = 40;

        // movement variable state declaration
        isLeft = false;
        isRight = false;
        isPlummeting = false;
        isFalling = false;

        // implement scrolling
        cameraPosX = 0;

        // collectable item array
        collectables = 
            [
            // dorayaki 1
            {
            x_pos: -180,
            y_pos: 260,
            size: 50,
            isFound : false
            },
            // dorayaki 2
            {
            x_pos: 300,
            y_pos: 400,
            size: 50,
            isFound : false
            },
            // dorayaki 3
            {
            x_pos: 700,
            y_pos: 400,
            size: 50,
            isFound : false
            },
            // dorayaki 4
            {
            x_pos: 1110,
            y_pos: 260,
            size: 50,
            isFound : false
            },
            // dorayaki 5
            {
            x_pos: 1380,
            y_pos: 400,
            size: 50,
            isFound : false
            },
            // dorayaki 6
            {
            x_pos: 1750,
            y_pos: 400,
            size: 50,
            isFound : false
            }
            ]

        // canyon array
        canyons = 
            [
            // canyon 1
            {
            x_pos: 170,
            y_pos: 432,
            width: 60,
            height: 144 
            },
            // canyon 2
            {
            x_pos: 810,
            y_pos: 432,
            width: 70,
            height: 144
            },
            // canyon 3
            {
            x_pos: 1200,
            y_pos: 432,
            width: 80,
            height: 144
            },
            // canyon 4
            {
            x_pos: 1600,
            y_pos: 432,
            width: 80,
            height: 144
            }
            ]

        // tree array
        trees_x = [-340,70,350,555,775,1125,1550,1800];

        // cloud array
        clouds = 
            [
            // cloud 1
            {
                x_pos: -600,
                y_pos: 110,
                size: 130
            },
            // cloud 2
            {
                x_pos: -200,
                y_pos: 130,
                size: 120
            },
            // cloud 3
            {
                x_pos: 200,
                y_pos: 90,
                size: 150
            },
            // cloud 4
            {
                x_pos: 550,
                y_pos: 110,
                size: 120
            },
            // cloud 5
            {
                x_pos: 900,
                y_pos: 130,
                size: 160
            },
            // cloud 6
            {
                x_pos: 1300,
                y_pos: 130,
                size: 130
            }
        ]

        // mountain array
        mountains = 
            [
            // mountain 1
            {
                x_pos: -50,
                y_pos: 200  
            },
            // mountain 2
            {
                x_pos: 450,
                y_pos: 200   
            },
            // mountain 3
            {
                x_pos: 1000,
                y_pos: 200   
            },
            // mountain 4
            {
                x_pos: 1450,
                y_pos: 200 
            }

       ]

        // add platforms
        platforms = [];
        platforms.push(createPlatforms(900, floorPos_y - 70, 130));
        platforms.push(createPlatforms(1050, floorPos_y - 130, 130));
        platforms.push(createPlatforms(-100, floorPos_y - 70, 130));
        platforms.push(createPlatforms(-250, floorPos_y - 130, 130));

        // init game score
        game_score = 0;

        // flagpole (house)
        flagpole = {isReached: false, x_pos: 1950};

        // add enemies
        enemies = [];
        enemies.push(new Enemy(650, floorPos_y - 10, 100));
        enemies.push(new Enemy(1400, floorPos_y - 10, 100));

        // background music
        bgmloop.loop();
    }

    function draw()
    {
        // change the value of cameraPosX continually
        cameraPosX = gameChar_x - width/2;

        ///////////DRAWING CODE//////////

        // fill the sky blue
        background(135,206,250); 

        // draw some green ground
        noStroke();
        fill(102,205,170);
        rect(0, height * 3/4, width, height - height * 3/4); 

        // implement scrolling
        push();
        translate(-cameraPosX,0);

        // draw the clouds
        drawClouds();
        animateClouds();

        // draw the mountains
        drawMountains();

        // draw the trees
        drawTree();

        // loop for platforms
        for (var i = 0; i < platforms.length; i++)
            {
                platforms[i].draw();
            }

        // loop for collectables
        for (var i = 0; i < collectables.length; i++)
        {
            if(collectables[i].isFound == false)
            {
                drawCollectable(collectables[i]);
                checkCollectable(collectables[i]);
            }
        }

        // loop for canyon
        for (var i = 0; i < canyons.length; i++)
        {
            drawCanyon(canyons[i]);
            CanyonCheck(canyons[i]);
        }

        // draw the flagpole (house)
        renderFlagpole();

        // check flagpole (house)
        if(flagpole.isReached == false)
            {
                checkFlagpole();
            }

        // loop for enemies (rats)
        for(var i = 0; i < enemies.length; i++)
            {
                enemies[i].draw();

                var isContact = enemies[i].checkContact(gameChar_x, gameChar_y)

                if(isContact)
                    {
                        if(lives > 0)
                            {
                                lives -=1;
                                bgmloop.stop();
                                startGame();
                                break;
                            }
                    }
                if(lives == 0)
                    {
                        checkPlayerDie();
                        isFalling = true;
                        break;
                    }
            } 

        // the game character
        if(isLeft && isFalling)
        {
            // add your jumping-left code

            //body
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-32, 21,30);

            //head
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-50, 28,28);

            push();
            translate(gameChar_x-3, gameChar_y-46);
            rotate(-10);
            fill(255);
            ellipse(0,0,19,23);
            pop();

            //leg
            rect(gameChar_x-10, gameChar_y-29, 7,15);
            rect(gameChar_x+2, gameChar_y-29, 7,15);
            fill(255);
            ellipse(gameChar_x-7, gameChar_y-15, 10,5);
            ellipse(gameChar_x+5, gameChar_y-14, 10,5);

            //hand
            push();
            translate(gameChar_x-10, gameChar_y-32.5);
            rotate(+15);
            fill(30,144,255);
            ellipse(0, 0, 7,15);
            pop();
            fill(255);
            ellipse(gameChar_x-16, gameChar_y-38, 7,7);

            push();
            translate(gameChar_x+10, gameChar_y-30.5);
            rotate(-10);
            fill(30,144,255);
            ellipse(0, 0, 7,15);
            pop();
            fill(255);
            ellipse(gameChar_x+16, gameChar_y-24, 7,7);

            //white body
            fill(255);
            arc(gameChar_x-10, gameChar_y-37, 25,29,0, HALF_PI);

            //bell
            fill(255,0,0);
            rect(gameChar_x-10, gameChar_y-38, 20,3);

            //face
            stroke(0);
            fill(255);
            ellipse(gameChar_x-11, gameChar_y-52, 6,8);
            point(gameChar_x-13, gameChar_y-53);
            fill(255,0,0);
            ellipse(gameChar_x-14, gameChar_y-46,4,4);
            fill(255);

            arc(gameChar_x-10, gameChar_y-29, 10,10,0, HALF_PI,PIE);

            //smile
            noFill();
            arc(gameChar_x-10, gameChar_y-45, 10,10,0, HALF_PI);
        }
        else if(isRight && isFalling)
        {
            // add your jumping-right coded  

            //body
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-32, 21,30);

            //head
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-50, 28,28);

            push();
            translate(gameChar_x+3, gameChar_y-46);
            rotate(+10);
            fill(255);
            ellipse(0,0,19,23);
            pop();

            //leg
            rect(gameChar_x-10, gameChar_y-29, 7,15);
            rect(gameChar_x+2, gameChar_y-29, 7,15);
            fill(255);
            ellipse(gameChar_x-5.5, gameChar_y-14, 10,5);
            ellipse(gameChar_x+6, gameChar_y-15, 10,5);

            //hand
            push();
            translate(gameChar_x-10, gameChar_y-30.5);
            rotate(+10);
            fill(30,144,255);
            ellipse(0, 0, 7,15);
            pop();
            fill(255);
            ellipse(gameChar_x-16, gameChar_y-24, 7,7);

            push();
            translate(gameChar_x+10, gameChar_y-32);
            rotate(-15);
            fill(30,144,255);
            ellipse(0, 0, 7,15);
            pop();
            fill(255);
            ellipse(gameChar_x+16, gameChar_y-37.5, 7,7);

            //white body
            fill(255);
            arc(gameChar_x+9, gameChar_y-37, 25,29,HALF_PI,PI);

            //bell
            fill(255,0,0);
            rect(gameChar_x-10, gameChar_y-38, 20,3);

            //face
            stroke(0);
            fill(255);
            ellipse(gameChar_x+11, gameChar_y-51, 6,8);
            point(gameChar_x+12, gameChar_y-52);
            fill(255,0,0);
            ellipse(gameChar_x+14, gameChar_y-46,4,4);
            fill(255);

            arc(gameChar_x+9, gameChar_y-29, 10,10, HALF_PI,PI,PIE);

            //smile
            noFill();
            arc(gameChar_x+10, gameChar_y-45, 10,10, HALF_PI,PI);
        }
        else if(isLeft)
        {
            // add your walking left code

            //body
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-20, 21,30);

            //head
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-38, 29,29);

            push();
            translate(gameChar_x-3, gameChar_y-34);
            rotate(-10);
            fill(255);
            ellipse(0,0,19,23);
            pop();

            //leg
            rect(gameChar_x-10, gameChar_y-17, 7,15);
            rect(gameChar_x+2, gameChar_y-17, 7,15);
            fill(255);
            ellipse(gameChar_x-7.5, gameChar_y-2, 10,5);
            ellipse(gameChar_x+5, gameChar_y-1, 10,5);

            //hand
            push();
            translate(gameChar_x-10, gameChar_y-18.5);
            rotate(+10);
            fill(30,144,255);
            ellipse(0, 0, 7,15);
            pop();
            fill(255);
            ellipse(gameChar_x-16, gameChar_y-12, 7,7);

            push();
            translate(gameChar_x+10, gameChar_y-18.5);
            rotate(-10);
            fill(30,144,255);
            ellipse(0, 0, 7,15);
            pop();
            fill(255);
            ellipse(gameChar_x+15, gameChar_y-11.5, 7,7);

            //white body
            fill(255);
            arc(gameChar_x-10, gameChar_y-25, 25,29,0, HALF_PI);

            //bell
            fill(255,0,0);
            rect(gameChar_x-10, gameChar_y-26, 20,3);

            //face
            stroke(0);
            fill(255);
            ellipse(gameChar_x-11, gameChar_y-39, 6,8);
            point(gameChar_x-13, gameChar_y-40);
            fill(255,0,0);
            ellipse(gameChar_x-14, gameChar_y-34,4,4);
            fill(255);

            //pocket
            arc(gameChar_x-10, gameChar_y-17, 10,10,0, HALF_PI,PIE);

            //smile
            noFill();
            arc(gameChar_x-10, gameChar_y-33, 10,10,0, HALF_PI);
        }
        else if(isRight)
        {
            // add your walking right code

            //body
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-20, 21,30);

            //head
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-38, 28,28);

            push();
            translate(gameChar_x+3, gameChar_y-34);
            rotate(+10);
            fill(255);
            ellipse(0,0,19,23);
            pop();

            //leg
            rect(gameChar_x-10, gameChar_y-17, 7,15);
            rect(gameChar_x+2, gameChar_y-17, 7,15);
            fill(255);
            ellipse(gameChar_x-6, gameChar_y-1, 10,5);
            ellipse(gameChar_x+6, gameChar_y-2, 10,5);

            //hand
            push();
            translate(gameChar_x-10, gameChar_y-18.5);
            rotate(+10);
            fill(30,144,255);
            ellipse(0, 0, 7,15);
            pop();
            fill(255);
            ellipse(gameChar_x-15, gameChar_y-12.5, 7,7);

            push();
            translate(gameChar_x+10, gameChar_y-18.5);
            rotate(-10);
            fill(30,144,255);
            ellipse(0, 0, 7,15);
            pop();
            fill(255);
            ellipse(gameChar_x+15.5, gameChar_y-12, 7,7);

            //white body
            fill(255);
            arc(gameChar_x+9, gameChar_y-25, 25,29,HALF_PI,PI);

            //bell
            fill(255,0,0);
            rect(gameChar_x-10, gameChar_y-26, 20,3);

            //face
            stroke(0);
            fill(255);
            ellipse(gameChar_x+11, gameChar_y-39, 6,8);
            point(gameChar_x+12, gameChar_y-40);
            fill(255,0,0);
            ellipse(gameChar_x+14, gameChar_y-34,4,4);
            fill(255);

            arc(gameChar_x+9, gameChar_y-17, 10,10, HALF_PI,PI,PIE);

            //smile
            noFill();
            arc(gameChar_x+10, gameChar_y-33, 10,10, HALF_PI,PI);
        }
        else if(isFalling == true && lives == 0)
        {
            // add your standing front facing code

            //body
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-17, 27.5,27.5);

            //leg
            rect(gameChar_x-12, gameChar_y-17, 7,15);
            rect(gameChar_x+6, gameChar_y-17, 7,15);
            fill(255);
            ellipse(gameChar_x-9, gameChar_y-1, 10,5);
            ellipse(gameChar_x+10, gameChar_y-1, 10,5);

            //white body
            ellipse(gameChar_x, gameChar_y-18, 20,23);

            //hand
            push();
            translate(gameChar_x+15, gameChar_y-18);
            rotate(-10);
            fill(30,144,255);
            ellipse(0, 0, 5,15);
            pop();
            fill(255);
            ellipse(gameChar_x+18, gameChar_y-13, 7,7);

            push();
            translate(gameChar_x-15, gameChar_y-18);
            rotate(+10);
            fill(30,144,255);
            ellipse(0, 0, 5,15);
            pop();
            fill(255);
            ellipse(gameChar_x-18, gameChar_y-13, 7,7);

            //head
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-38, 35,35);
            fill(255);
            ellipse(gameChar_x, gameChar_y-34,27,27);

            //bell
            fill(255,0,0);
            rect(gameChar_x-11, gameChar_y-25, 23,3);
            fill(255,255,0);
            ellipse(gameChar_x, gameChar_y-21, 7,7);

            //face
            stroke(0);
            fill(255);
            ellipse(gameChar_x-3, gameChar_y-42, 6,8);
            ellipse(gameChar_x+3, gameChar_y-42, 6,8);
            point(gameChar_x-3, gameChar_y-42);
            point(gameChar_x+2, gameChar_y-42);
            arc(gameChar_x, gameChar_y-33, 12,12,0,PI,OPEN);
            arc(gameChar_x, gameChar_y-15, 12,12,0,PI,CHORD);
            fill(255,0,0);
            ellipse(gameChar_x, gameChar_y-37, 5,5);

        }
        else if(isFalling || isPlummeting)
        {
            // add your jumping facing forwards code

            //body
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-29, 28,28);

            //leg
            rect(gameChar_x-13, gameChar_y-29, 7,15);
            rect(gameChar_x+6, gameChar_y-29, 7,15);
            fill(255);
            ellipse(gameChar_x-10, gameChar_y-13, 10,5);
            ellipse(gameChar_x+10, gameChar_y-13, 10,5);

            //white body
            ellipse(gameChar_x, gameChar_y-30, 20,23);

            //hand
            push();
            translate(gameChar_x+15, gameChar_y-33);
            rotate(+10);
            fill(30,144,255);
            ellipse(0, 0, 5,15);
            pop();
            fill(255);
            ellipse(gameChar_x+18, gameChar_y-37, 7,7);

            push();
            translate(gameChar_x-15, gameChar_y-30);
            rotate(+10);
            fill(30,144,255);
            ellipse(0, 0, 5,15);
            pop();
            fill(255);
            ellipse(gameChar_x-18, gameChar_y-25, 7,7);

            //head
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-50, 35,35);
            fill(255);
            ellipse(gameChar_x, gameChar_y-46,27,27);

            //bell
            fill(255,0,0);
            rect(gameChar_x-11, gameChar_y-37, 23,3);
            fill(255,255,0);
            ellipse(gameChar_x, gameChar_y-33, 7,7);

            //face
            stroke(0);
            fill(255);
            ellipse(gameChar_x-3, gameChar_y-54, 6,8);
            ellipse(gameChar_x+3, gameChar_y-54, 6,8);
            point(gameChar_x-3, gameChar_y-54);
            point(gameChar_x+2, gameChar_y-54);
            arc(gameChar_x, gameChar_y-45, 12,12,0,PI,OPEN);
            arc(gameChar_x, gameChar_y-27, 12,12,0,PI,CHORD);
            fill(255,0,0);
            ellipse(gameChar_x, gameChar_y-49, 5,5);
        }
        else
        {
            // add your standing front facing code

            //body
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-17, 27.5,27.5);

            //leg
            rect(gameChar_x-12, gameChar_y-17, 7,15);
            rect(gameChar_x+6, gameChar_y-17, 7,15);
            fill(255);
            ellipse(gameChar_x-9, gameChar_y-1, 10,5);
            ellipse(gameChar_x+10, gameChar_y-1, 10,5);

            //white body
            ellipse(gameChar_x, gameChar_y-18, 20,23);

            //hand
            push();
            translate(gameChar_x+15, gameChar_y-18);
            rotate(-10);
            fill(30,144,255);
            ellipse(0, 0, 5,15);
            pop();
            fill(255);
            ellipse(gameChar_x+18, gameChar_y-13, 7,7);

            push();
            translate(gameChar_x-15, gameChar_y-18);
            rotate(+10);
            fill(30,144,255);
            ellipse(0, 0, 5,15);
            pop();
            fill(255);
            ellipse(gameChar_x-18, gameChar_y-13, 7,7);

            //head
            fill(30,144,255);
            ellipse(gameChar_x, gameChar_y-38, 35,35);
            fill(255);
            ellipse(gameChar_x, gameChar_y-34,27,27);

            //bell
            fill(255,0,0);
            rect(gameChar_x-11, gameChar_y-25, 23,3);
            fill(255,255,0);
            ellipse(gameChar_x, gameChar_y-21, 7,7);

            //face
            stroke(0);
            fill(255);
            ellipse(gameChar_x-3, gameChar_y-42, 6,8);
            ellipse(gameChar_x+3, gameChar_y-42, 6,8);
            point(gameChar_x-3, gameChar_y-42);
            point(gameChar_x+2, gameChar_y-42);
            arc(gameChar_x, gameChar_y-33, 12,12,0,PI,OPEN);
            arc(gameChar_x, gameChar_y-15, 12,12,0,PI,CHORD);
            fill(255,0,0);
            ellipse(gameChar_x, gameChar_y-37, 5,5);
        }

        // implement scrolling
        pop();

        // score counter
        drawGamescore();

        // life tokens
        drawLifeTokens();

        // game over
        if(lives <= 0)
            {
                text("Game over. Press space to continue.", width/2 - 300, height/2);
                bgmloop.stop();
                return;
            }

        else if(flagpole.isReached) 
            {
                text("Level complete. Press space to continue.", width/2 - 300, height/2)
                bgmloop.stop();
                return;
            }

        // character cannot go further than x = -340
        if(gameChar_x < - 340)
            {
                isLeft = false;
            }

        ///////////INTERACTION CODE//////////
        //Put conditional statements to move the game character below here

        // locks control when falling into canyon
        if(isPlummeting == true)
        {
            gameChar_y += 3; 
            isFalling = true;
            checkPlayerDie();
            return; 
        }

        // movement controls
        if(isLeft == true)
        {
            gameChar_x -= 3;
        }

        if(isRight == true)
        {
            gameChar_x += 3;
        }         

        // prevent double jump and check platforms
        if(gameChar_y < floorPos_y)
        {
            var isContact = false;
            for(var i = 0; i < platforms.length; i++)
                {
                    if(platforms[i].checkContact(gameChar_x, gameChar_y) == true)
                        {
                            isContact = true;
                            isFalling = false;
                            break;
                        }
                }

            if(isContact == false)
                {
                    gameChar_y += 3;
                    isFalling = true;
                } 
        }

        else
        {
            isFalling = false;
        }    
    }

    function keyPressed()
    {
        // if statements to control the animation of the character when
        // keys are pressed.

        //open up the console to see how these work
        console.log("keyPressed: " + key);

        if(key == "a")
        {
            isLeft = true;
        }

        if(key == "d")
        {
            isRight = true;  
        }

        else if(key == "w")
        {
            if(isFalling == true)
            {  
                gameChar_y -= 0;
            }

            else
            {
                if(flagpole.isReached == false)
                    {
                        gameChar_y -= 100;
                        jumpSound.play();
                    }
            }
        }

        else if(key == " ")
            {
                if(lives <= 0 || flagpole.isReached == true)
                    {
                        setup();
                    }
            }  
    }

    function keyReleased()
    {
        // if statements to control the animation of the character when
        // keys are released.

        console.log("keyReleased: " + key);

        if(key == "a")
        {
            isLeft = false;
        }

        if(key == "d")
        {
            isRight = false;  
        }
    }

    // draw canyon
    function drawCanyon(canyon)
    {
        fill(0,0,0);
        rect(canyon.x_pos, canyon.y_pos, canyon.width, canyon.height);
    }

    // check canyon
    function CanyonCheck(canyon)
    {
        // check if game char is on the floor
        var cond1 = gameChar_y >= height * 3/4

        // check if game char is from the left of canyon
        var cond2 = gameChar_x - gameChar_width/2 > (canyon.x_pos)

        // check if game char is from the right of canyon
        var cond3 = gameChar_x + gameChar_width/2 < (canyon.x_pos + canyon.width)

        // check if game char is over the canyon
        if(cond1 && cond2 && cond3)
        {
            isPlummeting = true;
        }
    }

    // trees for loop
    function drawTree()
    {
        for (var i = 0; i < trees_x.length; i++) 
        {
            noStroke();
            fill(160,82,45);
            rect(trees_x[i],height/2,25,145);
            fill(46,139,87);
            ellipse(trees_x[i]-3, height/2+40,80,80);
            ellipse(trees_x[i]+27,height/2+40,80,80);
            ellipse(trees_x[i]+12, height/2+10,80,80);
        }
    }

    // clouds animation 
    function animateClouds()
    {
        clouds[0].x_pos = clouds[0].x_pos + 0.5;
        clouds[1].x_pos = clouds[1].x_pos +0.5;
        clouds[2].x_pos = clouds[2].x_pos +0.5;
        clouds[3].x_pos = clouds[3].x_pos +0.5;
        clouds[4].x_pos = clouds[4].x_pos +0.5;
        clouds[5].x_pos = clouds[5].x_pos +0.5;
    }

    // clouds for loop using array values
    function drawClouds()
    {
        for (let i = 0; i < clouds.length; i++)
        { 
            fill(255);

            ellipse(clouds[i].x_pos,clouds[i].y_pos, clouds[i].size-70,clouds[i].size-70);

            ellipse(clouds[i].x_pos-50, clouds[i].y_pos,clouds[i].size-50,
                    clouds[i].size-50);

            ellipse(clouds[i].x_pos-60, clouds[i].y_pos+28,clouds[i].size,
                    clouds[i].size-57);

            ellipse(clouds[i].x_pos,clouds[i].y_pos+23,
                    clouds[i].size,clouds[i].size-57);
        }
    }

    // mountains for loop using array values
    function drawMountains()
    {
        for (let i = 0; i < mountains.length; i++)
        {
            fill(169,169,169);

            triangle(mountains[i].x_pos-100,mountains[i].y_pos+232,mountains[i].x_pos,mountains[i].y_pos,mountains[i].x_pos+100,mountains[i].y_pos+232);

            fill(255);

            triangle(mountains[i].x_pos-32,mountains[i].y_pos+75,mountains[i].x_pos,mountains[i].y_pos,mountains[i].x_pos+32,mountains[i].y_pos+75);
        }
    }

    // draw collectable items (dorayaki)
    function drawCollectable(t_collectable)
    {
        if (t_collectable.isFound == false)
            {
                 noStroke();
                 fill(255,239,213);
                 
                 ellipse(t_collectable.x_pos,
                        t_collectable.y_pos,
                        t_collectable.size-7,
                        t_collectable.size-7);

                 fill(205,133,63);

                 ellipse(t_collectable.x_pos,
                         t_collectable.y_pos, t_collectable.size-20,
                         t_collectable.size-20);
            }
    }

    // check collectables
    function checkCollectable(t_collectable)
    {
        if (dist(gameChar_x, gameChar_y, t_collectable.x_pos, t_collectable.y_pos) < 42)
        {
            t_collectable.isFound = true;
            game_score += 1;
            collectSound.play();  
        }
    }

    //  draw flagpole (house)
    function renderFlagpole()
    {
        // house
        fill(255,248,220);
        triangle(flagpole.x_pos+18, 285,
        flagpole.x_pos+72, 255, flagpole.x_pos+130, 285);
        rect(flagpole.x_pos+20, floorPos_y, 110, floorPos_y -580);
        push();
        stroke(200,133,63);
        strokeWeight(8);
        line(flagpole.x_pos+18, 285, flagpole.x_pos+72, 255);
        line(flagpole.x_pos+72, 255, flagpole.x_pos+130, 285);
        pop();

        fill(255,248,220);
        triangle(flagpole.x_pos, 365,
        flagpole.x_pos+100, 330, flagpole.x_pos+200, 365);
        rect(flagpole.x_pos, floorPos_y, 200, floorPos_y -500);
        push();
        stroke(200,133,63);
        strokeWeight(8);
        line(flagpole.x_pos, 365, flagpole.x_pos+100, 330);
        line(flagpole.x_pos+100, 330, flagpole.x_pos+200, 365);
        pop();

        // window
        fill(175,238,238);
        rect(flagpole.x_pos+48, 285, 50, 30);
        push();
        strokeWeight(3);
        stroke(135,206,235);
        rect(flagpole.x_pos+48, 285, 50, 30);
        line(flagpole.x_pos+73, 285, flagpole.x_pos+73, 315);
        pop();

        fill(175,238,238);
        rect(flagpole.x_pos+30, 365, 60, 40);
        push();
        strokeWeight(3);
        stroke(135,206,235);
        rect(flagpole.x_pos+30, 365, 60, 40);
        line(flagpole.x_pos+60, 365, flagpole.x_pos+60, 405);
        pop();

        if(flagpole.isReached)
            {
                // door open
                fill(255);
                rect(flagpole.x_pos+128, 365, 43, 67);
                fill(244,164,96);
                quad(flagpole.x_pos+171, 365, flagpole.x_pos+171, 432, flagpole.x_pos+203, 438, flagpole.x_pos+203, 363);

                push();
                strokeWeight(3);
                stroke(205,133,63);
                line(flagpole.x_pos+128, 365, flagpole.x_pos+171, 365);
                line(flagpole.x_pos+128, 365, flagpole.x_pos+128, 431);
                line(flagpole.x_pos+171, 365, flagpole.x_pos+171, 431);
                point(flagpole.x_pos+196, 395);
                pop();
            }

        else
            {
                // door close
                fill(244,164,96);
                rect(flagpole.x_pos+128, 365, 43, 67);

                push();
                strokeWeight(3);
                stroke(205,133,63);
                line(flagpole.x_pos+128, 365, flagpole.x_pos+171, 365);
                line(flagpole.x_pos+128, 365, flagpole.x_pos+128, 431);
                line(flagpole.x_pos+171, 365, flagpole.x_pos+171, 431);
                point(flagpole.x_pos+135, 395);
                pop();
            }
    }

    // check flagpole (house)
    function checkFlagpole()
    {
        var d = abs(gameChar_x - flagpole.x_pos);  

        if(d < 5)
            {
                flagpole.isReached = true;
            } 
    }   

    // draw score counter
    function drawGamescore()
    {
        noStroke();
        fill(255,239,213);
        ellipse(35,40,45,45);

        fill(205,133,63);     
        ellipse(35,40,30,30);

        textSize(30);
        textFont('consolas');
        text(game_score, 65, 50);
    }

    // check character die
    function checkPlayerDie()
    {
        if(gameChar_y > height)
            {
                lives -= 1;
                bgmloop.stop();
                fallingSound.play();
                if(lives > 0)
                    {
                        startGame();
                    }
            }
    }

    // draw life tokens
    function drawLifeTokens()
    {
        for(var i = 0; i < lives; i++)
            {
                fill(255,69,0);
                arc(40*i+900,30,20,20,PI,0);
                arc(40*i+914,30,20,20,PI,0);
                triangle(40*i+890,30,40*i+907,51,40*i+925,30);
            }
    }

    // draw platforms
    function createPlatforms(x, y, length)
    {
        var p =
            {
                x: x,
                y: y,
                length: length,
                draw: function()
                {
                    fill(50,205,50);
                    rect(this.x, this.y-5, this.length, 30);
                    fill(139,69,19);
                    rect(this.x, this.y+2, this.length, 25);
                },
                checkContact: function(gc_x, gc_y)
                {
                    if(gc_x > this.x && gc_x < this.x + this.length)
                        {
                            var d = this.y - gc_y;
                            if(d >= 0 && d < 8)
                                {
                                    return true;
                                }
                        }

                    return false;
                }   
            }

        return p;
    }

    // draw enemies
    function Enemy(x, y, range)
    {
        this.x = x;
        this.y = y;
        this.range = range;

        this.currentX = x;
        this.inc = 1;
        this.update = function()
        {
            this.currentX += this.inc;

            if(this.currentX >= this.x + this.range)
                {
                    this.inc = -1;
                }

            else if(this.currentX < this.x)
                {
                    this.inc = 1;
                }
        }

        this.draw = function()
        {
            this.update();
            push();
            fill(128,128,128);
            ellipse(this.currentX-5, this.y-5, 10, 10);
            arc(this.currentX, this.y+11, 30, 30, PI, 0);
            fill(255,228,196);
            ellipse(this.currentX-5, this.y-5, 6, 6);
            strokeWeight(3);
            stroke(0);
            point(this.currentX-8, this.y+4);
            line(this.currentX+14, this.y+6, this.currentX+27, this.y+3);
            stroke(255,228,196);
            point(this.currentX-15, this.y+9);
            pop();
        }

        this.checkContact = function(gc_x, gc_y)
        {
            var d = dist(gc_x, gc_y, this.currentX, this.y)

            if(d < 25)
                {
                    return true;
                }

            return false;
        }
    }

