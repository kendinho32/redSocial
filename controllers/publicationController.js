'use strict'
//librerias para poder trabajar con ficheros
var fs = require('fs');
var path = require('path');

var moment = require('moment');
var moongosePaginate = require('mongoose-pagination');

// modelos
var PublicationModel = require('../models/publication');
var UserModel = require('../models/user');
var FollowModel = require('../models/follow');

/**
 * Metodo que almacena una publicacion dentro de la base de datos
 * 
 * @param req
 * @param res
 * @returns
 */
function savePublication(req, res){
	var params = req.body;
	
	if(!params.text) return res.status(200).send({message:'Debes enviar un texto!!'});
	
	var Publications = new PublicationModel();
	Publications.text = params.text;
	Publications.user = req.user.sub;
	Publications.created_at = moment().unix();
	
	Publications.save((err, publicationStored) => {
		if(err) return res.status(500).send({message:'Error al guardar la publicacion!!'});
		if(!publicationStored) return res.status(404).send({message:'La publicacion no ha sido guardada!!'});
		return res.status(200).send({publication:publicationStored});
	});
}

/**
 * Metodo que se encarga de listar todas las publicaciones de la base de datos
 * 
 * @param req
 * @param res
 * @returns
 */
function getPublications(req, res){
	var page = 1;
	var itemsPerPage = 4;
	
	if(req.params.page){
		page = req.params.page;
	}
	
	FollowModel.find({user:req.user.sub}).populate('followed').exec((err, follows) => {
		if(err) return res.status(500).send({message:'Error al devolver los follows'});
		var follows_clean = [];
		
		follows.forEach((follow) => {
			follows_clean.push(follow.followed);
		});
		
		// busco las publicaciones de todos los usuarios que esten dentro del arreglo
		// las ordeno por las mas nuevas
		PublicationModel.find({user:{'$in':follows_clean}}).sort('-created_at').populate('user').paginate(page, itemsPerPage, (err, publications, total) =>{
			if(err) return res.status(500).send({message:'Error al devolver las publicaciones'});
			if(!publications) return res.status(404).send({message:'No hay publicaciones!!'});
			return res.status(200).send({
				total_items:total,
				publications:publications,
				pages:Math.ceil(total/itemsPerPage),
				page:page
			});
		});
	});
}

/**
 * Funcion que se encarga de devolver una publicacion atraves de su id
 * 
 */
function getPublication(req, res){
	var publicationId = req.params.id;
	
	PublicationModel.findById(publicationId, (err,publication) =>{
		if(err) return res.status(500).send({message:'Error al devolver la publicacion'});
		if(!publication) return res.status(404).send({message:'No existe la publicacion!!'});
		
		return res.status(200).send({publication});
	});
}

/**
 * Metodo para eliminar una publicacion a traves de su ID
 * 
 * @param req
 * @param res
 * @returns
 */
function deletePublication(req, res){
	var publicationId = req.params.id;
	
	// compruebo si la publicacion me pertenece y no es de otro usuario
	PublicationModel.find({user: req.user.sub, '_id':publicationId}).remove(err =>{
		if(err) return res.status(500).send({message:'Error al eliminar la publicacion'});		
		return res.status(200).send({message:'Publicacion eliminada.'});
	});
}

/**
 * Metodo para subir una imagen en una publicacion
 * 
 */
function uploadImagePublication(req, res){
	var publicationId = req.params.id;
	var file_name = 'No subido...';
	
	if(req.files){
		var file_path = req.files.image.path; // saco el path completo de la imagen
		// cortamos el path
		var file_split = file_path.split('/');
		file_name = file_split[2];
		var ext_split = file_name.split('.'); // obtengo la extension del archivo
		var file_ext = ext_split[1];
				
		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
			PublicationModel.findOne({'user':req.user.sub, '_id':publicationId}).exec((err, publication) =>{
				if(publication){
					// actualizo el documento de la publicacion
					PublicationModel.findByIdAndUpdate(publicationId, {file:file_name}, {new:true}, (err, publicationUpdated) => {
						if(!publicationUpdated){
							res.status(404).send({message:'No se ha podido actualizar el usuario'});
						} else {
							res.status(200).send({publication:publicationUpdated});
						}
					});
				} else {
					return removeFilesOfUploads(res, file_path,'No tienes permiso para actualizar la publicacionS');	
				}
			});
			
		} else {
			return removeFilesOfUploads(res, file_path,'La extensión no es correcta');	
		}
	} else {
		res.status(404).send({message:'No has subido ninguna imagen...'});
	}
}

function removeFilesOfUploads(res, file_path, msj){
	fs.unlink(file_path, (err) => {
		return res.status(200).send({message:msj});
	});
}

/**
 * Metodo que se encarga de devolver la imagen de la publicacion
 */
function getImagePublicationFile(req, res){
	var imageFile = req.params.imageFile;
	var path_file = './uploads/publications/' + imageFile;
	
	// Se comprueba si existe la imagen que se quiere buscar en el directorio de subida de imagenes
	fs.exists(path_file, function(exists){
		if(exists){
			res.sendFile(path.resolve(path_file));
		} else {
			res.status(404).send({message:'La imagen no existe'});
		}
	});
}

/**
 * Funcion que nos devuelve cuantos usuarios seguimos, cuantos usuarios nos sigue
 * cuantas publicaciones tenemos
 */
function getCounters(req, res){
	var userId = req.user.sub;
	if(req.params.id){
		userId = req.params.id;
	}
	
	getCountFollow(userId).then((value) =>{
		return res.status(200).send(value);
	});
	
}

//en este modulo exportamos todos los metodos del controlador
module.exports = {
	savePublication,
	getPublications,
	getPublication,
	deletePublication,
	uploadImagePublication,
	getImagePublicationFile
}