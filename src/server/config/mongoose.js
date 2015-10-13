'use strict';

var config = require('./config');
var mongoose = require('mongoose');

//Returns an instance of our database
module.exports = function() {

    var db = mongoose.connect(config.db);

    // Require the models of the application here
    require('../api_v1/users/model/user.model');
    require('../api_v1/entries/model/entry.model');

    return db;
};
