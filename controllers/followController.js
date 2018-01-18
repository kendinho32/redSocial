'use strict'

var mongoosePaginate = require('mongoose-pagination');
var UserModel = require('../models/user');
var FollowModel = require('../models/follow');

/**
 * Funcion para registrar que se esta siguiendo a un usuario
 * 
 * @param req
 * @param res
 * @returns
 */
function saveFollow(req, res){
	var follow = new FollowModel();
	var params = req.body;
	
	follow.user = req.user.sub;
	follow.followed = params.followed;
	
	follow.save((err, followStored) =>{
		if(err) return res.status(500).send({message: 'Error al guardar el seguimiento'});
		if(!followStored) return res.status(404).send({message: 'El seguimiento no pudo ser almacenado'});
		return res.status(200).send({follow:followStored});
	});
}

/**
 * Funcion para dejar de seguir aun usuario
 * 
 * @param req
 * @param res
 * @returns
 */
function deleteFollow(req, res){
	var userId = req.user.sub;
	var followId = req.params.id;
	
	FollowModel.find({'user':userId, 'followed':followId}).remove(
			err =>{
				if(err) return res.status(500).send({message: 'Error al dejar de seguir'});
				return res.status(200).send({message: 'El follow a sido eliminado'});
			});
}

/**
 * Para listar los seguidores del usuario
 * 
 * @param req
 * @param res
 * @returns
 */
function getFollowingUsers(req, res){
	var userId = req.user.sub;
	var page = 1;
	var itemsPerPage = 4; // listamos 4 usuarios por pagina
	
	if(req.params.id && req.params.page){
		userId = req.params.id; 
	}
	if(req.params.page){
		page = req.params.page;
	} else {
		page = req.params.id;
	}
	
	FollowModel.find({user:userId}).populate({path:'followed'}).paginate(page, itemsPerPage, (err, follows, total) =>{
		if(err) return res.status(500).send({message: 'Error en el servidor'});
		if(!follows) return res.status(404).send({message: 'No estas siguiendo a ningún usuario'});
		return res.status(200).send(
			{
				total:total,
				pages: Math.ceil(total/itemsPerPage),
				follows
			});
	});
}

/**
 * Funcion que se encarga de listar todos los usuarios que siguen al usuario logueado
 * 
 * @param req
 * @param res
 * @returns
 */
function getFollowedUsers(req, res){
	var userId = req.user.sub;
	var page = 1;
	var itemsPerPage = 4; // listamos 4 usuarios por pagina
	
	if(req.params.id && req.params.page){
		userId = req.params.id; 
	}
	if(req.params.page){
		page = req.params.page;
	} else {
		page = req.params.id;
	}
	
	FollowModel.find({followed:userId}).populate('user').paginate(page, itemsPerPage, (err, follows, total) =>{
		if(err) return res.status(500).send({message: 'Error en el servidor'});
		if(!follows) return res.status(404).send({message: 'No te esta siguiendo ningún usuario'});
		return res.status(200).send(
			{
				total:total,
				pages: Math.ceil(total/itemsPerPage),
				follows
			});
	});
}

/**
 * devuelve los usuarios que sigo o lo que me estan siguiendo
 * @param req
 * @param res
 * @returns
 */
function getMyFollows(req, res){
	var userId = req.user.sub;
	
	var find = FollowModel.find({user:userId});
	if(req.params.followed){
		find = FollowModel.find({followed:userId});
	}
	
	find.populate('user followed').exec((err, follows) =>{
		if(err) return res.status(500).send({message: 'Error en el servidor'});
		if(!follows) return res.status(404).send({message: 'No sigues ningún usuario'});
		
		return res.status(200).send({follows});
	});
}

//en este modulo exportamos todos los metodos del controlador
module.exports = {
	saveFollow,
	deleteFollow,
	getFollowingUsers,
	getFollowedUsers,
	getMyFollows
}