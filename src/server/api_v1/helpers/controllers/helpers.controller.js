'use strict';
var util = require('util');
var _ = require('underscore');

var helpersController = function () {
	
    var emptyBodyChecker = function (req, res, next) {
        if (_.isEmpty(req.body)) {
            res.status(500);
            res.send({msg: "Null body values"});
        } else {
            next();
        }
    }

    return {
    	emptyBodyChecker: emptyBodyChecker
    }
}

module.exports = helpersController;