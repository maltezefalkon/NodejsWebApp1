/*
 * MAIN
 */

"use strict"

// imports
var express = require('express');
var dataServices = require('./services/dataserver.js');
var signupServices = require('./services/signupserver.js');
var log = require('./modules/logging.js')('main');
var requestLog = require('./modules/logging.js')('requests');
var bodyParser = require('body-parser');

log.info('initializing');

// set up our web app
var app = express();

// =============

// MIDDLEWARE

// log all requests
app.use(function (req, res, next) {
    requestLog.debug({ method: req.method, url: req.url, headers: req.headers, user: req.user });
    next();
});

// tell express that the static files live in the "app" directory 
// and respond to requests to /app URLs
app.use('/app', express.static('app'));

// tell express that our API handlers will be served in response
// to requests to /api URLs
app.use('/api', bodyParser.json({ strict: true }));

// set up passport authentication
var passport = require('./modules/authentication.js')(app, '/login', '/app/Login.html', '/app/ReviewEmployees.html');

// ============
// ROUTES

// API gets (selects)
app.get('/api/:type/:joins?', dataServices.getData);
// API posts (inserts/updates)
app.post('/api/:type', dataServices.postData);

// signup routes
app.use('/signup', bodyParser.urlencoded({ extended: false }));
app.get('/signup/:OrganizationID?', signupServices.getSignupData);
app.post('/signup', signupServices.postSignupData);

// =============

// start listening for requests on port 1337
var port = process.env.PORT || 1337;
app.listen(port);

log.debug('listening on port ' + port);

