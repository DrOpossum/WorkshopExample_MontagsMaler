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

app.listen(process.env.PORT || 3000);
