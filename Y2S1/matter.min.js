// Snooker Game 

// Matter.js init 
let Engine = Matter.Engine;
let World = Matter.World;
let Bodies = Matter.Bodies;
let Body = Matter.Body;

// all globalvariables
let engine, world;
let table, pockets = [];
let balls = [];
let cueBall;
let score = 0;
let cueIsBeingDragged = false;
let startedDragging = null;
// Maximum force 
let forceMaximum = 1; 

// Inital gamemode
let ballArrangement = 1;  

// Constants and initial values
// Table dimensions
const tableWidth = 600;
const tableHeight = tableWidth / 2;

// Cushion dimensions
const innerLiningWidth = 10;
const cornerOffset = innerLiningWidth;
const horizontalOffset = 140;
const verticalOffset = 138;
const pocketGapOffset = 7;

// Balls
const ballDiameter = tableWidth / 50;
const pocketDiameter = ballDiameter * 1.5;
const tablePocketGap = pocketDiameter * 1.1;

// Power variables 
let initialStr = 0.001; 
const minCueShotPower = 0.001; 
const maxCueShotPower = 0.004; 

// Cue Ball Logic
let cueBallIsBeingPlaced = false; 
let cueBallPocketed = false; 

// Track the last potted ball color
let lastPottedBallColor = null;
let initialBallPositions = {}; // Global object to store initial positions

let errorMessage = "";
let errorMessageTimer = 0; // Duration for showing the message in frames

// Global variable for debug mode
let debugMode = false;


// Ball colors
const ballColourArray = ["red", "yellow", "green", "brown", "blue", "pink", "black"];

let ballHitSound, wallHitSound, ballPocketedSound, cueBallHitSound; 

function preload() {
    outputVolume(0.5);
    ballHitSound = loadSound('assets/ballHit.mp3'); // Cue ball hitting another ball
    wallHitSound = loadSound('assets/wallHit.mp3'); // Cue ball hitting a wall
    ballPocketedSound = loadSound('assets/ballPocketed.mp3'); // Cue ball being potted
    cueBallHitSound = loadSound('assets/cueBallHit.mp3'); // Cue ball hitting nothing
}

function setup() {
    createCanvas(1000, 1000);

    // Initialize Matter.js engine
    engine = Engine.create();
    world = engine.world;

    // Disable gravity
    engine.world.gravity.y = 0;
    engine.world.gravity.x = 0;

    // Initialize table, pockets, and balls
    table = { x: width / 2, y: height / 2, width: tableWidth, height: tableHeight, color: color(0, 128, 0) };
    setupPockets();
    setupBalls();
    setupTable();

    // Add collision handling for the cue ball
    Matter.Events.on(engine, "collisionStart", ballCollisionDetector);

    // Run the engine
    Engine.run(engine);

    // Start the game in cue ball placement mode
    startCueBallPlacement();
}

// Draw Function
function draw() {
    background(0);

    Engine.update(engine);

    drawSnookerTableObject();
    drawSnookerTablePockets();
    drawSnookerBalls();

    if (cueBallIsBeingPlaced) {
        fill(255, 255, 255, 100);
        noStroke();
        ellipse(mouseX, mouseY, ballDiameter);

        textSize(16);
        fill(255);
        textAlign(CENTER, CENTER);
        text('Click to place the cue ball in the "D"', width / 2, height / 2 - 100);
    } else {
        drawPoolCue();
    }

    drawInstructions();
    drawScoring();

    if (debugMode) {
        fill(255, 0, 0);
        textSize(20);
        textAlign(CENTER, CENTER);
        text("Debug Mode Active", width / 2, height - 50);
    }

    snookerBallPocketing();

    if (errorMessageTimer > 0) {
        textSize(20);
        fill(255, 0, 0);
        textAlign(CENTER, CENTER);
        text(errorMessage, table.x, table.y - table.height / 2 - 50);
        errorMessageTimer--;
    }

    cueBallStats();
}

function drawInstructions() {
    fill(255);
    textSize(14);
    textAlign(LEFT, TOP);

    text("Instructions:", 10, 10);
    text("1. Use the mouse and click to place the cue ball in the 'D' zone.", 10, 30);
    text("2. Drag and release the mouse to shoot the cue ball.", 10, 50);
    text("3. Use keys 1, 2, or 3 to switch game modes.", 10, 70);
    text("4. Aim for high scores by potting balls.", 10, 90);
    text("5. Avoid potting the cue ball!", 10, 110);
}


