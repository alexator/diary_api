'use strict';

//Modules and packages
var express = require('express');
var morgan = require('morgan');
var compress = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var passport = require('passport');
var path = require('path');
var forceSsl = function(req, res, next) {

    if (req.headers['x-forwarded-proto'] !== 'https') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    return next();
};

module.exports = function() {

    var app = express();


    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(methodOverride());
    //TODO-alex: Enforce that the api routes respond only to specific content types such as application/json
    app.use(passport.initialize());

    if (process.env.NODE_ENV === 'dev') {
        console.log('** DEV **');
        app.use(morgan('dev'));
        
        //Application's routes
        require('../api_v1/users/routes/users.routes.js')(app);
        require('../api_v1/entries/routes/entries.routes.js')(app);

    } else if (process.env.NODE_ENV === 'build') {
        console.log('** BUILD **');

        //Application's routes
        require('../api_v1/users/routes/users.routes.js')(app);
        require('../api_v1/entries/routes/entries.routes.js')(app);

    } else if (process.env.NODE_ENV === 'build_heroku') {
        console.log('** BUILD HEROKU**');

        app.use(forceSsl);
        app.use(compress());
        
        //Application's routes
        require('../api_v1/users/routes/users.routes.js')(app);
        require('../api_v1/entries/routes/entries.routes.js')(app);
    }

    return app;
};