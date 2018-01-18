'use strict'

// cargo el modulo de express
var express = require('express');
var MessageController = require('../controllers/messageController');
var md_auth = require('../middlewares/authenticated'); // middlewares para la autenticacion del token
var api = express.Router();

api.post('/sendMessage', md_auth.ensureAuth, MessageController.sendMessage);
api.get('/my-message/:page?', md_auth.ensureAuth, MessageController.getReceivedMessages);
api.get('/get-emitter-message/:page?', md_auth.ensureAuth, MessageController.getEmmitMessages);
api.get('/unviewed-messages', md_auth.ensureAuth, MessageController.getUnViewedMessage);
api.get('/set-viewed-messages', md_auth.ensureAuth, MessageController.setViewedMessages);

module.exports = api;