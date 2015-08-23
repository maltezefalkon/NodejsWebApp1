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
    var redirPath = '/app/EducatorSignup.html';
    if (req.params.OrganizationID) {
        redirPath += '?OrganizationID=' + req.params.OrganizationID;
    }
    res.redirect(redirPath);
}

function postSignupData(req, res) {
    
    var data = req.body;
    
    // TODO: check permissions on data!
    
    if (req.method == "POST") {
        
        var educator = {
            _TypeKey: 'Educator',
            Title: data.Title,
            FirstName: data.FirstName,
            MiddleName: data.MiddleName,
            LastName: data.LastName,
            Suffix: data.Suffix,
            FormerName: data.FormerName,
            DateOfBirth: data.DateOfBirth,
            Last4: data.Last4,
            PPID: data.PPID,
            EmailAddress: data.EmailAddress,
            TelephoneNumber: data.TelephoneNumber,
            Address1: data.Address1,
            Address2: data.Address2,
            City: data.City,
            State: data.State,
            ZipCode: data.ZipCode
        };
        
        var hash = bcrypt.hashSync(data.Password);
        var user = {
            _TypeKey: 'User',
            EmailAddress: data.EmailAddress,
            UserName: data.EmailAddress,
            Hash: hash
        };
        
        educator.LinkedUser = user;
        
        log.debug({ educator: educator }, 'Creating signup objects');
        
        api.save([educator])
            .then(function () {
            res.redirect('/app/Login.html?UserName=' + encodeURIComponent(user.UserName));
            res.end();
        }, function (err) {
            res.send(err);
            res.end();
        });
    
    } else {
        throw "Invalid verb routed to postSignupData method";
    }
}

