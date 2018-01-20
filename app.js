'use strict'
/**
 * app.js Es el fichero encargado de tener toda la configuracion del framework express
 * 
 * Por lo cual se encarga de las rutas, los controladores y las cabeceras
 * 
 * @author Kendall Navarro
 */

var express = require('express');
var bodyParser = require('body-parser');

var app = express(); // cargamos el modulo de express
var path = require('path');

// cargo las rutas
var user_routes = require('./routes/userRoutes');
var follow_routes = require('./routes/followRoutes');
var publication_routes = require('./routes/publicationRoutes');
var message_routes = require('./routes/messageRoutes');
var contact_routes = require('./routes/contactRoutes');


// Middlewares
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// configuro las cabeceras http (cors)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'token, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
 
    next();
});

// rutas
//app.use(express.static(path.join(__dirname, 'client')));
app.use('/', express.static('client', {redirect:false}));
app.use('/api', user_routes);
app.use('/api', follow_routes);
app.use('/api', publication_routes);
app.use('/api', message_routes);
app.use('/api', contact_routes);

app.get('*', function(req, res, next){
	res.sendFile(path.resolve('client/index.html'));
});

// exportar
module.exports = app;