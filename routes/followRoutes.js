'use strict'

// cargo el modulo de express
var express = require('express');
var FollowController = require('../controllers/followController');
var md_auth = require('../middlewares/authenticated'); // middlewares para la autenticacion del token
var api = express.Router();

api.post('/saveFollow', md_auth.ensureAuth, FollowController.saveFollow);
api.delete('/deleteFollow/:id', md_auth.ensureAuth, FollowController.deleteFollow);
api.get('/following/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowingUsers);
api.get('/followed/:id?/:page?', md_auth.ensureAuth, FollowController.getFollowedUsers);
api.get('/get-my-follow/:followed?', md_auth.ensureAuth, FollowController.getMyFollows);

module.exports = api;