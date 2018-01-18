'use strict'

var userModel = require('../models/user');
var FollowModel = require('../models/follow');
var PublicationModel = require('../models/publication');
var bcrypt = require('bcrypt-nodejs'); // Libreria para encriptar las contraseñas
var mongoosePaginate = require('mongoose-pagination');
//cargo el servicio que vamos a utilizar
var jwt = require('../services/jwt');

//librerias para poder trabajar con ficheros
var fs = require('fs');
var path = require('path');

/**
 * Funcion que permite almacenar la info de un usuario dentro
 * de la BD
 * 
 * @param req Objecto Request que contiene la info enviada
 * @param res Objeto Response que contiene la respuesta al finalizar la ejecucion
 * @returns
 */
function saveUser(req,res){
	var params = req.body; // recojo todos los parametros que se envian a la funcion
	var user = new userModel();
	
	if(params.name && params.surname && params.nick && params.email && params.password){
		user.name = params.name;
		user.surname = params.surname;
		user.nick = params.nick;
		user.email = params.email;
		user.role = params.role;
		user.image = null;
		
		// verifico que no se repita un email y el nick
		userModel.find({$or: [
				{email:user.email.toLowerCase()},
				{nick:user.nick.toLowerCase()}
			]}).exec((err, users) =>{
				if(err){
					res.status(500).send({
						message: 'Error en la petición de usuarios'
					});
				} else {
					if(users && users.length >=1){
						res.status(200).send({
							message: 'El email o el nick ya se encuentran registrados en la BD'
						});
					} else {
						// si no se consiguen usuarios duplicados se almacena la informacion
						// encripto la contraseña
						bcrypt.hash(params.password, null, null, (err, hash) => {
							user.password = hash;
							//salvo la info en la BD
							user.save((err, userStored) =>{
								if(err){
									res.status(500).send({
										message: 'Ocurrio un error al guardar la información en la BD'
									});
								} else {
									if(userStored){
										res.status(200).send({
											user: userStored
										});
									} else {
										res.status(404).send({
											message: 'No se ha registrado el usuario'
										});
									}
								}
							});
						});	
					}
				}
			});	
	} else {
		res.status(200).send({
			message: 'Faltan datos obligatorios'
		});
	}
}

/**
 * funcion que se encarga de identificar el usuario dentro de la base de datos
 * 
 * @param req Objecto Request que contiene la info enviada
 * @param res Objeto Response que contiene la respuesta al finalizar la ejecucion
 */
function loginUser(req, res){
	// tomo los parametros que llegan por post, por bodyParser los parametros que nos son enviados
	// son convertidos en json
	var params = req.body;
	var email = params.email;
	var password = params.password;
	 
	userModel.findOne({email:email.toLowerCase()}, (err, user) =>{ // buscamos el usuario con el objeto user y el metodo findOne con formato json
		if(err){
			res.status(500).send({message:'Error en la petición'});
		} else {
			if(!user){
				res.status(404).send({message:'El usuario no existe'});
			} else {
				// comprobamos la contraseña con bcrypt
				bcrypt.compare(password, user.password, function(err, check) {
					if(check){
						// si existe el gethash se devuelve el token de jwt
						if(params.gethash){
							// llamamos al servicio que genera el token
							res.status(200).send({
								token: jwt.createToken(user)
							});
						} else {
							// devolvemos las caracteristicas del usuario
							// quito la propiedad del password por seguridad
							user.password = undefined;
							res.status(200).send({user});
						}
					} else {
						res.status(404).send({message:'El usuario no ha podido loguearse'});
					}
				});
			}
		}
	}); 
}

/**
 * Conseguir datos de un usuario
 * 
 */
function getUser(req, res){
	// obtengo el id de usuario del request por parametro
	var userId = req.params.id;
	
	userModel.findById(userId, (err, user) =>{
		if(err) return res.status(500).send({message:'Error en la peticion'});
		if(!user) return res.status(400).send({message:'El usuario no existe'});
		
		followThisUser(req.user.sub, userId).then((value) =>{
			user.password = undefined;
			return res.status(200).send({
				user, 
				following: value.following,
				followed: value.followed
			});
		});
	});
}

/**
 * Metodo convertido en sincrono para obtener los seguidos y seguidores
 * 
 * Las funciones async/await buscan simplificar el uso de promesas de manera sincrona 
 * y ejecutar procedimientos en un grupo de Promises. De igual manera que las promesas 
 * se asemejan a callbacks estructurados,  async/await es similar a combinar generadores y promesas.
 */
async function followThisUser(identity_user_id, userId){
	var following = await FollowModel.findOne({user:identity_user_id, 'followed':userId}).exec((err, follow) =>{
		if(err) return handleError(err);
		return follow;
	});
	
	var followed = await FollowModel.findOne({user:userId, 'followed':identity_user_id}).exec((err, follow) =>{
		if(err) return handleError(err);
		return follow;
	});
	
	return {
		following:following, 
		followed:followed
		}
}

