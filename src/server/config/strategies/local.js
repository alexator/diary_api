'use strict';

var passport  = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var User = require('mongoose').model('User');

module.exports = function() {

    //Login strategy
    //The third argument of the function is a callback (done) which will be called
    //when the authentication process is over
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, function(username, password, done) {

        User.findOne({
            email: username
        }, function(err, user) {
            if (err) {
                return done(err);
            }

            if (!user) {
                return done(null, false, {message: 'Unknown user'});
            }

            //Custom method delcared on the schema
            if (!user.validPassword(password)) {
                console.log("invalid password");
                return done(null, false, {message: 'Invalid password'});
            }
            return done(null, user);
        });
    }));
};
