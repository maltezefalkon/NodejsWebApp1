// imports
var passport = require('passport');
var db = require('./metadata.js');
var log = require('./logging.js')('authentication');
var uuid = require('uuid');
var session = require('express-session');
var passportLocal = require('passport-local');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var bcrypt = require('bcryptjs');
var LocalStrategy = passportLocal.Strategy;

module.exports = function (app, loginHandlerPath, loginPagePath, defaultPagePath) {
    app.use(session({ genid: function (req) { return uuid(); }, secret: 'doralia-x-e3', saveUninitialized: false, resave: false }));
    app.use(loginHandlerPath, bodyParser.urlencoded({ extended: false }));
    app.use(loginHandlerPath, cookieParser());
    setupStrategy(app, loginHandlerPath);
    app.use(passport.initialize());
    app.use(passport.session());
    // authentication
    app.post(loginHandlerPath, function (req, res, next) {
        passport.authenticate('local', function (err, user, info, status) {
            log.info({ err: err, user: user, info: info, status: status }, 'authentication callback called');
            if (err) {
                return next(err);
            } else if (!user) {
                return res.redirect(loginPagePath + '?message=' + info.message);
            } else {
                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    } else {
                        return res.redirect(defaultPagePath);
                    }
                });
            }
        })(req, res, next);
    });
    return passport;
};

function setupStrategy(app, path) {
    passport.use('local', new LocalStrategy(
        { usernameField: 'username', passwordField: 'password' },
        function (username, password, done) {
            log.debug({ username: username, password: password, done: done }, 'LocalStrategy authentication method invoked');
            var query = { where: { UserName: username } };
            db.User.findOne(query)
                .then(function (user) {
                        log.debug({ user: user }, 'user retrieved successfully');
                        if (bcrypt.compareSync(password, user.Hash)) {
                            log.debug('password matched');
                            done(null, user);
                        } else {
                            done(null, user, { message: 'Incorrect password.' });
                        }
                    })
                .catch(function (err) {
                        log.error({ error: err }, 'Error retrieving user');
                        done(null, false, { message: 'Error retrieving user: ' + err, err: err });
                    });
        }
    ));
    
    /*
    // doing things by ID
    passport.serializeUser(function (req, user, done) {
        log.debug({ user: user }, 'serializeUser called (ID version)');
        done(null, user.UserID);
    });
    passport.deserializeUser(function (req, id, done) {
        log.debug({ UserID: id, req: req }, 'deserializeUser called (ID version)');
        var query = { where: { UserID: id } };
        // findById doesn't work for some reason
        db.User.findOne(query)
            .then(function (user) {
                log.debug({ user: user }, 'User successfully deserialized (ID version)');
                done(null, user);
            })
            .catch(function (err) {
                log.debug({ error: err }, 'Error deserializing user (ID version)');
                done(null, false);
            });
    });
    */

    // doing things by object
    passport.serializeUser(function (req, user, done) {
        log.debug({ user: user }, 'serializeUser called (object version)');
        done(null, user);
    });
    passport.deserializeUser(function (req, user, done) {
        log.debug({ user: user, req: req }, 'deserializeUser called (object version)');
        done(null, user);
    });
}