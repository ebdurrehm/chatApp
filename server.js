'use strict';
require('dotenv').config({path:process.cwd()+'/sample.env'});
const express = require('express');
const myDB = require('./connection');
const session = require('express-session');
const passport = require('passport');
const objectId = require('mongodb').ObjectId;
const LocalStrategy = require('passport-local');
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

function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    res.render(process.cwd() + '/views/pug/profile');
    next();
  };
  res.redirect('/');
};


myDB(async (client) => {
  const myDataBase = await client.db('database').collection('users');

      // Be sure to change the title
  app.route('/').get((req, res) => {
    // Change the response to render the Pug template
    res.render('pug/index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true
    });
  });

  app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res) => {
    res.redirect('/profile');
  });

   app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/profile', { username: req.user.username });
  });

  app.route('/logout').get((req,res)=>{
    req.logout();
    res.redirect('/');
  })
//user registration route
app.route('/register').post((req,res,next)=>{
  myDataBase.findOne({username: req.body.username}, (err, user)=>{
    if(err){next(err)}
    else if(user){
      res.redirect('/');
    }
    else {
      myDataBase.insertOne({
        username: req.body.username,
        password: req.body.password
      }, (err, doc)=>{
        if(err){ res.redirect('/') }
        else {
          next(null,doc.ops[0]);
        }
      })
    }
  })
}, passport.authenticate('local',{failureRedirect: '/'}), (req,res,next)=>{
  res.redirect('/profile');
})
  

  app.use((req,res,next)=>{
    res.status(404).type('text').send('404 not found');
  })

  // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new objectId(id) }, (err, doc) => {
      done(null, doc);
    });
  });
  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (password !== user.password) { return done(null, false); }
        return done(null, user);
      });
    }
  ));
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
