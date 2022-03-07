const objectId = require('mongodb').ObjectId;
const LocalStrategy = require('passport-local');
const passport = require('passport');
const bcrypt = require('bcrypt');
const GitHubStrategy = require('passport-github');


module.exports = function(app, myDataBase){
    // Serialization and deserialization here...
  passport.serializeUser((user, done) => {
    done(null, user._id);
  });
  passport.deserializeUser((id, done) => {
    myDataBase.findOne({ _id: new objectId(id) }, (err, doc) => {
      done(null, doc);
    });
  });

  //local authentication strategy
  passport.use(new LocalStrategy(
    function(username, password, done) {
      myDataBase.findOne({ username: username }, function (err, user) {
        console.log('User '+ username +' attempted to log in.');
        if (err) { return done(err); }
        if (!user) { return done(null, false); }
        if (!bcrypt.compareSync(password,user.password)) { return done(null, false); }
        return done(null, user);
      });
    }
  ));

  
  //Github authentication strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "https://QA.ebdurrehm.repl.co/auth/github/callback"
  },
  function(accessToken, refreshToken, profile, cb) {
    myDataBase.findOne({ 
        githubId: profile.id, 
        username:profile.displayName||'',
        photo: profile.photos[0].value||'',
        email: Array.isArray(profile.emails)?profile.emails[0].value:'no email',
        lastLogin: new Date(),
        provider: profile.provider||'',
        profile_url: profile.profileUrl||''

    
    }, function (err, user) {
      if(user){return cb(null,user)}
      else{
        myDataBase.insertOne({githubId: profile.id}, function(err,user){
          if(err){ return cb(err)}
          return cb(null, user);
        })
      }
    });
  }
));
}