'use strict';

// Required controllers and dependencies
var usersController = require('../controllers/users.controller')();
var helpersController = require('../../helpers/controllers/helpers.controller')();
var authController = require('../../helpers/controllers/auth.controller')();

module.exports = function(app) {

    console.log('hi from routes');
    app.param('userEmail', usersController.userByEmail);

    // Registration Action (CREATE)
    app.route('/api/v1/users/signup')
        .post(helpersController.emptyBodyChecker, usersController.create);

     // Get (READ) profile only if user is authorized and authenticated
    app.route('/api/v1/users/:userEmail')
        .get(authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, usersController.read);

    // Update Action (UPDATE)
    app.route('/api/v1/users/:userEmail')
        .patch(authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, usersController.userUpdate);

    // Add Friend Action (Add friend)
    app.route('/api/v1/users/:userEmail/addFriend')
        .patch(authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, usersController.addFriend);

    // Delete Action (DELETE)
    app.route('/api/v1/users/:userEmail')
        .delete(authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, usersController.deleteUser);

    // Log-in Action
    app.route('/api/v1/users/signin')
        .post(helpersController.emptyBodyChecker, authController.authenticate, usersController.sendUser);
    
    // Get Friends Action 
    app.route('/api/v1/users/:userEmail/friends')
        .post(authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, usersController.getFriends);
};