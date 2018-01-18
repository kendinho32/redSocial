'use strict'

var mongoose = require('mongoose');
var schema = mongoose.Schema;

// Propiedades del esquema de publicaciones
var publicationSchema = schema({
	text:String,
	file:String,
	created_at:String,
	user:{ type:schema.ObjectId, ref:'User' }
});

module.exports = mongoose.model('Publication', publicationSchema);