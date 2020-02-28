/*
start variables and declarations.
*/

let sketchRNN;
//Path object returned from ML5
let currentStroke;
//drawing state of ML5
let nextPen = 'down';
//pen position
let x, y;
//timer output
let timerDiv;
//timer running?
let timerStart = false;
//timer start value
let timer = 1000;
//is the user drawing in the beginning
let userDrawing = false;
let ableToDraw = false;
//canvas to be drawn onto
let canvas;
//userPath array to start model
let seedPath = [];

var socket = io("http://192.168.1.161:3000")

socket.on('draw', (msg) => {
  console.log(msg)
});

//when the model is ready, return the loop and set the background to green.
//the timeout is neccessary for idk what reasons but after 2h of bug fixing i also don't wanna know.
function modelReady() {
  loop();
  background(0, 255, 0);
  setTimeout(() => {
    canvas.mousePressed(userStartDrawing);
    canvas.mouseReleased(Ml5StartDrawing);
    ableToDraw = true;
    canvas.elt.style.pointerEvents = "all";
    seedPath = [];
  }, 1);

}

//blocking loop until model is loaded as well as creating canvas and setting background to red.
//timer is also initialized here.
function setup() {
  noLoop();
  canvas = createCanvas(100, 100);
  canvas.elt.style.pointerEvents = "none";
  background(255, 0, 0);
  timerDiv = createDiv(timer);
  timerDiv.style('font-size', '60pt');
  
  
  //Set mode of what to be drawn here:
  sketchRNN = ml5.sketchRNN('elephantpig', modelReady);
}

//called after model loaded (ableToDraw) and the user clicks
//starts the timer and sets origin of drawing
//making background white
function userStartDrawing() {
  if (ableToDraw) {
    ableToDraw = false;
    userDrawing = true;
    timerStart = true;
    x = mouseX;
    y = mouseY;
    socket.emit('userStart', {
      x: x,
      y: y
    });
    background(255);
  }
}

//after user has drawn (seedpath length > 0)
//generates first path of finished drawing
function Ml5StartDrawing() {
  if (seedPath.length > 0) {
    userDrawing = false;
    timerStart = false;
    ableToDraw = false;
    sketchRNN.generate(seedPath, gotSketchStroke);
  }
}


//callback for setting returned stroke to global scope for use in draw()
function gotSketchStroke(error, stroke) {
  socket.emit('userPath', stroke);
  console.log(stroke);
  draw();
  currentStroke = stroke;
}


function draw() {
  //setting general stroke weight
  strokeWeight(3);

  //if timer is allowed to start and bigger than zero, subtract ~16ms each frame or set to zero.
  if (timerStart && timer > 0) {
    timer -= 1000 / 60;
    timer = timer <= 0 ? 0 : timer;
    timerDiv.html(int(timer));
  }

  //if user ran out of time, SketchRNN takes over
  if (timer == 0 && timerStart) {
    Ml5StartDrawing();
  }

  //if user has time and started drawing make a stroke object with position change.
  //draw line and update pen position with x, y
  //store position change in array
  if (userDrawing && timer > 0) {
    let userPath = {
      dx: mouseX - pmouseX,
      dy: mouseY - pmouseY,
      pen: 'down'
    };
    stroke(0, 0, 255);
    line(x, y, x + userPath.dx, y + userPath.dy);
    x += userPath.dx;
    y += userPath.dy;
    socket.emit('userPath', userPath);
    seedPath.push(userPath);
  }

  //if nextPen == "end" the model has come to an end and the sketch can be stopped
  if (nextPen == 'end') {
    noLoop();
    return;
  }

  //if a stroke was returned by the model, draw it onto the screen when the state is down
  //update x,y and generate next stroke and update penMode
  if (currentStroke) {
    if (nextPen == 'down') {
      stroke(0);
      line(x, y, x + currentStroke.dx, y + currentStroke.dy);
    }

    x += currentStroke.dx;
    y += currentStroke.dy;

    nextPen = currentStroke.pen;
    currentStroke = null;
    sketchRNN.generate(gotSketchStroke);
  }
}