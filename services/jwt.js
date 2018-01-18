'use strict'

// importo el jwt
var jwt = require('jwt-simple');
// importo la libreria moment para tener la fecha de creación del token
// y luego comprobar si la fecha a expirado o si el token sigue activo
var moment = require('moment');
var secret = 'kendinho7';

exports.createToken = function(user){
	// propiedades para crear el token
	var payload = {
		sub: user.id,
		name: user.name,
		surname: user.surname,
		nick: user.nick,
		email: user.email,
		role: user.role,
		image: user.image,
		iat: moment().unix(), // fecha de creacion del token
		exp: moment().add(30, 'days').unix() // fecha de expiracion
	};
	
	return jwt.encode(payload, secret); // se crea el token con la clave secreta
};