// All drawings for the table
// table and wooden border
function drawSnookerTableObject() {
    // wood border
    fill(89, 45, 3);   
    rectMode(CENTER);
    stroke(0, 100);
    strokeWeight(2);
    rect(table.x, table.y, table.width + 30, table.height + 30);

    // green table
    fill(table.color);
    rect(table.x, table.y, table.width, table.height);

    // Draw the "D" area to place cue ball
    let dRadius = table.width / 8; 
    let dCenterX = table.x + table.width / 4; 
    let dCenterY = table.y; 

    stroke(255); 
    strokeWeight(3);
    noFill();

    // Draw semicircle 
    arc(dCenterX, dCenterY, dRadius * 2, dRadius * 2, -HALF_PI, HALF_PI);

    // lines to create full markings
    line(dCenterX - dRadius + 75, dCenterY - dRadius, dCenterX - dRadius + 75, dCenterY + dRadius);

    
    line(dCenterX , dCenterY - dRadius, dCenterX , table.y - table.height / 2 + 2);
    line(dCenterX, dCenterY + dRadius, dCenterX, table.y + table.height / 2 - 2);

    // Add golden bumpers at the 4 corners
    drawTableCornerPads();
    drawInnerTableLining();
}

// calculating points for cushions
function calculateCushionPoints(xOffset1, yOffset1, xOffset2, yOffset2, xOffset3, yOffset3, xOffset4, yOffset4) {
    return [
        { x: table.x + xOffset1, y: table.y + yOffset1 },
        { x: table.x + xOffset2, y: table.y + yOffset2 },
        { x: table.x + xOffset3, y: table.y + yOffset3 },
        { x: table.x + xOffset4, y: table.y + yOffset4 },
    ];
}

function setupTable() {
    // Trapezium-shaped cushions for Matter.js
    function createInnerTableLining(points) {
        return Bodies.fromVertices(
            points.reduce((sum, p) => sum + p.x, 0) / 4, // Center x
            points.reduce((sum, p) => sum + p.y, 0) / 4, // Center y
            [points],
            { isStatic: true }
        );
    }

    // Horizontal cushions
    let horizontalCushions = [
        createInnerTableLining(
            calculateCushionPoints(
                -table.width / 2 + tablePocketGap - pocketGapOffset, -table.height / 2,
                -table.width / 4 + horizontalOffset, -table.height / 2,
                -table.width / 4 + 3 - cornerOffset + verticalOffset, -table.height / 2 + innerLiningWidth,
                -table.width / 2 + tablePocketGap + cornerOffset - pocketGapOffset, -table.height / 2 + innerLiningWidth
            )
        ),
        createInnerTableLining(
            calculateCushionPoints(
                table.width / 2 - tablePocketGap + pocketGapOffset, -table.height / 2,
                table.width / 4 - horizontalOffset, -table.height / 2,
                table.width / 4 - 3 + cornerOffset - verticalOffset, -table.height / 2 + innerLiningWidth,
                table.width / 2 - tablePocketGap - cornerOffset + pocketGapOffset, -table.height / 2 + innerLiningWidth
            )
        ),
        createInnerTableLining(
            calculateCushionPoints(
                -table.width / 2 + tablePocketGap - pocketGapOffset, table.height / 2,
                -table.width / 4 + horizontalOffset, table.height / 2,
                -table.width / 4 + 3 - cornerOffset + verticalOffset, table.height / 2 - innerLiningWidth,
                -table.width / 2 + tablePocketGap + cornerOffset - pocketGapOffset, table.height / 2 - innerLiningWidth
            )
        ),
        createInnerTableLining(
            calculateCushionPoints(
                table.width / 2 - tablePocketGap + pocketGapOffset, table.height / 2,
                table.width / 4 - horizontalOffset, table.height / 2,
                table.width / 4 - 3 + cornerOffset - verticalOffset, table.height / 2 - innerLiningWidth,
                table.width / 2 - tablePocketGap - cornerOffset + pocketGapOffset, table.height / 2 - innerLiningWidth
            )
        ),
    ];

    // Vertical cushions
    let verticalCushions = [
        createInnerTableLining(
            calculateCushionPoints(
                -table.width / 2, -table.height / 2 + tablePocketGap - pocketGapOffset,
                -table.width / 2, table.height / 2 - tablePocketGap + pocketGapOffset,
                -table.width / 2 + innerLiningWidth, table.height / 2 - tablePocketGap - cornerOffset + pocketGapOffset,
                -table.width / 2 + innerLiningWidth, -table.height / 2 + tablePocketGap + cornerOffset - pocketGapOffset
            )
        ),
        createInnerTableLining(
            calculateCushionPoints(
                table.width / 2, -table.height / 2 + tablePocketGap - pocketGapOffset,
                table.width / 2, table.height / 2 - tablePocketGap + pocketGapOffset,
                table.width / 2 - innerLiningWidth, table.height / 2 - tablePocketGap - cornerOffset + pocketGapOffset,
                table.width / 2 - innerLiningWidth, -table.height / 2 + tablePocketGap + cornerOffset - pocketGapOffset
            )
        ),
    ];

    // Add cushions as physics objects
    [...horizontalCushions, ...verticalCushions].forEach(cushion => World.add(world, cushion));
}

