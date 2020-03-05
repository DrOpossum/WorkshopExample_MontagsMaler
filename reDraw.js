/*
start variables and declarations.
*/

let currentStroke;
let nextPen = "down";

//pen position
let x, y;
//canvas to be drawn onto
let canvas;

var socket = io("http://192.168.1.161:3000")


//blocking loop until model is loaded as well as creating canvas and setting background to red.
//timer is also initialized here
function setup() {
    noLoop();
  canvas = createCanvas(100, 100);
  background(255);

  x = width / 2;
  y = height / 2;
}

socket.on('userPath', (path) => {
    currentStroke = path;
    draw();
    console.log(path);
});

socket.on('userStart', (cords) => {
    x = cords.x;
    y = cords.y;
});



function draw() {
  //setting general stroke weight
  strokeWeight(3);
  stroke(0);

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
  }
}