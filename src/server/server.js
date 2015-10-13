'use strict';

//Set the environment of the node application if it's not set
//If the value is undifined then pass the default <development>
process.env.NODE_ENV = process.env.NODE_ENV || 'dev';
var port = process.env.PORT || 7203;

//It is very important to load this configuration here in order
//other modules to be able to use models and database
var mongoose = require('./config/mongoose');
var express = require('./config/express');
var passport = require('./config/passport');
var db = mongoose();
var app = express();
var passport = passport();

app.listen(port, function() {
    console.log('Express server listening on port ' + port);
    console.log('env = ' + app.get('env') +
        '\n__dirname = ' + __dirname +
        '\nprocess.cwd = ' + process.cwd());
});

module.exports = app;