function drawInnerTableLining() {
    fill(0, 100, 0); 
    noStroke();

    function drawCushion(points) {
        quad(
            points[0].x, points[0].y,
            points[1].x, points[1].y,
            points[2].x, points[2].y,
            points[3].x, points[3].y
        );
    }

    // Horizontal cushions
    drawCushion(
        calculateCushionPoints(
            -table.width / 2 + tablePocketGap - 7, -table.height / 2,
            -table.width / 4 + 140, -table.height / 2,
            -table.width / 4 + 3 - cornerOffset + 138, -table.height / 2 + innerLiningWidth,
            -table.width / 2 + tablePocketGap + cornerOffset - 7, -table.height / 2 + innerLiningWidth
        )
    );
    drawCushion(
        calculateCushionPoints(
            table.width / 2 - tablePocketGap + 7, -table.height / 2,
            table.width / 4 - 140, -table.height / 2,
            table.width / 4 - 3 + cornerOffset - 138, -table.height / 2 + innerLiningWidth,
            table.width / 2 - tablePocketGap - cornerOffset + 7, -table.height / 2 + innerLiningWidth
        )
    );
    drawCushion(
        calculateCushionPoints(
            -table.width / 2 + tablePocketGap - 7, table.height / 2,
            -table.width / 4 + 140, table.height / 2,
            -table.width / 4 + 3 - cornerOffset + 138, table.height / 2 - innerLiningWidth,
            -table.width / 2 + tablePocketGap + cornerOffset - 7, table.height / 2 - innerLiningWidth
        )
    );
    drawCushion(
        calculateCushionPoints(
            table.width / 2 - tablePocketGap + 7, table.height / 2,
            table.width / 4 - 140, table.height / 2,
            table.width / 4 - 3 + cornerOffset - 138, table.height / 2 - innerLiningWidth,
            table.width / 2 - tablePocketGap - cornerOffset + 7, table.height / 2 - innerLiningWidth
        )
    );

    // Vertical cushions
    drawCushion(
        calculateCushionPoints(
            -table.width / 2, -table.height / 2 + tablePocketGap - 7,
            -table.width / 2, table.height / 2 - tablePocketGap + 7,
            -table.width / 2 + innerLiningWidth, table.height / 2 - tablePocketGap - cornerOffset + 7,
            -table.width / 2 + innerLiningWidth, -table.height / 2 + tablePocketGap + cornerOffset - 7
        )
    );
    drawCushion(
        calculateCushionPoints(
            table.width / 2, -table.height / 2 + tablePocketGap - 7,
            table.width / 2, table.height / 2 - tablePocketGap + 7,
            table.width / 2 - innerLiningWidth, table.height / 2 - tablePocketGap - cornerOffset + 7,
            table.width / 2 - innerLiningWidth, -table.height / 2 + tablePocketGap + cornerOffset - 7
        )
    );
}

