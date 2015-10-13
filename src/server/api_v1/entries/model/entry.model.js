'use strict';

//Definition of diary's entry schema
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var _ = require('underscore');
var geocoderProvider = 'google';
var httpAdapter = 'https';
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter);

var EntrySchema = new Schema({
    title: {
        type: String,
        default: '',
        trim: true,
        validate: [
            function(title) {
                return title.length <= 30;
            }, 'Title should be up to 30 characters'
        ],
        required: 'Title cannot be blank'
    },
    content: {
        type: String,
        default: '',
        trim: true,
        required: 'Content cannot be blank'
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User',
        required: 'User is required'
    },
    created: {
        type: Date,
        default: Date.now
    },
    updated: {
        type: Date,
        default: Date.now
    },
    location: {
        longtitude: {
            type: Number
        },
        latitude: {
            type: Number
        },
        formatted: {
            type: String
        }
    },
    visibility: {
        type: Number,
        default: 0
    },
    tags: [{
        title:{
            type: String,
            trim: true
        }
    }],
    likes: {
        type: Number,
        default: 0
    },
    content_full: {
        type: String,
        default: ''
    }
});

EntrySchema.pre('save', function(next) {
    // solves the hashing problem!
    for (var i = this.tags.length - 1; i >= 0; i--) {
        this.tags[i].title = this.tags[i].title.toLowerCase();
    };
    next();
});

EntrySchema.pre('save', function(next) {
    var self = this;
    
    if (!_.isEmpty(this.location)) {
        console.log("Hello before");
        geocoder.reverse({lat: this.location.latitude, lon: this.location.longtitude}, function(err, res) {
            if (err) {

            } else {
                console.log(res);
                self.location.formatted = res[0].streetName + " " + res[0].streetNumber + " " + res[0].city + " " + res[0].country + " " + res[0].zipcode.replace(/ +/g, "");
            }
            next();
        });
    }
});

EntrySchema.pre('save', function(next) {
    // solves the hashing problem!
    var content;
    
    content = this.title.toLowerCase() + " " + this.content.toLowerCase();
    
    if (this.tags.length > 0) {
        for (var i = this.tags.length - 1; i >= 0; i--) {
            content += " " + this.tags[i].title.toLowerCase() + " " + this.location.formatted.toLowerCase();
        }
    }

    this.content_full = content;
    next();
});

EntrySchema.index({ content_full: 'text'});

mongoose.model('Entry', EntrySchema);