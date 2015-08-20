/*
 * Signup Server script
 * 
 */

"use strict"

// requires
var log = require('../modules/logging')('signupserver');
var api = require('../modules/api');
var bcrypt = require('bcryptjs');

// expose the getData method
module.exports.getSignupData = getSignupData;

// expose the postData method
module.exports.postSignupData = postSignupData;

// --------------------------------------------------------------------------------------------------------------------

// public functions

function getSignupData(req, res) {
    var redirPath = '/app/Signup.html';
    if (req.params.OrganizationID) {
        redirPath += '?OrganizationID=' + req.params.OrganizationID;
    }
    res.redirect(redirPath);
}

function postSignupData(req, res) {
    
    var organizationID = req.body.OrganizationID;
    var dateHired = req.body.DateHired;
    var emailAddress = req.body.EmailAddress;
    var title = req.body.Title;
    var firstName = req.body.FirstName;
    var lastName = req.body.LastName;
    var password = req.body.Password;

    // TODO: check permissions on data!
    
    if (req.method == "POST") {
        var hash = bcrypt.hashSync(password);
        var user = {
            EmailAddress: emailAddress,
            UserName: emailAddress,
            Hash: hash
        };

        log.debug({ user: user }, 'Creating user');
        
        // create a User
        api.save('User', user, function (saved) {
            res.redirect('app/Login.html?UserName=' + encodeURIComponent(saved.UserName));
        });

        // create an Educator

    } else {
        throw "Invalid verb routed to postSignupData method";
    }
}