// Draw gold pads around the table pockets
function drawTableCornerPads() {
    fill(184, 134, 11); 
    noStroke();

    let tablePadSize = 15; // Length of the triangle sides
    let halfTableWidth = table.width / 2 + 22;
    let halfTableHeight = table.height / 2 + 22;

    // Corner pads
    // Top-left corner
    triangle(
        table.x - halfTableWidth + 7, table.y - halfTableHeight + 7, // Corner point
        table.x - halfTableWidth - tablePadSize + 22, table.y - halfTableHeight + 22, // Left point
        table.x - halfTableWidth + 22, table.y - halfTableHeight - tablePadSize + 22 // Top point
    );

    // Top-right corner
    triangle(
        table.x + halfTableWidth - 7, table.y - halfTableHeight + 7, // Corner point
        table.x + halfTableWidth + tablePadSize - 22, table.y - halfTableHeight + 22, // Right point
        table.x + halfTableWidth - 22, table.y - halfTableHeight - tablePadSize + 22 // Top point
    );

    // Bottom-left corner
    triangle(
        table.x - halfTableWidth + 7, table.y + halfTableHeight - 7, // Corner point
        table.x - halfTableWidth - tablePadSize + 22, table.y + halfTableHeight - 22, // Left point
        table.x - halfTableWidth + 22, table.y + halfTableHeight + tablePadSize - 22 // Bottom point
    );

    // Bottom-right corner
    triangle(
        table.x + halfTableWidth - 7, table.y + halfTableHeight - 7, // Corner point
        table.x + halfTableWidth + tablePadSize - 22, table.y + halfTableHeight - 22, // Right point
        table.x + halfTableWidth - 22, table.y + halfTableHeight + tablePadSize - 22 // Bottom point
    );

    // center pads
    let rectWidth = 25; 
    let rectHeight = 10; 

    // top center pad
    rect(table.x, table.y + 160, rectWidth, rectHeight);

    // bottom center pad
    rect(table.x , table.y - 160, rectWidth, rectHeight);
}


// create pockets sensors
function setupPockets() {
    let positions = [
        { x: table.x - table.width / 2 + 5 , y: table.y - table.height / 2 + 5 },
        { x: table.x, y: table.y - table.height / 2 },
        { x: table.x + table.width / 2 - 5, y: table.y - table.height / 2 + 5 },
        { x: table.x - table.width / 2 + 5, y: table.y + table.height / 2 - 5 },
        { x: table.x, y: table.y + table.height / 2 },
        { x: table.x + table.width / 2 - 5, y: table.y + table.height / 2 - 5 }
    ];

    for (let pos of positions) {
        let pocket = Bodies.circle(pos.x, pos.y, pocketDiameter / 2, { 
            isStatic: true, 
            isSensor: true 
        });
        pockets.push(pocket);
        World.add(world, pocket);
    }
}

// pocket drawings
function drawSnookerTablePockets() {
    fill(0);
    noStroke();
    for (let pocket of pockets) {
        ellipse(pocket.position.x, pocket.position.y, pocketDiameter); 
    }
}

function drawPoolCue() {
    if (cueIsBeingDragged && startedDragging) {
        // calculate angle
        let angle = atan2(mouseY - cueBall.position.y, mouseX - cueBall.position.x);
        let dragDistance = dist(mouseX, mouseY, cueBall.position.x, cueBall.position.y);
        // limit drag distance
        dragDistance = constrain(dragDistance, 0, 100); 
        
        // Append power to drag distance
        initialStr = map(dragDistance, 0, 100, minCueShotPower, maxCueShotPower);
        initialStr = constrain(initialStr, minCueShotPower, maxCueShotPower);

        // dynamic line colour based on strength
        if (0.001 < initialStr && initialStr < 0.002) {
            stroke(0, 255, 0); // Green
        } else if (0.002 < initialStr && initialStr < 0.003) {
            stroke(0, 0, 255); // Blue
        } else if (initialStr > 0.003) {
            stroke(255, 0, 0); // Red (Max power)
        } 

        // aiming line
        strokeWeight(5);
        line(
            cueBall.position.x,
            cueBall.position.y,
            cueBall.position.x - cos(angle) * dragDistance,
            cueBall.position.y - sin(angle) * dragDistance
        );
        noStroke();
            

        // Draw pool cue
        push();
        translate(cueBall.position.x, cueBall.position.y);
        // align cue with aiming direction
        rotate(angle); 
        fill(139, 69, 19); 
        noStroke();
        rectMode(CENTER);
        rect(dragDistance + 50, 0, 100, 10); 
        // white tip
        fill(255); 
        rect(dragDistance, 0, 10, 10);
        fill(0, 128, 255); 
        rect(dragDistance - 5, 0, 5, 10);
        fill(0, 50)
        rect(dragDistance + 50, 5, 100, 5); 
        pop();
    }
}