/**
 * Devuelve un listado de usuarios paginados
 * 
 * @param req
 * @param res
 * @returns
 */
function getUsers(req, res){
	var identity_user_id = req.user.sub; // id del usuario logueado
	var page = 1;
	
	if(req.params.page){
		page = req.params.page;
	}
	
	var itemsPerPage = 5; // numero de usuarios listados por paginas
	
	userModel.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
		if(err) return res.status(500).send({message:'Error en la peticion'});
		if(!users) return res.status(404).send({message:'No hay usuarios en la plataforma'});
		
		followUserIds(identity_user_id).then((value) =>{
			return res.status(200).send({
				users:users,
				users_following: value.following,
				users_follow_me: value.followed,
				total:total,
				pages:Math.ceil(total/itemsPerPage)
			});
		});
		
	});
}

async function followUserIds(userId){
	var followed_clean = [];
	var following_clean = [];
	
	var following = await FollowModel.find({'user':userId}).select({'_id':0, '__v':0, 'user':0}).exec((err, follows) =>{
		return follows;
	});
	
	var followed = await FollowModel.find({'followed':userId}).select({'_id':0, '__v':0, 'user':0}).exec((err, follows) =>{
		return follows;
	});
	
	// proceso el following ids	
	following.forEach((follow) =>{
		following_clean.push(follow.followed);
	});
	
	// proceso el followed ids	
	followed.forEach((follow) =>{
		followed_clean.push(follow.user);
	});
	
	return {
		following:following_clean,
		followed:followed_clean
	}
}

/**
 * Funcion para actualizar los datos del usuario
 * 
 */
function updateUser(req, res){
	// obtengo el id de usuario del request por parametro(url)
	var userId = req.params.id;
	var update = req.body; // obtengo todos los datos enviados por post
	var user_isset = false;
	
	// borro la propiedad password
	delete update.password;
	
	if(userId != req.user.sub){
		res.status(500).send({message:'No tienes permiso para actualizar la información de este usuario.'});
	} else {
		userModel.find({$or:[{email:update.email.toLowerCase()},{nick:update.nick.toLowerCase()}]}).exec((err, users) =>{
			users.forEach((user) => {
				if(user && user._id != userId) user_isset = true;
			});
			
			if(user_isset) return res.status(200).send({message: 'Los datos ya se encuentran en uso',cod:'100'});
			
			// se le pasa el json {new:true} para que devuelva el objeto nuevo actualizado
			userModel.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) => { // funcion para actualizar los datos
				if(err){
					res.status(500).send({message:'Error actualizando los datos'});
				} else {
					if(!userUpdated){
						res.status(404).send({message:'No se ha podido actualizar el usuario'});
					} else {
						res.status(200).send({user:userUpdated, cod:'000'});
					}
				}
			});
		});
	}
}

/**
 * Metodo para subir el avatar del usuario
 * 
 */
function uploadImage(req, res){
	var userId = req.params.id;
	var file_name = 'No subido...';
	
	if(req.files){
		var file_path = req.files.image.path; // saco el path completo de la imagen
		// cortamos el path
		var file_split = file_path.split('/');
		file_name = file_split[2];
		var ext_split = file_name.split('.'); // obtengo la extension del archivo
		var file_ext = ext_split[1];
		
		if(userId != req.user.sub){
			return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar la foto de este usuario');
		}
		
		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || file_ext == 'gif'){
			userModel.findByIdAndUpdate(userId, {image:file_name}, (err, userUpdated) => {
				if(!userUpdated){
					res.status(404).send({message:'No se ha podido actualizar el usuario'});
				} else {
					console.log('Foto a eliminar: ' + userUpdated.image);
					// Eliminamos la foto antigua del servidor
					fs.unlink("uploads/users/"+userUpdated.image, function() {
						if (err) throw err;
						console.log('Error eliminando fichero: ' + err);
					});
					userUpdated.image = file_name;
					res.status(200).send({image:file_name, user:userUpdated});
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
 * Metodo que se encarga de devolver la imagen del usuario
 */
function getImageFile(req, res){
	var imageFile = req.params.imageFile;
	var path_file = './uploads/users/' + imageFile;
	
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

async function getCountFollow(userId){
	// siguiendo
	var following = await FollowModel.count({'user':userId}).exec((err, count) =>{
		if(err) return handlerError(err);
		return count;
	});
	
	// seguidores
	var followed = await FollowModel.count({'followed':userId}).exec((err,count) =>{
		if(err) return handlerError(err);
		return count;
	});
	
	// publicaciones
	var publications = await PublicationModel.count({'user':userId}).exec((err,count) =>{
		if(err) return handlerError(err);
		return count;
	});
	
	return {
		following: following,
		followed: followed,
		publications: publications
	}
}

//en este modulo exportamos todos los metodos del controlador
module.exports = {
	saveUser,
	loginUser,
	updateUser,
	getUser,
	getUsers,
	uploadImage,
	getImageFile,
	getCounters
}