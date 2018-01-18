'use strict'

// cargo el modulo de express
var express = require('express');
var PublicationController = require('../controllers/publicationController');
var md_auth = require('../middlewares/authenticated'); // middlewares para la autenticacion del token
var api = express.Router();

//para subir archivos o imagenes
var multipart = require('connect-multiparty');
var md_upload = multipart({uploadDir:'./uploads/publications'}); // direccion donde se van a guardar las imagenes

api.post('/savePublication', md_auth.ensureAuth, PublicationController.savePublication);
api.get('/getPublications/:page?', md_auth.ensureAuth, PublicationController.getPublications);
api.get('/getPublication/:id', md_auth.ensureAuth, PublicationController.getPublication);
api.delete('/deletePublication/:id', md_auth.ensureAuth, PublicationController.deletePublication);
api.post('/upload-image-pub/:id', [md_auth.ensureAuth, md_upload], PublicationController.uploadImagePublication);
api.get('/get-image-pub/:imageFile', PublicationController.getImagePublicationFile);

module.exports = api;