'use strict';

// Required controllers and dependencies
var usersController = require('../../users/controllers/users.controller')();
var entriesController = require('../controllers/entries.controller')();
var helpersController = require('../../helpers/controllers/helpers.controller')();
var authController = require('../../helpers/controllers/auth.controller')();

module.exports = function(app) {

    console.log('hi from entry routes');
    app.param('entryId', entriesController.entryById);
    app.param('userEmail', usersController.userByEmail);

    // Create entries Action (CREATE)
    app.route('/api/v1/users/:userEmail/entries/new')
        .post(helpersController.emptyBodyChecker, authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, entriesController.create);

    // Get entry action
    app.route('/api/v1/entries/:entryId')
        .get(authController.aquireToken, authController.verifyToken, authController.OwnerOrFriend, entriesController.read);

    // Get all entries action
    app.route('/api/v1/users/:userEmail/entries')
        .get(authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, entriesController.getEntries);

    // Update Action (UPDATE)
    app.route('/api/v1/users/:userEmail/entries/:entryId')
        .patch(authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, entriesController.updateEntry);

    // Delete Action (DELETE)
    app.route('/api/v1/users/:userEmail/entries/:entryId')
        .delete(authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, entriesController.deleteEntry);

        // Search action
    app.route('/api/v1/users/:userEmail/entries/search')
        .get(authController.aquireToken, authController.verifyToken, authController.isAuthorizedOwner, entriesController.search);
};