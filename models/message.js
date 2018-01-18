'use strict'

var mongoose = require('mongoose');
var schema = mongoose.Schema;

// Propiedades del esquema de mensajes
var messageSchema = schema({
	text:String,
	viewed:Boolean,
	created_at:String,
	emitter:{ type:schema.ObjectId, ref:'User' },
	receiver:{ type:schema.ObjectId, ref:'User' }
});

module.exports = mongoose.model('Message', messageSchema);