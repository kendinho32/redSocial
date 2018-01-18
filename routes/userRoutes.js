'use strict'

// cargo el modulo de express
var express = require('express');
var userController = require('../controllers/userController');
var md_auth = require('../middlewares/authenticated'); // middlewares para la autenticacion del token

var api = express.Router();

//para subir archivos o imagenes
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir:'./uploads/users'}); // direccion donde se van a guardar las imagenes

api.post('/register', userController.saveUser);
api.post('/login', userController.loginUser);
api.put('/update-user/:id', md_auth.ensureAuth, userController.updateUser); // PUT: Metodo que sirve para actualizar recursos del API
api.get('/user/:id', md_auth.ensureAuth, userController.getUser);
api.get('/users/:page?', md_auth.ensureAuth, userController.getUsers);
api.post('/upload-image-user/:id', [md_auth.ensureAuth, md_upload], userController.uploadImage);
api.get('/get-image-user/:imageFile', userController.getImageFile);
api.get('/counters/:id?', md_auth.ensureAuth, userController.getCounters);

module.exports = api;