// Draw balls
function drawSnookerBalls() {
    balls.forEach(ball => {
        // ball styling
        fill(0, 100);  
        noStroke();
        ellipse(ball.position.x + 1, ball.position.y + 2.5, ballDiameter);  
        // actual ball
        fill(ball.render.fillStyle || 255);
        noStroke();
        ellipse(ball.position.x, ball.position.y, ballDiameter);
        // shadow
        fill(0, 100);
        noStroke();
        ellipse(ball.position.x - 1, ball.position.y + 0.5, ballDiameter - 2, ballDiameter);
        // shine
        fill(255, 200);
        noStroke();
        ellipse(ball.position.x + 2, ball.position.y - 2, ballDiameter / 4);
    });

    // cue ball separately with a shadow effect 
    fill(0, 100); 
    noStroke();
    ellipse(cueBall.position.x + 1, cueBall.position.y + 2.5, ballDiameter);

    // white cue ball
    fill(255);  
    ellipse(cueBall.position.x, cueBall.position.y, ballDiameter);

    // red dot on cue ball
    fill(255, 0, 0);
    noStroke();
    ellipse(cueBall.position.x, cueBall.position.y, ballDiameter / 4);
}

// Set up ball objects
// Placing balls on table as physics objects
function setupBalls() {
    cueBall = Bodies.circle(table.x + tableWidth / 4 + 3 * ballDiameter, table.y, ballDiameter / 2, {
        restitution: 0.9,
        friction: 0.01,
        frictionAir: 0.02
    });
    World.add(world, cueBall);

    let rows = 5;
    let startX = table.x + tableWidth / 4;
    let startY = table.y;
    let spacing = ballDiameter + 2;

    for (let i = 0; i < rows; i++) {
        for (let j = 0; j <= i; j++) {
            let x = startX + i * (spacing * 0.866);
            let y = startY - (i / 2) * spacing + j * spacing;

            let ballXpos = 2 * table.x - x;
            let ballBodies = Bodies.circle(ballXpos, y, ballDiameter / 2, { restitution: 0.9, friction: 0.01 });
            ballBodies.render = { fillStyle: "red" };
            balls.push(ballBodies);
            World.add(world, ballBodies);
        }
    }

    let coloredPositions = [
        { color: "yellow", x: table.x - tableWidth / 4, y: table.y + ballDiameter * 4.5 },
        { color: "green", x: table.x - tableWidth / 4, y: table.y - ballDiameter * 4.5 },
        { color: "brown", x: table.x - tableWidth / 4, y: table.y },
        { color: "blue", x: table.x, y: table.y },
        { color: "pink", x: startX - spacing * 2, y: startY },
        { color: "black", x: startX + spacing * 5, y: startY }
    ];

    coloredPositions.forEach(pos => {
        let ballXpos = 2 * table.x - pos.x;
        let ballBodies = Bodies.circle(ballXpos, pos.y, ballDiameter / 2, { restitution: 0.9, friction: 0.01 });
        ballBodies.render = { fillStyle: pos.color };
        balls.push(ballBodies);
        World.add(world, ballBodies);

        initialBallPositions[pos.color] = { x: ballXpos, y: pos.y };
    });
}


// Red balls random
function drawRandomReds() {
     // Create the cue ball
     cueBall = Bodies.circle(table.x - tableWidth / 4 + 3 * ballDiameter, table.y, ballDiameter / 2, {
        restitution: 0.09,
        friction: 0.01,
        frictionAir: 0.02
    });
    World.add(world, cueBall);

    balls = [];

    let numberOfReds = 15;

    for (let i = 0; i < numberOfReds; i++) {
        let x = random(table.x - tableWidth / 2 + 20, table.x + tableWidth / 2 - 20);
        let y = random(table.y - tableHeight / 2 + 20, table.y + tableHeight / 2 - 20);
        

        let ball = Bodies.circle(x, y, ballDiameter / 2, { restitution: 0.9, friction: 0.01 });
        ball.render = { fillStyle: "red" };
        balls.push(ball);
        World.add(world, ball);
    }

    console.log('Reds placed in random positions.');
}

