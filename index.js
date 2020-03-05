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

index = fs.readFileSync(__dirname + '/play.html');

const mimeType = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.doc': 'application/msword',
  '.eot': 'application/vnd.ms-fontobject',
  '.ttf': 'application/x-font-ttf',
};

var app = http.createServer(function (req, res) {
  console.log(`${req.method} ${req.url}`);

  const parsedUrl = url.parse(req.url);

  const sanitizePath = path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, '');
  let pathname = path.join(__dirname, sanitizePath);

  fs.exists(pathname, function (exist) {
    if(!exist) {
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    if (fs.statSync(pathname).isDirectory()) {
      pathname += '/play.html';
    }

    fs.readFile(pathname, function(err, data){
      if(err){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      } else {
        const ext = path.parse(pathname).ext;
        res.setHeader('Content-type', mimeType[ext] || 'text/plain' );
        res.end(data);
      }
    });
  });


})

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

app.use(express.static('assets'));
app.listen(process.env.PORT || 3000);
