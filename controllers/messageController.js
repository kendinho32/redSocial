'use strict'

var moment = require('moment');
var moongosePaginate = require('mongoose-pagination');

var UserModel = require('../models/user');
var FollowModel = require('../models/follow');
var MessageModel = require('../models/message');

/**
 * Metodo que sirve para enviar un mensaje a un usuario
 * 
 * @param req
 * @param res
 * @returns
 */
function sendMessage(req, res){
	var params = req.body;
	
	if(!params.text || !params.receiver) return res.status(403).send({message:'Envia los datos necesarios'});
	var message = new MessageModel();
	message.emitter = req.user.sub;
	message.receiver = params.receiver;
	message.text = params.text;
	message.created_at = moment().unix();
	message.viewed = false;
	
	message.save((err, messageStored) =>{
		if(err) return res.status(500).send({message:'Error en la peticion'});
		if(!messageStored) return res.status(500).send({message:'Error al guardar el mensaje'});
		return res.status(200).send({message:messageStored});
	});
}

/**
 * Funcion para listar los mensajes recibidos por un usuario
 * 
 * @param req
 * @param res
 * @returns
 */
function getReceivedMessages(req, res){
	var userId = req.user.sub;
	var page = 1;
	var itemsPerPage = 4;
	
	if(req.params.page){
		page = req.params.page;
	}
	
	MessageModel.find({receiver: userId}).populate('emitter', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total) =>{
		if(err) return res.status(500).send({message:'Error en la peticion'});
		if(!messages) return res.status(404).send({message:'No tiene ningun mensaje para mostrar'});
		return res.status(200).send({
			total:total,
			pages: Math.ceil(total/itemsPerPage),
			messages
		});
	});
}

/**
 * Funcion para listar los mensajes enviados por un usuario
 * 
 * @param req
 * @param res
 * @returns
 */
function getEmmitMessages(req, res){
	var userId = req.user.sub;
	var page = 1;
	var itemsPerPage = 4;
	
	if(req.params.page){
		page = req.params.page;
	}
	
	MessageModel.find({emitter: userId}).populate('receiver', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total) =>{
		if(err) return res.status(500).send({message:'Error en la peticion'});
		if(!messages) return res.status(404).send({message:'No tiene ningun mensaje para mostrar'});
		return res.status(200).send({
			total:total,
			pages: Math.ceil(total/itemsPerPage),
			messages
		});
	});
}

/**
 * Funcion para contar los mensajes que no se han leido
 * 
 */
function getUnViewedMessage(req, res){
	var userId = req.user.sub;
	
	MessageModel.count({receiver:userId, viewed:false}).exec((err, count) =>{
		if(err) return res.status(500).send({message:'Error en la peticion'});
		return res.status(200).send({
			'unviewed':count
		});
	});
}

/**
 * Marcar mensajes como leidos
 */
function setViewedMessages(req, res){
	var userId = req.user.sub;
	
	MessageModel.update({receiver:userId, viewed:false}, {viewed:true}, {'multi':true}, (err, messageUpdate) =>{
		if(err) return res.status(500).send({message:'Error en la peticion'});
		return res.status(200).send({
			messages:messageUpdate
		});
	});
}

//en este modulo exportamos todos los metodos del controlador
module.exports = {
	sendMessage,
	getReceivedMessages,
	getEmmitMessages,
	setViewedMessages,
	getUnViewedMessage
}