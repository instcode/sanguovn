var net = require('net');
var crypto = require('crypto')

var Message = function(service, uid, session) {
    this.size = 0;
    this.buffer = Buffer(1024);
    this.write(service + '', 1);
    this.write(uid + '', 9);
    this.write(session + '', 2);
    this.write('', 3);
    var md5hash = crypto.createHash('md5');
    md5hash.update(service + uid + '5dcd73d391c90e8769618d42a916ea1b');
    var checksum = md5hash.digest('hex');
    this.write(checksum, 4);
}

Message.prototype.write = function(data, seperator) {
    for (var i = 0; i < data.length; i++) {
        this.buffer[this.size] = data.charCodeAt(i);
        this.size++;
    }
    this.buffer[this.size++] = seperator;
}

Message.prototype.end = function() {
    this.buffer[this.size++] = 0;
    return this.buffer.toString('ascii', 0, this.size);
}

var TQTKBot = function(userinfo) {
    this.userinfo = userinfo;
}

TQTKBot.prototype.train = function() {
    this.socket = new net.Socket();
    var self = this;
    this.socket.on('connect', function() {
        var message = new Message('10100', self.userinfo.userID, self.userinfo.sessionKey);
        console.log(message.end());
        self.socket.write(message.end());

        message = new Message('11102', self.userinfo.userID, self.userinfo.sessionKey);
        console.log(message.end());
        self.socket.write(message.end());
        
        message = new Message('10108', self.userinfo.userID, self.userinfo.sessionKey);
        console.log(message.end());
        self.socket.write(message.end());
        
        message = new Message('30100', self.userinfo.userID, self.userinfo.sessionKey);
        console.log(message.end());
        self.socket.write(message.end());
    });

    this.socket.setNoDelay();
    this.socket.connect(this.userinfo.ports, this.userinfo.ip);
    this.socket.setEncoding('utf8');
    this.socket.on('data', function(data) {
        console.log(data);
    });    
}

var login = require('./lib/login');

var username = process.argv[2];
var password = process.argv[3];
var server = process.argv[4];
login.login(username, password, server, function(userinfo) {
    new TQTKBot(userinfo).train();
});
