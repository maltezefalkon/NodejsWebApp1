/*
 * Data Server script
 * 
 */

"use strict"

// requires
var http = require('http');
var url = require('url');
var queryString = require('querystring');
var db = require('../modules/metadata');
var log = require('../modules/logging')('dataserver');
var uuid = require('uuid');

// expose the getData method
module.exports.getData = getData;

// expose the postData method
module.exports.postData = postData;

// --------------------------------------------------------------------------------------------------------------------

// public functions
    
function getData(req, res) {
    
    // express routing parameters for root type and joins
    var typeKey = req.params.type;
    var joins = req.params.joins;
    
    // query string (filter)
    var thisUrl = url.parse(req.url, true);
    var condition = thisUrl.query;
    
    if (req.method == "GET") {
        var properties = [];
        if (joins) {
            properties = joins.split(',');
        }
        var includes = buildIncludes(db, typeKey, properties);
        if (db[typeKey]) {
            db[typeKey].findAll({ where: condition, include: includes }).then(
                function (results) {
                    res.send(results);
                    res.end();
                });
        } else {
            throw "Undefined type name: " + typeKey;
        }
    } else {
        throw "Invalid verb routed to getData method";
    }
}

function postData(req, res) {
    
    // express route parameter for type name
    var typeKey = req.params.type;

    if (req.method == "POST") {
        if (req.body instanceof Array) {
            log.debug('Saving an array of ' + req.body.length.toString() + ' ' + typeKey);
            for (var i = 0; i < req.body.length; i++) {
                saveObject(typeKey, req.body[i], res);
            }
        } else {
            log.debug('Saving a single ' + typeKey);
            saveObject(typeKey, req.body, res);
        }
    } else {
        throw "Invalid verb routed to postData method";
    }
}

// --------------------------------------------------------------------------------------------------------------------

// private functions

function buildIncludes(db, contextTypeKey, paths) {
    var ret = [];
    var map = {};
    for (var i = 0; i < paths.length; i++) {
        var currentTypeKey = contextTypeKey;
        var parsed = paths[i].split('.');
        var head = parsed.shift();
        var thisPath = head;
        var currentInclude = null;
        if (!map[thisPath]) {
            var newInclude = { as: head };
            map[thisPath] = newInclude;
            currentInclude = newInclude;
            ret.push(currentInclude);
        } else {
            currentInclude = map[thisPath];
        }
        while (head) {
            currentTypeKey = db.Metadata[currentTypeKey].Relationships[head].RelatedTypeKey;
            currentInclude['model'] = db[currentTypeKey];
            head = parsed.shift();
            if (head) {
                thisPath += '.' + head;
                if (!map[thisPath]) {
                    if (!currentInclude.include) {
                        currentInclude.include = [];
                    }
                    var newInclude = { as: head };
                    currentInclude.include.push(newInclude);
                    map[thisPath] = newInclude;
                    currentInclude = newInclude;
                } else {
                    currentInclude = map[thisPath];
                }
            }
        }
    }
    return ret;
}

function saveObject(typeKey, o, res) {
    var insert = supplyKeyIfNecessary(typeKey, o);
    if (insert) {
        log.info('Inserting ' + typeKey);
    } else {
        log.info('Updating ' + typeKey);
    }
    db[typeKey].upsert(o).then(function () {
        log.info({ insert: insert, typeKey: typeKey, object: o }, 'Saved');
        res.send(o);
        res.end();
    }).catch(function (err) {
        log.error({ err: err, typeKey: typeKey, insert: insert, object: o }, 'Error Saving object');
        res.end('' + err);
    });
}

function supplyKeyIfNecessary(typeKey, o) {
    var ret = false;
    for (var f in db.Metadata[typeKey].FieldDefinitions) {
        if (db.Metadata[typeKey].FieldDefinitions[f].primaryKey && !o[f]) {
            var id = uuid();
            log.debug({ newid: id, field: f, typeKey: typeKey }, 'Supplied key value "' + id + '" for field "' + f + '" for insert of type "' + typeKey + '"');
            o[f] = id;
            ret = true;
            break;
        }
    }
    return ret;
}