// random coloured balls and reds
function drawRandomColours() {
    cueBall = Bodies.circle(table.x - tableWidth / 4 + 3 * ballDiameter, table.y, ballDiameter / 2, {
        restitution: 0.9,
        friction: 0.01,
        frictionAir: 0.02
    });
    World.add(world, cueBall);

    balls = [];
    initialBallPositions = {}; 

    let reds = 15;
    let coloredPositions = [
        { color: "yellow" },
        { color: "green" },
        { color: "brown" },
        { color: "blue" },
        { color: "pink" },
        { color: "black" }
    ];

    for (let i = 0; i < reds; i++) {
        let x = random(table.x - tableWidth / 2 + 20, table.x + tableWidth / 2 - 20);
        let y = random(table.y - tableHeight / 2 + 20, table.y + tableHeight / 2 - 20);

        let ball = Bodies.circle(x, y, ballDiameter / 2, { restitution: 0.9 });
        ball.render = { fillStyle: "red" };
        balls.push(ball);
        World.add(world, ball);
    }

    coloredPositions.forEach(position => {
        let x = random(table.x - tableWidth / 2 + 20, table.x + tableWidth / 2 - 20);
        let y = random(table.y - tableHeight / 2 + 20, table.y + tableHeight / 2 - 20);

        let colouredBall = Bodies.circle(x, y, ballDiameter / 2, { restitution: 0.9 });
        colouredBall.render = { fillStyle: position.color };
        balls.push(colouredBall);
        World.add(world, colouredBall);

        
        initialBallPositions[position.color] = { x: x, y: y };
    });

    console.log('Reds and coloured balls placed in random positions.');
}

// debug mode for the demo
function setupDebugMode() {
    clearTable();
    cueBallIsBeingPlaced = true;

    let ball1 = Bodies.circle(
        table.x + table.width / 2 - pocketDiameter * 1.5,
        table.y + table.height / 2 - pocketDiameter * 1.5,
        ballDiameter / 2,
        { restitution: 0.9 }
    );
    ball1.render = { fillStyle: "yellow" };

    let ball2 = Bodies.circle(
        table.x + table.width / 2 - pocketDiameter * 1.5,
        table.y - table.height / 2 + pocketDiameter * 1.5,
        ballDiameter / 2,
        { restitution: 0.9 }
    );
    ball2.render = { fillStyle: "blue" };

    balls.push(ball1, ball2);
    World.add(world, [ball1, ball2]);

    
    initialBallPositions["yellow"] = { x: ball1.position.x, y: ball1.position.y };
    initialBallPositions["blue"] = { x: ball2.position.x, y: ball2.position.y };
}

// clear all physics ball objects
function clearTable() {
    for (let i = 0; i < balls.length; i++) {
        World.remove(world, balls[i]);
    }
    balls = [];  // Clear balls array
    score = 0;
    World.remove(world, cueBall);
}

