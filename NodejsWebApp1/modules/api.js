"use strict"

var http = require('http');
var db = require('../modules/metadata');
var log = require('../modules/logging')('api');
var uuid = require('uuid');

module.exports.save = saveData;

function saveData(typeKey, o, callback) {
    var options = {
        port: 1337,
        path: '/api/' + typeKey,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    var req = http.request(options, function (res) {
        var data = '';
        res.on('data', function (chunk) {
            data += chunk;
        });
        res.on('end', function () {
            log.debug({ requestOptions: options, data: data }, 'Received data via API');
            if (callback) {
                callback(JSON.parse(data));
            }
        });
    });
    req.on('error', function (err) {
        log.error({ obj: o, error: err }, 'Error with API call');
    });
    req.write(JSON.stringify(o));
    req.end();
}