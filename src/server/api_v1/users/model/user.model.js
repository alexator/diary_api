'use strict';

//Definition of User's schema
var mongoose = require('mongoose');
var crypto = require('crypto');
var Schema = mongoose.Schema;

//This Schema represents the structure of the User model

var UserSchema = new Schema({
    firstName: {
        type: String,
        validate: [
            function(firstname) {
                return firstname.length <= 30;
            }, 'First Name should be up to 30 characters'
        ],
        required: 'First Name is required'
    },
    lastName: {
        type: String,
        validate: [
            function(lastname) {
                return lastname.length <= 30;
            }, 'Last Name should be up to 30 characters'
        ],
        required: 'Last Name is required'
    },
    email: {
        type: String,
        index: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid e-mail address'],
        required: 'Email is required'
    },
    password: {
        type: String,
        validate: [
            function(password) {
                return password.length >= 8;
            }, 'Password should be at least 8 characters'
        ],
        required: 'Password is required'
    },
    photo: {
        value:{
            type: String
        }
    },
    salt: {
        type: String
    },
    timezone: {
        type: String
    },
    token: {
        type: String
    },
    created: {
        type: Date,
        default: Date.now
    },
    friends: [{
        userId: {
            type: String
        },
        email: {
            type: String
        }
    }]
});

//Provide 'virtual' attributes to the schema
//This modifier will be trigger on on representation level when we call res.json()
UserSchema.virtual('fullName').get(function() {
    return this.firstName + ' ' + this.lastName;
}).set(function(fullName) {
    var splitName  = fullName.split(' ');
    this.firstName = splitName[0] || '';
    this.lastName  = splitName[1] || '';
});

//pre-save condition middleware will encrypt user's password before saving it to the database
UserSchema.pre('save', function(next) {
    // solves the hashing problem!
    if (!this.isModified('password')) {
        return next();
    }

    if (this.password) {
        this.salt = new Buffer(crypto.randomBytes(16).toString('base64'), 'base64');
        this.password = this.hashPassword(this.password);
    }
    next();
});

//will convert string passwords to their hash equivalent
UserSchema.methods.hashPassword = function(password) {
    return crypto.pbkdf2Sync(password, this.salt, 10000, 64).toString('base64');
};

//Because passwords are stored in an encrypted form this instance method will validate the password
UserSchema.methods.validPassword = function(password) {
    return this.password === this.hashPassword(password);
};

//Sets a custom getter modifier to the Schema
//This modifier will be trigger on on representation level when we call res.json()
UserSchema.set('toJSON', {getters: true, virtuals: true});

//Create a model with name User and the aforementioned schema
mongoose.model('User', UserSchema);