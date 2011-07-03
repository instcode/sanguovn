var spawn = require('child_process').spawn;
var net = require('net');
var netBinding = process.binding('net');
var serverSocket = netBinding.socket('tcp4');
var config = require('./config');

console.log('Master process is starting...');

netBinding.bind(serverSocket, config.port, config.address);
netBinding.listen(serverSocket, 128);

for (var i = 0; i < config.workers; i++) {
    var fds = netBinding.socketpair();
    console.log(process.argv[0] + ' ' + __dirname + '/worker.js');
    // FIXME Should find a better way to locate the node program
    var path = '/usr/local/bin/';
    var child = spawn(path +  process.argv[0], [__dirname + '/worker.js', process.pid], {
        customFds: [fds[0], 1, 2]
    });
    var socket = new net.Stream(fds[1], 'unix');
    socket.write('Server: Ping!', 'utf8', serverSocket);
}

