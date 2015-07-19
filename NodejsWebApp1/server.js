"use strict"

// requires
var http = require('http');
var Sequelize = require('sequelize');
var fs = require('fs');
var url = require('url');
var queryString = require('querystring');
var Logger = require('bunyan');
var log = new Logger( {
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
var sequelize = new Sequelize('safedb', 'readwrite', 'readwrite', { define: { timestamps: false } });
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
// sequelize.sync();

// ----------------------------

// listen on port
var port = process.env.port || 1337;
http.createServer(function (req, res) {
    res.writeHead(200, { 'Content-Type' : 'application/json' });
    var thisUrl = url.parse(req.url, true);
    var condition = thisUrl.query;
    var pathArray = thisUrl.pathname.split('/').splice(1);
    var typeName = pathArray[0];
    var properties = [];
    if (pathArray.length > 1) {
        properties = pathArray[1].split(',');
    }
    var includes = [];
    for (var i = 0; i < properties.length; i++) {
        var inc = BuildInclude(db, typeName, properties[i]);
        includes.push(inc);
    }
    if (db[typeName]) {
        db[typeName].findAll({ where: condition, include: includes }).then(
            function (results) {
                res.write(JSON.stringify(results));
                res.end();
            });
    }
}).listen(port);

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

function BuildInclude(db, contextTypeKey, path) {
    var currentTypeKey = contextTypeKey;
    var parsed = path.split('.');
    var head = parsed.shift();
    var ret = { };
    var currentInclude = ret;
    while (head) {
        currentTypeKey = db.Metadata[currentTypeKey].Relationships[head].RelatedTypeKey;
        currentInclude['model'] = db.Metadata[currentTypeKey];
        head = parsed.shift();
        if (head) {
            currentInclude.include = [];
            var newInclude = { };
            currentInclude.include.push(newInclude);
            currentInclude = newInclude;
        }
    }
    return ret;
}