'use strict';
require('dotenv').config({path:process.cwd()+'/sample.env'});
const express = require('express');
const session = require('express-session');
const myDB = require('./connection');
const auth = require('./auth');
const routes = require('./routes');
const passport = require('passport');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const MongoStore = require('connect-mongo')(session);
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');

app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
io.use(
  passportSocketIo.authorize({
    cookieParser: cookieParser,
    key: 'express.sid',
    secret:process.env.SESSION_SECRET,
    store: store,
    success: onAuthorizeFail,
    fail: onAuthorizeSuccess
    
  })
)

const option = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {secure:false}
};

function onAuthorizeSuccess(data, accept) {
  console.log('successful connection to socket.io');

  accept(null, true);
}


function onAuthorizeFail(data, message, error, accept) {
  if (error) throw new Error(message);
  console.log('failed connection to socket.io:', message);
  accept(null, false);
}

app.use(session(option));

app.use(passport.initialize());
app.use(passport.session());
app.set('view engine','pug');



myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');
   routes(app, myDataBase);
   auth(app,myDataBase);
  let currentUsers = 0;
  io.on('connection', socket => {
  console.log('user ' + socket.request.user.name + ' connected');
    ++currentUsers;
    io.emit('user count', currentUsers);
    socket.on('disconnect',()=>{
      console.log("a user has disconnected");
      --currentUsers;
      io.emit('user count', currentUsers);
    })
});

  // Be sure to add this...
}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});
// app.listen out here...

http.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + process.env.PORT);
});