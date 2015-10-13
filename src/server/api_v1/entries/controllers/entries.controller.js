'use strict';

var entriesController = function () {

    // Required controllers and dependencies
    var util = require('util');
    var _ = require('underscore');
    var Entry = require('mongoose').model('Entry');
    var User = require('mongoose').model('User');
    var config = require('../../../config/config');
    var jwt = require('jsonwebtoken');
    var async = require('async');
	
	var getErrorMessage = function(err) {
        var message = '';

        for (var errName in err.errors) {
            if (err.errors[errName].message) {
                message = err.errors[errName].message;
            }
        }
        
        return message;
    };

	// CREATE Action
	var create = function(req, res) {
		var entry = new Entry(req.body);

		entry.save (function (err) {
			if (err) {
				res.status(500);
                res.send({msg: getErrorMessage(err)});
			} else {
				res.status(201);
                res.send({msg: 'Entry created'});
			}
		});
	}

	// READ
	var read = function(req, res) {
        // console.log("Read action:" + util.inspect(req, false, null));
        console.log("**read(Entry) is called**");
        if (req.entry && !_.isEmpty(req.entry)) {
        	res.status(200);
        	res.send(req.entry);
        } else {
        	res.status(404);
        	res.send({msg: 'Entry not found'});
        }
    };

	var entryById = function(req, res, next, id) {
        console.log("**entryById is called**");
        Entry.findOne({_id: id}, function(err, entry) {
            if (err) {
                res.status(404);
        		res.send({msg: 'Entry not found'});
            } else {
                // check if the user of the entry is the same with user id if it is not check if the visibility property is 1
                req.entry = entry;
                next();
            }
        });
    }

    var getEntries = function(req, res) {
        console.log("**getEntries is called**");
        var allEntries = {};
        
        var getOwnerEntries = function(callback) {
            console.log("**getOwnerEntries is called**");
            Entry.find({user: req.user._id}, function(err, entries) {
                if (err) {
                    res.status(404);
                    res.send({msg: 'No entries found'});
                } else {
                    console.log("found entries owner");
                    // allEntries =+ entries;
                    allEntries.owner = entries;
                    callback();
                }
            });
        };

        var getFriendsEntries = function(callback) {
            console.log("**getFriendsEntries is called**");
            var friendsId = [];
            if (!_.isEmpty(req.user.friends)) {
                for (var i = req.user.friends.length - 1; i >= 0; i--) {
                    friendsId.push(req.user.friends[i].userId);
                };
                Entry.find({ $and: [{user: {$in: friendsId}}, {visibility: 1}] }, function(err, entries) {
                    if (err) {
                        res.status(500);
                        res.send({msg: 'Server Error, please try again later'});
                    } else {
                        // allEntries.push(entries);
                        allEntries.friends = entries;
                        // allEntries =+ entries;
                        console.log("found entries owner");
                        callback();
                    }
                });
            } else {
                callback();
            }
        };

        var completeAction = function (err) {
            console.log("**completeAction is called**");
            if (err) {
                res.status(500);
                res.send({msg: 'Server Error, please try again later'});
            } else {
                if (!_.isEmpty(allEntries)) {
                    res.status(200);
                    res.send(allEntries);
                } else {
                    res.status(404);
                    res.send({msg: 'No entries found'});
                }
            }
        };

        var tasks = [getOwnerEntries, getFriendsEntries];

        async.parallel(tasks, completeAction);
    }

    var updateEntry = function(req, res) {
        console.log("**updateEntry is called**");
        Entry.findByIdAndUpdate(req.entry._id, req.body, function(err, entry) {
            if (err) { 
                res.status(500);
                res.send({msg: 'Server Error, please try again later'});
            } else if (entry) {
                res.sendStatus(200);
            } else {
                res.status(404);
                res.send({msg: 'No entries found'});
            }
        });
    }

    var deleteEntry = function(req, res) {
        console.log("**deleteEntry is called**");
        Entry.remove({_id: req.entry._id}, function(err) {
            if (err) {
                res.status(500);
                res.send({msg: 'Server Error, please try again later'});
            } else {
                delete req.user;
                delete req.tokenUserEmail;
                delete req.entry;
                res.sendStatus(204);
            }
        });
    }

    var search = function(req, res) {
        var friendsId = [];

        // add user's id and friends
        // use it for the query in combination with AND

        friendsId.push(req.user._id);
        for (var i = req.user.friends.length - 1; i >= 0; i--) {
            friendsId.push(req.user.friends[i].userId);
        };
        Entry.find({ $and: [{user: {$in: friendsId}}, {visibility: 1}, 
            {$text: {$search: req.query.keyword}}, {score: {$meta: 'textScore' }}] })
            .sort({ score : { $meta : 'textScore' } })
            .exec(function(err, results) {
                if (err) {
                    res.status(500);
                    res.send({msg: 'Server Error, please try again later'});
                } else if (results) {
                    res.status(200);
                    res.send(results);
                } else {
                    res.status(404);
                    res.send({msg: 'No entries found'});
                }
            });
        // Entry.find(
        //     {$text: {$search: req.query.keyword}}, {score: {$meta: 'textScore' }})
        //     .sort({ score : { $meta : 'textScore' } })
        //     .exec(function(err, results) {
            //     // callback
            // });
    }

	return {
		create: create,
		entryById: entryById,
		read: read,
        getEntries: getEntries,
        updateEntry: updateEntry,
        deleteEntry: deleteEntry,
        search: search
	}
}

module.exports = entriesController;