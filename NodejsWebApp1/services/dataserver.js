"use strict"

// requires
var http = require('http');
var url = require('url');
var queryString = require('querystring');
var db = require('../modules/metadata');
var Logger = require('bunyan');
var log = new Logger({
    name: 'main',
    streams: [
        {
            level: 'debug',
            path: './log/applogging.log'
        }
    ]
});

// listen on port
var port = process.env.port || 1337;

var svr = http.createServer(function (req, res) {
    
    var thisUrl = url.parse(req.url, true);
    var condition = thisUrl.query;
    var pathArray = thisUrl.pathname.split('/').splice(1);
    var typeName = pathArray[0];
    
    if (req.method == "GET") {
        res.writeHead(200, { 'Content-Type' : 'application/json' });
        res.writeHead(200, { 'Access-Control-Allow-Origin': '*' });
        var properties = [];
        if (pathArray.length > 1) {
            properties = pathArray[1].split(',');
        }
        var includes = BuildIncludes(db, typeName, properties);
        if (db[typeName]) {
            db[typeName].findAll({ where: condition, include: includes }).then(
                function (results) {
                    res.write(JSON.stringify(results));
                    res.end();
                });
        }
    } else if (req.method == "POST") {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            log.debug("Request Body: " + body);
            var raw = JSON.parse(body);
            if (raw instanceof Array) {
                log.debug('Saving an array of ' + raw.length.toString() + ' ' + typeName);
                for (var i = 0; i < raw.length; i++) {
                    SaveObject(typeName, raw[i], res, body);
                }
            } else {
                log.debug('Saving a single ' + typeName);
                SaveObject(typeName, raw, res, body);
            }
        });
    }
});
svr.listen(port);
// ------------------------------

function BuildIncludes(db, contextTypeKey, paths) {
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

function SaveObject(typeName, o, res, body) {
    log.debug('saving ' + typeName);
    db[typeName].upsert(o).then(function () {
        log.info('Saved', o);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);
    }).catch(function (err) {
        log.error('Error Saving', err);
        res.writeHead(409, { 'Content-Type': 'application/text' });
        res.end("" + err);
    });
}