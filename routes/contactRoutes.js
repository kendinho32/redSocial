'use strict'

var express = require('express');
var ContactController = require('../controller/contactController');
var api = express.Router();

api.post('/contact', ContactController.sendContact);

module.exports = api;