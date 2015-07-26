"use strict"

// bunyan logger
var Logger = require('bunyan');
var log = new Logger({
    name: 'metadata.js',
    streams: [
        {
            level: 'debug',
            path: './log/metadata.log'
        }
    ]
});

// sequelize ORM
var Sequelize = require('sequelize');
var sequelize = new Sequelize('safedb', 'readwrite', 'readwrite', { define: { timestamps: false, underscored: true  }, logging: function (msg) { log.info(msg); } });

// file system access
var fs = require('fs');

log.info('setting up database');

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
// sequelize.sync({ force: true });

// done!
module.exports = db;

// ====================================================================================================================================================

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

