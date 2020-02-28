const sketch = require("sketchrnn");
const https = require('https');
var http = require('http')
var io = require('socket.io').listen(http);
const fs = require('fs');

index = fs.readFileSync(__dirname + '/index.html');

var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(index);
});

var io = require('socket.io').listen(app);

// --- Server Setup --- //

let c = 0;

io.on('connection', function(socket){
  console.log('a user connected');

  c = 0;

  socket.emit("nice");

  socket.on('disconnect', function(){
    console.log('user disconnected');
  });

  socket.on('userPath', function(data){
    console.log("UserPath", data, c++)
    io.emit('userPath', data)
  });

  socket.on('userStart', function(data){
    console.log("userStart", data)
    io.emit('userStart', data)
  });

  //outputDrawStream(socket);

});

app.listen(3000);

// --- Model Setup --- //

function sleep(time, callback) {
    var stop = new Date().getTime();
    while(new Date().getTime() < stop + time) {
        ;
    }
    callback();
}

function outputDrawStream(socket){

  const modelUrl = "https://storage.googleapis.com/quickdraw-models/sketchRNN/large_models/bus.gen.json";

  const request = https.get(modelUrl,
      res => {
          res.setEncoding("utf8");
          let body = ""
          res.on("data", data => {
              body += data;
          });
          res.on('end', () => makeModel(body, socket));
      }
  );

  function makeModel(_json, socket){
    var hrstart = process.hrtime()
    var modelData = JSON.parse(_json);
    var model = new sketch.SketchRNN(modelData);
    hrend = process.hrtime(hrstart)
    console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)

    let model_data = model.zero_state();
    let result = [];

    let stopLoop = 0;
    let strokes = [];

    if (Array.isArray(strokes) && strokes.length) {
     model.updateStrokes(strokes, this.rnnState);
   }

   while (stopLoop != 1) {
     //sleep(1000, function() {

        const pdf = model.get_pdf(model_data, 0.25);

        let things = model.sample(pdf);
        const result = {
          dx: things[0],
          dy: things[1],
        };
        if (things[2] === 1) {
          result.pen = 'down';
        } else if (things[3] === 1) {
          result.pen = 'up';
        } else if (things[4] === 1) {
          result.pen = 'end';
          stopLoop = 1;
        }
        modelState = model.update(things, model_data);
        socket.emit('draw', result);
        console.log(result)
      //})

    }


  }

}