// Game logic functions
// Collisions  
function ballCollisionDetector(event) {
    let pairs = event.pairs;

    for (let pair of pairs) {
        let bodyA = pair.bodyA;
        let bodyB = pair.bodyB;

        let ball = null;
        let other = null;

        if (balls.includes(bodyA)) {
            ball = bodyA;
            other = bodyB;
        } else if (balls.includes(bodyB)) {
            ball = bodyB;
            other = bodyA;
        }
        // collision detection
        if (ball) {
            if (balls.includes(other)) {
                console.log("Two balls have collided");
                ballHitSound.play();
            } else if (other.label === "wall") {
                console.log("Ball hit wall");
                wallHitSound.play();
            } else {
                console.log("Ball hit something");
            }
        }

        // cue ball collision
        if (bodyA === cueBall || bodyB === cueBall) {
            let otherBody = bodyA === cueBall ? bodyB : bodyA;

            if (balls.includes(otherBody)) {
                let ballColor = otherBody.render.fillStyle || "unknown";
                console.log(`Cue ball hit ${ballColor}`);
                ballHitSound.play();

                if (ballColor === "red") {
                    console.log("Cue ball hit red ball");
                } else {
                    console.log("Cue ball hit colored ball");
                }
            } else if (otherBody.label === "wall") {
                console.log("Cue ball hit a wall");
                wallHitSound.play();
            }
        }
    }
}
// Pocketing balls
function snookerBallPocketing() {
    balls = balls.filter(ball => {
        let pocketed = pockets.some(pocket =>
            dist(ball.position.x, ball.position.y, pocket.position.x, pocket.position.y) < pocketDiameter / 2
        );

        if (pocketed) {
            let ballColor = ball.render.fillStyle || "unknown";

            if (ballColor !== "red" && initialBallPositions[ballColor]) {
                // Check for consecutive colored balls
                if (lastPottedBallColor && lastPottedBallColor !== "red") {
                    if (ballColor === lastPottedBallColor) {
                        // Consecutive same-colored balls potted
                        score -= 5; 
                        errorMessage = `Consecutive ${ballColor} balls potted! Points deducted.`;
                        errorMessageTimer = 120;
                    } else {
                        // Consecutive different-colored balls potted
                        score -= 5; 
                        errorMessage = `Consecutive colored balls potted: ${lastPottedBallColor} and ${ballColor}. Points deducted!`;
                        errorMessageTimer = 120;
                    }
                }

                // Update last potted ball color
                lastPottedBallColor = ballColor;

                // Reset the position of the colored ball after pocketed
                Body.setPosition(ball, initialBallPositions[ballColor]);
                Body.setVelocity(ball, { x: 0, y: 0 }); 
                return true; 
            }

            if (ballColor === "red") {
                // Update last potted ball to avoid false consecutive detection
                lastPottedBallColor = "red";

                // Remove red ball from the game after pocketing
                World.remove(world, ball);
                score += 5;
                ballPocketedSound.play();
                return false;
            }
        }
        return true;
    });

    // if cue ball is pocketed
    if (!cueBallPocketed &&
        pockets.some(pocket =>
            dist(cueBall.position.x, cueBall.position.y, pocket.position.x, pocket.position.y) < pocketDiameter / 2
        )
    ) {
        errorMessage = "Cue ball potted! Penalty applied!";
        errorMessageTimer = 120;
        score -= 10;
        cueBallIsBeingPlaced = true;
        World.remove(world, cueBall);
        ballPocketedSound.play();
        cueBallPocketed = true;
    }

    if (!cueBallIsBeingPlaced) {
        cueBallPocketed = false;
    }
}



function areBallsMoving() {
    for (let ball of balls) {
        if (ball.speed > 0.01) { 
            return true;
        }
    }
    if (cueBall.speed > 0.01) {
        return true;
    }
    return false;
}

// User inputs
function mousePressed() {
    if (cueBallIsBeingPlaced) {
        // d area
        let dRadius = table.width / 8;
        let dCenterX = table.x + table.width / 4;
        let dCenterY = table.y;

        // mouse check to avoid placement outside D
        let withinCircle = dist(mouseX, mouseY, dCenterX, dCenterY) <= dRadius;
        let withinRightSide = mouseX >= dCenterX;

        if (withinCircle && withinRightSide) {
            // place cue ball upon click
            cueBall = Bodies.circle(mouseX, mouseY, ballDiameter / 2, {
                restitution: 0.9,
                friction: 0.01,
                frictionAir: 0.02
            });
            World.add(world, cueBall);

            cueBallIsBeingPlaced = false; 
        } else {
            errorMessage = "Place the cue ball within the 'D' zone!";
            errorMessageTimer = 120; // Display error 
        }
    } else if (dist(mouseX, mouseY, cueBall.position.x, cueBall.position.y) < ballDiameter) {
        // if not in placement mode allow dragging the cue 
        cueIsBeingDragged = true;
        startedDragging = { x: mouseX, y: mouseY };
    }
}
// mouse released function
function mouseReleased() {
    if (cueIsBeingDragged && startedDragging) {
        if (areBallsMoving()) {
            errorMessage = "Please wait for all balls to come to a stop!";
            errorMessageTimer = 120; 
            cueIsBeingDragged = false;
            startedDragging = null;
            return;
        }

        // drag distance
        let dragDistance = dist(mouseX, mouseY, cueBall.position.x, cueBall.position.y);

        // power based on drag distance
        initialStr = map(dragDistance, 0, 100, minCueShotPower, maxCueShotPower);
        initialStr = constrain(initialStr, minCueShotPower, maxCueShotPower);

        let force = p5.Vector.sub(createVector(cueBall.position.x, cueBall.position.y), createVector(mouseX, mouseY));
        force.setMag(initialStr); // Scale force based on the calculated power

        // Apply force to the cue ball
        Body.applyForce(cueBall, cueBall.position, { x: force.x, y: force.y });

        cueBallHitSound.play(); 

        // Reset dragging variable
        cueIsBeingDragged = false;
        startedDragging = null;
    }
}

