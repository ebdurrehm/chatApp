var express = require('express');

// App setup
var app = express();
var socket = require('socket.io')


app.set('port', process.env.PORT||4000);


app.use(express.static(__dirname+'/assets'));
app.use(express.json());
app.get('/', (req,res)=>{
    res.sendFile('index.html');
})


app.use(function(req, res){
  res.type('text/plain');
  res.status(404);
  res.send('404 - Not Found');
 });
var server = app.listen(app.get('port'), function(){
    console.log('listening for requests on port 4000,');
});

let io = socket(server)
io.on('connection', function(socket){
  console.log(`${socket.id} is connected`);
  socket.on('disconnect',()=>{
      console.log(`${socket.id} is disconnected`)
  })
  
     socket.send(JSON.stringify({
      type: "serverMsg",
      message: "Welcome to my site!"
    }))
  })

var users=[];
io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      var msg = JSON.parse(msg)
      console.log(`${msg.name} : ${msg.message}`);
      socket.name=msg.name;
      
    });
   
  });

  io.on('connection', (socket) => {
    socket.on('chat message', (msg) => {
      io.emit('chat message', msg);
    });
  });


