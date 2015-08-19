/*
 * SNIPPETS
 */

// launch a web server as a child process
var exec = require('child_process').exec;
var cmd = 'node services/webserver.js';
exec(cmd, function (error, stdout, stderror) {
    log.error('Error spawning web server');
    log.error(error);
});
