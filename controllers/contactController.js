'use strict'
// libreria utilizada para enviar los correos
var nodemailer = require('nodemailer');

/**
 * Funcion que se encarga de enviar un correo electronico a la cuenta
 * recibida por parametro
 */
function sendContact(req, res) {
	// tomo los parametros que llegan por post
	var params = req.body;
	
	console.log('Email --> ' + params.mail);
	console.log('Password --> ' + params.password);
	
	// Definimos el transporter
	var transporter = nodemailer.createTransport({
	   service: 'Gmail',
	   auth: {
		   user: 'kendinho22@gmail.com',
	       pass: 'kendinho30'
	   }
	});
	
	// Definimos el email
	var mailOptions = {
		from: 'kendinho22@gmail.com',
		to: 'kendinho22@gmail.com',
		subject: 'Prueba de envio de correo con NodeJS',
		text: 'Estamos enviando un correo electronico con nodeJS'
	};
	
	// Enviamos el email
	transporter.sendMail(mailOptions, function(error, info){
	    if (error){
	        console.log(error);
	        res.status(500).send({message : 'Correo no Enviado'});
	    } else {
	    	console.log("Email sent");
		    console.log('Server responded with "%s"', info.response);
		    res.status(200).send({message : 'Mensaje Enviado'});
	    }
	    transporter.close();
	});
	
//	res.status(200).send({
//		message: 'Probando una acción del controlador de contacto'
//	});
	
}

//en este metodo exportamos todos los metodos del controlador
module.exports = {
	sendContact
}