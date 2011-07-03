var net = require('net');
var http = require('http');
var config = require('./config');
var server = require('./lib/node-message');
var handlers = require('./lib/node-fjchat');

var socket = new net.Socket(0, 'unix');

socket.on('fd', initialize).resume();

socket.on('data', function(msg) {
        console.log('Worker: Pong!');
    }).resume();

function initialize(fd) {
    var njms = server.createServer(handlers);
    if (fd) {
        // Reduce process privilege to normal user, such as 'nobody'
        if (config.runas !== '') {
            process.setuid(config.runas);
        }
        njms.server.listenFD(fd);
    }
    else {
        njms.listen(config.port, config.hostname);
    }
}

// Check if this module is running standalone
if (require.main === module) {
    initialize();
}

