/*
 * Middleware o lógica de intercambio de información entre aplicaciones 
 * 
 * */
'use strict'
// importo el jwt
var jwt = require('jwt-simple');
// importo la libreria moment para tener la fecha de creación del token
// y luego comprobar si la fecha a expirado o si el token sigue activo
var moment = require('moment');
var secret = 'kendinho7';

/**
 * Este metodo se ejecuta antes de que llegue a la ejecucion de la funcion del
 * controlador invocado
 */
exports.ensureAuth = function(req, res, next){
	if(!req.headers.token){
		return res.status(403).send({message: 'La petición no tiene la cabecera de Authenticación'});
	}
	
	var token = req.headers.token.replace(/['"]+/g, '');
	try{
		var payload = jwt.decode(token, secret);
		if(payload.exp <= moment().unix()){
			return res.status(401).send({message: 'El token ha expirado'});
		}
	}catch(ex){
		return res.status(401).send({message: 'Token no valido'});
	}
	req.user = payload;
	next(); // con esta funcion salimos de la ejecución del Middleware
}

