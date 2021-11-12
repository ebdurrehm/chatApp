var express = require('express');

// App setup
var app = express();
var socket = require('socket.io')





app.use(express.static(__dirname+'/assets'));
app.use(express.json());
app.get('/', (req,res)=>{
    res.sendFile('index.html');
})


var server = app.listen(4000, function(){
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


