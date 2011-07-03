var crypto = require('crypto');
var events = require('events');
var net = require('net');
var util = require("util");
var Message = require('./message');

/**
 * This creates a sanguo android instance.
 *
 * @options A dictionary that should contain at least the
 *      following information:
 *          ip: address of the server.
 *          ports: port to connect to.
 */
exports.create = function(options) {
    return new Sanguo(options);
}

var Sanguo = function(options) {
    events.EventEmitter.call(this);
    this.options = options;
    this.socket = new net.Socket();
    this.buffer = '';
}

util.inherits(Sanguo, events.EventEmitter);

/**
 * Connect to the server using available information.
 */
Sanguo.prototype.connect = function() {
    var self = this;
    this.socket.on('connect', function() {
        self.send(self.create(Message.USER_LOGIN));
        self.send(self.create(Message.SERVER_GET_PLAYER_INFO));
        self.send(self.create(Message.CHAT_GET_MESSAGE));
        //self.send(self.create(Message.MAIN_CITY, ['1']));
    });

    this.socket.on('data', function(chunk) {
        self._parseChunk(chunk, function(message) {
            try {
                var json = JSON.parse(message);
                self.emit('message', json);
                self.emit(json.h, json);
            }
            catch (error) {
                console.log(error.stack);
            }
        });
    });

    this.socket.setNoDelay();
    this.socket.connect(this.options.ports, this.options.ip);
    this.socket.setEncoding('utf8');
}

/**
 * Create a service command
 *
 * @service Service number which is specified in Message#<service>
 * @params An array of parameters. Can be empty/omitted.
 */
Sanguo.prototype.create = function(service, params) {
    var uid = this.options.userID;
    var session = this.options.sessionKey;
    var md5hash = crypto.createHash('md5');
    var salt = '5dcd73d391c90e8769618d42a916ea1b';
    if (undefined === params) {
        params = [''];
    }
    md5hash.update(service + uid + params.join() + salt);
    var checksum = md5hash.digest('hex');
    var msg = service + '\1' + uid + '\t' + session +
        '\2' + params.join('\t') + '\3' +
        checksum + '\4' + '\0';
    var command = {
        svc: service,
        msg: msg
    }
    return command;
}

/**
 * Send a service command and receive the response from server
 *
 * @command A command obj created by Sanguo#create
 * @callback Callback function. Can be omitted.
 */
Sanguo.prototype.send = function(command, callback) {
    if (undefined !== callback) {
        this.once(command.svc, callback);
    }
    this.socket.write(command.msg);
}

/**
 * Replicate a command multiple times and flood the server. Basing
 * on real experiments, the number of replicated commands doesn't
 * need to be large to be *huge success*. It all depends on the busy
 * status of the server. It is recommended in practice that you use
 * 500 at the maximum.
 *
 * @command A command obj created by Sanguo#create
 * @number Number of replicates of this command
 * @callback Callback function. Can be omitted.
 */
Sanguo.prototype.flood = function(command, number, callback) {
    var buffer = '';
    for (var i = 0; i < number; i++) {
        buffer += command.msg;
    }
    if (undefined !== callback && number > 0) {
        var count = number;
        var self = this;
        self.on(command.svc, function(json) {
            callback(json);
            count--;
            if (count == 0) {
                self.removeListener(command.svc, callback);
            }
        });
    }
    this.socket.write(buffer);
}

Sanguo.prototype._parseChunk = function(chunk, callback) {
    this.buffer += chunk;
    var messages = this.buffer.split('\5');
    for (var i = 0; i < messages.length - 1; i++) {
        callback(messages[i]);
    }
    this.buffer = messages[messages.length - 1];
}

