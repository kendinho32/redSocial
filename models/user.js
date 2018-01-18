'use strict'

var mongoose = require('mongoose');
var schema = mongoose.Schema;

// Propiedades del esquema de usuarios
var userSchema = schema({
	name:String,
	surname:String,
	nick:String,
	email:String,
	password:String,
	role:String,
	image:String
});

module.exports = mongoose.model('User', userSchema);