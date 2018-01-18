'use strict'

var mongoose = require('mongoose'); // importo moongose para la conexion con la BD
var app = require('./app'); // cargamos express
var port = 3800; // puerto donde va a estar escuchando el api rest

mongoose.Promise = global.Promise;
// conexion BD
mongoose.connect('mongodb://localhost:27017/redsocial', { useMongoClient: true })
		.then(() => {
			console.log('La conexion se ha realizado exitosamente con la BD de la red social');
			// creo el servidor NODE JS
			app.listen(port, () => {
				console.log('Servidor corriendo en http://localhost:3800');
			});
		}).catch(err => console.log(err));