// logic for game modes and debug mode upon key press
function keyPressed() {
    if (key === '1') {
        debugMode = false; 
        ballArrangement = 1;
        clearTable();
        setupBalls();
        startCueBallPlacement();
        console.log('Game Mode 1: Starting positions');
    } else if (key === '2') {
        debugMode = false; 
        ballArrangement = 2;
        clearTable();
        drawRandomReds();
        startCueBallPlacement();
        console.log('Game Mode 2: Reds only in random positions');
    } else if (key === '3') {
        debugMode = false; 
        ballArrangement = 3;
        clearTable();
        drawRandomColours();
        startCueBallPlacement();
        console.log('Game Mode 3: Reds and coloured balls in random positions');
    } else if (key === 'D' || key === 'd') {
        debugMode = !debugMode;
        if (debugMode) {
            setupDebugMode();
            console.log("Debug Mode Enabled");
        } else {
            clearTable();
            setupBalls();
            startCueBallPlacement();
            console.log("Debug Mode Disabled");
        }
    }
}

// detect if game starts and does cue ball placement
function startCueBallPlacement() {
    cueBallIsBeingPlaced = true; 
    if (cueBall) {
        World.remove(world, cueBall); 
    }
}

// Extra functions
function drawScoring() {
    fill(255);
    textSize(20);
    textAlign(CENTER, CENTER);
    text(`Score: ${score}`, width / 2, 30);

    text(`Power: ${nf((initialStr * 1000) - 1, 1, 0)}`, width / 2, 60);
}

//debug info to check the
function cueBallStats() {
    fill(255);
    textSize(12);
    textAlign(LEFT);
    text(`Cue Ball Position: (${nf(cueBall.position.x, 1, 1)}, ${nf(cueBall.position.y, 1, 1)})`, 10, height - 30);
    text(`Cue Ball Velocity: (${nf(cueBall.velocity.x, 1, 1)}, ${nf(cueBall.velocity.y, 1, 1)})`, 10, height - 15);
}

//Commentary
// This snooker game project stands out through the integration of unique features designed to enhance gameplay and immersion. A key innovation is the color-changing aiming line, which provides real-time feedback to the player based on the strength of their shot. The line changes color dynamically—green for low power, blue for medium power, and red for high power—allowing players to intuitively gauge the force applied, adding a layer of precision to the gameplay.

// Another notable addition is the realistic sound system that enriches the auditory experience. Sounds such as the cue ball striking another ball, hitting a cushion, or being potted are carefully synchronized with the in-game events. These effects not only bring the game to life but also help players understand interactions visually and aurally. For instance, distinct sounds for ball collisions and cue impacts ensure immediate recognition of the type of interaction.

// The implementation of a debug mode is a feature tailored for development and testing purposes. Activating this mode places two balls strategically near pockets to test interactions and physics. A visual indicator, "Debug Mode Active," is displayed beneath the table, ensuring clarity during testing. This feature demonstrates an intentional approach to making the development process efficient and user-friendly.

// The physics of the cue ball and other components have been fine-tuned beyond the standard requirements. Cushion and ball collisions exhibit realistic restitution and friction properties, simulating the dynamics of a real snooker game. The addition of a debug mode cue ball placement system further enhances control over testing specific scenarios.

// These enhancements collectively elevate the project beyond the baseline requirements, offering both a technically robust and creatively engaging experience. By combining intuitive visuals, immersive audio, and robust testing tools, this project demonstrates innovation and attention to detail in game development.