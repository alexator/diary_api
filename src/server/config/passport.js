'use strict';

var passport = require('passport');
var mongoose = require('mongoose');

module.exports = function() {

    //Require it and call it at the same time anonymously
    require('./strategies/local.js')();
};
