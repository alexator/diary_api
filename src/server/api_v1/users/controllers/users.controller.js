'use strict';

var usersController = function() {

    // Required controllers and dependencies
    var util = require('util');
    var _ = require('underscore');
    var User = require('mongoose').model('User');
    var config = require('../../../config/config');
    var jwt = require('jsonwebtoken');
    var async = require('async');

    var getErrorMessage = function(err) {
        var message = '';

        if (err.code) {
            switch (err.code) {
                case 11000:
                case 11001:
                    message = 'User already exists';
                    break;
                default:
                    message = 'Server Error';
            }
        } else {
            for (var errName in err.errors) {
                if (err.errors[errName].message) {
                    message = err.errors[errName].message;
                }
            }
        }
        return message;
    };

    var createUser = function(req, res) {
        
        console.log("**createUser is called**");
        //Create a new user in the database by using information encapsulated in the request body
        var user = new User (req.body);
        
        // Encapsulate user's infromation for the token
        var userToken = {
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
        };

        // Create the token and sign it
        user.token = jwt.sign(userToken, config.tokenSecret);

        // Save the new user to the database
        user.save(function(err) {
            if (err) {
                res.status(500);
                res.send({msg: getErrorMessage(err)});
            } else {
                res.sendStatus(201);
            }
        });
    };

    var read = function(req, res) {
        console.log("**read is called**");
        var response = {
            user: {
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                fullName: req.user.fullName,
                email: req.user.email,
                timezone: req.user.timezone,
                photoUrl: req.user.photo.value,
                friends: req.user.friends,
                created: req.user.created
            }
        };

        delete req.tokenUserEmail;
        delete req.user;
        res.status(200);
        res.send(response);

    };

    var emptyBodyChecker = function (req, res, next) {
        console.log("**emptyBodyChecker is called**");

        if (_.isEmpty(req.body)) {
            res.status(500);
            res.send({msg: "Null body values"});
        } else {
            next();
        }
    }

    var sendUser = function(req, res) {
        console.log("**sendUser is called**");
        
        var response = {
            data: {
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                fullName: req.user.fullName,
                email: req.user.email,
                timezone: req.user.timezone,
                photoUrl: req.user.photo.value
            },
            token: req.user.token
        };
        
        delete req.user;
        res.status(200);
        res.json(response);
    };

    var userByEmail = function(req, res, next, email) {
        console.log("**userByEmail is called**");
        
        User.findOne({email: email}, function(err, user) {
            if (err) {
                res.status(404);
                res.send({msg: 'User not found'});
            } else if (user) {
                //Add to the original request object a property called user
                //which will contains user's info as acquired from the database
                console.log("found");
                req.user = user;
                next();
            } else {
                res.status(404);
                res.send({msg: 'User not found'});
            }
        });
    };

    var getFriends = function (req, res) {
        console.log("**getFriends is called**");
        
        User.findOne({email: req.user.email}, function(err, user) {
            if (err) {
                return next(err);
            } else if (user) {
                delete req.user;
                delete req.tokenUserEmail;

                if (!_.isEmpty(user.friends)) {
                    res.status(200);
                    res.send(user.friends);
                } else {
                    res.status(404);
                    res.send({msg: 'Friends not found'});
                }
            } else {
                res.status(404);
                res.send({msg: 'User not found'});
            }
        });
    };

    var deleteUser = function (req, res) {
        console.log("**deleteUser is called**");

        User.remove({email: req.user.email}, function(err) {
            if (err) {
                return next(err);
            } else {
                delete req.user;
                delete req.tokenUserEmail;
                res.sendStatus(204);
            }
        });
    };

    var addFriend = function (req, res) {
        
        var friend = {
            email: req.body.email
        };
        
        var getFriendId = function (callback) {
            User.findOne({email: req.body.email}, function(err, user) {
                if (err) {
                    //  server error
                } else if (user) {
                    friend.userId = user._id;
                    callback();
                } else {
                    // not found
                }
            });
        }

        var completeAction = function (err) {
            User.findByIdAndUpdate(req.user._id, {$push: {friends: friend}}, function(err, user) {
                if (err) {
                    // server error
                } else if (user) {
                    console.log(user);
                    res.sendStatus(200);
                } else {
                    // not found user
                }
            });
        };

         var tasks = [getFriendId];
        async.parallel(tasks, completeAction);
    }
    
    var userUpdate = function (req, res) {
        console.log("**userUpdate is called**");
        
        User.findOne({email: req.user.email}, function(err, user) {
            if (err) {
                
                return next(err);
            } else if (user) {
                
                var userToken = {
                    firstName: user.firstName,
                    lastName:  user.lastName,
                    email: user.email,
                };
                
                if (req.body.firstName) {
                    user.firstName = req.body.firstName;
                    userToken.firstName = user.firstName;
                }
                
                if (req.body.lastName) {
                     user.lastName = req.body.lastName;
                     userToken.lastName = user.lastName;
                }
                
                if (req.body.email) {
                    user.email = req.body.email;
                    userToken.email = user.email;
                }
                
                if (req.body.password) {
                    user.password = req.body.password;
                }
                
                if (req.body.timezone) {
                    user.timezone = req.body.timezone;
                }

                user.token = jwt.sign(userToken, config.tokenSecret);

                user.save(function(err) {
                    if (err) {
                        // console.log("Errors:" + util.inspect(err, false, null));
                        res.status(500);
                        res.send({msg: getErrorMessage(err)});
                    } else {
                        delete req.user;
                        delete req.tokenUserEmail;

                        var response = {
                            data: {
                                firstName: user.firstName,
                                lastName: user.lastName,
                                fullName: user.fullName,
                                email: user.email,
                                timezone: user.timezone,
                                photoUrl: user.photo.value
                            },
                            token: user.token
                        };
                        res.status(200);
                        res.send(response);
                    }
                });
            } else {
                res.status(404);
                res.send({msg: 'User not found'});
            }
        });
    };


    return {
        create: createUser,
        read: read,
        sendUser: sendUser,
        userByEmail: userByEmail,
        emptyBodyChecker: emptyBodyChecker,
        deleteUser: deleteUser,
        getFriends: getFriends,
        userUpdate: userUpdate,
        addFriend: addFriend
    };
};

module.exports = usersController;