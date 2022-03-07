'use strict';
require('dotenv').config({path:process.cwd()+'/sample.env'});
const express = require('express');
const session = require('express-session');
const myDB = require('./connection');
const auth = require('./auth');
const router = require('./router');
const passport = require('passport');
const app = express();


app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const option = {
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: {secure:false}
};

app.use(session(option));

app.use(passport.initialize());
app.use(passport.session());
app.set('view engine','pug');



myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');
   router(app, myDataBase);
   auth(app,myDataBase);
      
  // Be sure to add this...
}).catch((e) => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});
// app.listen out here...

app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + process.env.PORT);
});
