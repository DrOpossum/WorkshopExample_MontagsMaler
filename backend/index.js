const sketch = require("sketchrnn");
const https = require('https');
var http = require('http')
var io = require('socket.io').listen(http);
const fs = require('fs');
var random_name = require('node-random-name');

const models = [
  'alarm clock',
  'ambulance',
  'angel',
  'ant',
  'antyoga',
  'backpack',
  'barn',
  'basket',
  'bear',
  'bee',
  'beeflower',
  'bicycle',
  'bird',
  'book',
  'brain',
  'bridge',
  'bulldozer',
  'bus',
  'butterfly',
  'cactus',
  'calendar',
  'castle',
  'cat',
  'catbus',
  'catpig',
  'chair',
  'couch',
  'crab',
  'crabchair',
  'crabrabbitfacepig',
  'cruise ship',
  'diving board',
  'dog',
  'dogbunny',
  'dolphin',
  'duck',
  'elephant',
  'elephantpig',
  'eye',
  'face',
  'fan',
  'fire hydrant',
  'firetruck',
  'flamingo',
  'flower',
  'floweryoga',
  'frog',
  'frogsofa',
  'garden',
  'hand',
  'hedgeberry',
  'hedgehog',
  'helicopter',
  'kangaroo',
  'key',
  'lantern',
  'lighthouse',
  'lion',
  'lionsheep',
  'lobster',
  'map',
  'mermaid',
  'monapassport',
  'monkey',
  'mosquito',
  'octopus',
  'owl',
  'paintbrush',
  'palm tree',
  'parrot',
  'passport',
  'peas',
  'penguin',
  'pig',
  'pigsheep',
  'pineapple',
  'pool',
  'postcard',
  'power outlet',
  'rabbit',
  'rabbitturtle',
  'radio',
  'radioface',
  'rain',
  'rhinoceros',
  'rifle',
  'roller coaster',
  'sandwich',
  'scorpion',
  'sea turtle',
  'sheep',
  'skull',
  'snail',
  'snowflake',
  'speedboat',
  'spider',
  'squirrel',
  'steak',
  'stove',
  'strawberry',
  'swan',
  'swing set',
  'the mona lisa',
  'tiger',
  'toothbrush',
  'toothpaste',
  'tractor',
  'trombone',
  'truck',
  'whale',
  'windmill',
  'yoga',
  'yogabicycle',
  'everything',
];


var app = http.createServer(function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("");
});

var io = require('socket.io').listen(app);

// --- Server Setup --- //

let c = 0;

var points = [];
var users = [];
var thingToDraw;
var drawingUser;
var running = false;

function removeItem(array, item){
    for(var i in array){
        if(array[i]==item){
            array.splice(i,1);
            break;
        }
    }
}

function clearStats() {
  points = [];
  users = [];
  thingToDraw = null;
  drawingUser = null;
  running = false;
}

io.on('connection', function(socket){
  users.push(socket.id);
  if(users.length == 3){
    if(running) return;
      running = true;
      var startTimer = setTimeout(function(){
        thingToDraw = models[Math.floor(Math.random() * models.length)];
        drawingUser = users[Math.floor(Math.random() * users.length)];
        io.to(drawingUser).emit('youDraw', {thing: thingToDraw})
        io.emit('chat', { name: "System", msg: random_name({ first: true, seed: drawingUser }) + " is now drawing." })
        for (var i = 0; i < users.length; i++) {
          if(users[i] != drawingUser){
            socket.to(users[i]).emit('youRedraw', {drawer: random_name({ first: true, seed: drawingUser })})
          }
        }
        socket.on('modelFinished', function(){
          io.emit('start', {duration: 10000})
          var stopTimer = setTimeout(function(){
            io.emit('stop', {})
            io.emit('chat', { name: "System", msg: "It was a " +thingToDraw + "!" })
          }, 10000);
        })
      }, 3000)
  }

  socket.on('disconnect', function(){
    removeItem(users,socket.id);
    if(users.length == 2 && running){
      clearStats()
      if(typeof startTimer !== "undefined") clearTimeout(startTimer)
      if(typeof stopTimer !== "undefined") clearTimeout(stopTimer)
      io.emit("reload", {})
    }
  });

  socket.on('userPath', function(data){
    //console.log("UserPath", data, c++)
    io.emit('userPath', data)
  });

  socket.on('userStart', function(data){
    //console.log("userStart", data)
    io.emit('userStart', data)
  });

  socket.on('chat', function(data){
    if(data.msg.toLowerCase() == thingToDraw && socket.id != drawingUser){
      socket.emit('chat', { name: "System", msg: "You guessed corretly!"})
      socket.broadcast.emit('chat', { name: "System", msg: random_name({ first: true, seed: socket.id }) + " guessed corretly!"})
    } else {
      io.emit('chat', { name: random_name({ first: true, seed: socket.id }), msg: data.msg })
    }
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
