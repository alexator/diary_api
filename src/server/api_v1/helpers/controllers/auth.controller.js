'use strict';

var authController = function() {

    // Required controllers and dependencies
    var util = require('util');
    var _ = require('underscore');
    var Entry = require('mongoose').model('Entry');
    var User = require('mongoose').model('User');
    var config = require('../../../config/config');
    var jwt = require('jsonwebtoken');
    var async = require('async');
    
    var passport  = require('passport');

    var errorMsgBadCredentials = {
        msg: 'Invalid credentials'
    };
    var errorMsgNoToken = {
        msg: 'No token available'
    };
    var errorMsgBadToken = {
        msg: 'Bad token'
    };
    var errorMsgAccessDenied = {
        msg: 'Access Denied'
    };

    var authenticate = function (req, res, next) {
        console.log("**authenticate is called**");
        
        passport.authenticate('local', {session: false}, function(err, user, info) {
            if (err) {
                return next(err); // will generate a 500 error
            }
            if (!user) {
                return res.status(401).send(errorMsgBadCredentials);
            }
            req.user = user;
            next();
        })(req, res, next);
    };

    var isAuthorizedOwner = function (req, res, next) {
        console.log("**isAuthorizedOwner is called**");
        
        if (req.user.email && req.tokenUserEmail && req.user.email == req.tokenUserEmail) {
            console.log("is authorized owner");
            next();
        } else {
            console.log("is not authorized owner");
            res.status(403);
            res.send(errorMsgAccessDenied);
        }
    }

    var  aquireToken = function(req, res, next) {
        console.log("**aquireToken is called**");

        var bearerToken;
        var bearerHeader = req.headers.authorization;

        if (typeof bearerHeader !== 'undefined') {
            var bearer = bearerHeader.split(' ');
            bearerToken = bearer[1];
            req.token = bearerToken;
            next();
        } else {
            res.status(403);
            res.send(errorMsgNoToken);
        }
    };

    var verifyToken = function(req, res, next) {
        console.log("**verifyToken is called**");
        
        if (req.token) {
            jwt.verify(req.token, config.tokenSecret, function(err, decoded) {
                if (err) {
                    res.status(403);
                    res.send(errorMsgNoToken);
                } else {
                    // console.log("JWT decoded:" + util.inspect(decoded, false, null));
                    req.tokenUserEmail = decoded.email;
                    next();
                }
            });
        } else {
            res.status(403);
            res.send(errorMsgNoToken);
        }
    };

    var OwnerOrFriend = function (req, res, next) {
        console.log("**OwnerOrFriend is called**");
        
        var found = false;

        var findEntryOwnerId = function(callback) {
            console.log("**findEntryOwnerId is called**");

            User.findOne({_id: req.entry.user}, function(err, user) {
                if (err) {
                    return next(err);
                } else if (user) {
                    req.owner = user;
                    callback();
                } else {
                    res.status(404);
                    res.send({msg: 'User not found'});
                }
            });
        };

        var findRequesterUserId = function(callback) {
            console.log("**findRequesterUserId is called**");

            User.findOne({email: req.tokenUserEmail}, function(err, user) {
                if (err) {
                    return next(err);
                } else if (user) {
                    req.user = user;
                    callback();
                } else {
                    res.status(404);
                    res.send({msg: 'User not found'});
                }
            });
        };

        var completeAction = function (err) {
            if (err) {
                res.status(500);
                res.send({msg: 'Server Error, please try again later'});
            } else {
                if (req.user._id.toString() == req.owner._id.toString()) {
                    // console.log("direct owner");
                    next();
                } else {
                    if (!_.isEmpty(req.user.friends)) {
                        for (var i = req.user.friends.length - 1; i >= 0; i--) {
                            if (req.user.friends[i].userId.toString() == req.owner._id.toString() ) {
                                // console.log("friend owner");
                                found = true;
                            }
                        }
                        
                        if (found) {
                            next();
                        } else {
                            res.status(403);
                            res.send(errorMsgAccessDenied);
                        }
                    } else {
                        res.status(403);
                        res.send(errorMsgAccessDenied);
                    }
                }
            }
        };

        var tasks = [findEntryOwnerId, findRequesterUserId];

        async.parallel(tasks, completeAction);
    }
    
    return {
        authenticate: authenticate,
        aquireToken: aquireToken,
        verifyToken: verifyToken,
        isAuthorizedOwner: isAuthorizedOwner,
        OwnerOrFriend: OwnerOrFriend
    };

};

module.exports = authController;