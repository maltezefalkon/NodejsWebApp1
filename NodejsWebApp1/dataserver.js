"use strict"

// requires
var http = require('http');
var Sequelize = require('sequelize');
var fs = require('fs');
var url = require('url');
var queryString = require('querystring');
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

// db setup
log.info('setting up database');
var sequelize = new Sequelize('safedb', 'readwrite', 'readwrite', { define: { timestamps: false, underscored: true } });
var db =
 {
    Sequelize: sequelize,
    Metadata: {}
};
var metadataFiles = fs.readdirSync('metadata');
for (var i = 0; i < metadataFiles.length; i++) {
    log.debug('processing metadata file ' + metadataFiles[i]);
    DbDefine(db, fs, 'metadata/' + metadataFiles[i]);
}
log.debug('setting up relationsips');
SetupRelationships(db);

// update the database to match our metadata
sequelize.sync({ force: true });

// ----------------------------

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
            var o = db[typeName].build(raw);

            if (o instanceof Array) {
                log.debug('Saving an array of ' + o.length.toString() + ' ' + typeName);
                for (var i = 0; i < o.length; i++) {
                    SaveObject(o[i], res, body);
                }
            } else {
                log.debug('Saving a single ' + typeName);
                SaveObject(o, res, body);
            }
        });
    }
});
svr.listen(port);
// ------------------------------

function DbDefine(db, fs, filePath) {
    var content = fs.readFileSync(filePath, "utf8");
    var metadata = JSON.parse(content.trim());
    for (var f in metadata.FieldDefinitions) {
        metadata.FieldDefinitions[f].type = Sequelize[metadata.FieldDefinitions[f].type]();
    }
    db.Metadata[metadata.TypeKey] = metadata;
    db[metadata.TypeKey] = db.Sequelize.define(metadata.TypeKey, metadata.FieldDefinitions, { tableName: metadata.TableName });
}

function SetupRelationships(db) {
    for (var typeKey in db.Metadata) {
        var sequelizeModel = db[typeKey];
        for (var rel in db.Metadata[typeKey].Relationships) {
            var relationship = db.Metadata[typeKey].Relationships[rel];
            var opts = { as: rel };
            if (relationship.Through) {
                opts['through'] = relationship.Through;
            }
            if (relationship.ForeignKey) {
                opts['foreignKey'] = relationship.ForeignKey;
            }
            if (relationship.TargetKey) {
                opts['targetKey'] = relationship.TargetKey;
            }
            if (relationship.RelationshipType == 'hasMany') {
                log.debug(typeKey + ' hasMany ' + relationship.RelatedTypeKey);
                sequelizeModel.hasMany(db[relationship.RelatedTypeKey], opts);
            } else if (relationship.RelationshipType == 'belongsToMany') {
                log.debug(typeKey + ' belongsToMany ' + relationship.RelatedTypeKey);
                sequelizeModel.belongsToMany(db[relationship.RelatedTypeKey], opts);
            } else if (relationship.RelationshipType == 'hasOne') {
                log.debug(typeKey + ' hasOne ' + relationship.RelatedTypeKey);
                sequelizeModel.hasOne(db[relationship.RelatedTypeKey], opts);
            } else if (relationship.RelationshipType == 'belongsTo') {
                log.debug(typeKey + ' belongsTo ' + relationship.RelatedTypeKey);
                sequelizeModel.belongsTo(db[relationship.RelatedTypeKey], opts);
            } else {
                throw 'Unrecognized RelationshipType: "' + relationship.RelationshipType + '"';
            }
        }
    }
}

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
                    currentInclude.include = [];
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

function SaveObject(o, res, body) {
    log.debug('saving ' + body);
    o.save().then(function () {
        log.info('Saved', o);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(body);
    }).catch(function (err) {
        log.error('Error Saving', err);
        res.writeHead(409, { 'Content-Type': 'application/text' });
        res.end("" + err);
    });
}