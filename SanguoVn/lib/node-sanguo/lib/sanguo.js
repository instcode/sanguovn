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
        if (undefined === self.options.login) {
            self.send(self.create(Message.USER_LOGIN));
            self.send(self.create(Message.CHAT_GET_MESSAGE));
            self.options.login = true;
        }
        self.send(self.create(Message.SERVER_GET_PLAYER_INFO));
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
Sanguo.prototype.create = function(service, params, malform) {
    var uid = this.options.userID;
    var session = this.options.sessionKey;
    var md5hash = crypto.createHash('md5');
    var salt = '5dcd73d391c90e8769618d42a916ea1b';
    if (undefined === params) {
        params = [''];
    }
    if (undefined !== malform) {
        md5hash.update(service + uid + salt);
    }
    else {
        md5hash.update(service + uid + params.join('') + salt);
    }
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
    this.flood(command, 1, callback);
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
        var handler = function(json) {
            callback(json);
            count--;
            if (count == 0) {
                self.removeListener(command.svc, handler);
            }
        }
        self.on(command.svc, handler);
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

Sanguo.prototype.enumItemsInStore = function(callback) {
    var command = this.create(Message.STOREHOUSE, [0, 15])
    this.send(command, function(json) {
        var store = json.m.storehousedto;
        for (var item in store) {
            callback(store[item]);
        }
    });
}

Sanguo.prototype.enumEquipments = function(callback) {
    var command = this.create(Message.EQUIP_GET_UPGRADE_INFO, [0, 0, 100])
    this.send(command, function(json) {
        var equipments = json.m.equip;
        for (var item in equipments) {
            callback(equipments[item]);
        }
    });
}

Sanguo.prototype.recruit = function(generalId, callback) {
    var command = this.create(Message.GENERAL_RECRUIT, [generalId]);
    this.send(command, callback);
}

Sanguo.prototype.getUpgradeInfo = function(callback) {
    var command = this.create(Message.EQUIP_GET_UPGRADE_INFO, [0, 0, 100]);
    this.send(command, callback);
}

Sanguo.prototype.upgrade = function(itemId, useGold, magic, callback) {
    var command = this.create(Message.EQUIP_UPGRADE, [itemId, useGold, magic]);
    this.send(command, callback);
}

Sanguo.prototype.downgrade = function(itemId, magic, callback) {
    var command = this.create(Message.EQUIP_DEBS, [itemId, 0, magic]);
    this.send(command, callback);
}

Sanguo.prototype.equip = function(itemId, generalId, callback) {
    var command = this.create(Message.EQUIP_TAKE, [itemId, generalId]);
    this.send(command, callback);
}

Sanguo.prototype.unequip = function(itemId, generalId, callback) {
    var command = this.create(Message.EQUIP_TAKE_OFF, [itemId, generalId]);
    this.send(command, callback);
}

Sanguo.prototype.sell = function(itemId, callback) {
    var command = this.create(Message.SELL_GOODS, [itemId, '10']);
    this.send(command, callback);
}

Sanguo.prototype.buy = function(goods, callback) {
    var command = this.create(Message.BUY_GOODS, goods);
    this.send(command, callback);
}

Sanguo.prototype.trade = function(type, useGold, callback) {
    var command = this.create(Message.MARKET_TRADE, [type, useGold]);
    this.send(command, callback);
}

Sanguo.prototype.autoTrade = function(type, callback) {
    var command = this.create(Message.MARKET_TRADE, [type, 0]);
    this.send(command, callback);
}

Sanguo.prototype.weave = function(type) {
    var self = this;
    self.on(Message.PUSH_TEXTILE_TEAM, function(json) {
        console.log(JSON.stringify(json));
        var teamId = json.m.teamObject.teamid;
        if (undefined !== teamId) {
            var command = self.create(Message.TEXTILE_JOIN_TEAM, [teamId]);
            self.send(command);
            self.send(command);
            self.send(command, function(json) {
                console.log(JSON.stringify(json));
                var command = self.create(Message.TEXTILE_START, [teamId]);
                self.send(command, function(json) {
                    console.log(JSON.stringify(json));
                });
            });
        }
        else {
        }
    });
    var command = this.create(Message.CREATE_TEXTILE_TEAM, [1, 0, 0]);
    this.send(command, function(json) {
        console.log(JSON.stringify(json));
    });

}

Sanguo.prototype.market = function(type, amount, callback) {
    var command = this.create(Message.MAIN_CITY_FOOD_BAND_C, [type, amount]);
    this.send(command, callback);
}

Sanguo.prototype.enumGeneralEquipments = function(generalId, callback) {
    var command = this.create(Message.EQUIP_GET_GENERAL_EQUIP, [generalId]);
    var id = generalId;
    this.send(command, function(json) {
        var equipments = json.m.equip;
        for (var item in equipments) {
            callback(equipments[item]);
        }
    });
}

Sanguo.prototype.enumRecruitGenerals = function(callback) {
    var command = this.create(Message.GENERAL_GET_ONLINE)
    this.send(command, function(json) {
        var generals = json.m.general;
        for (var key in generals) {
            callback(generals[key]);
        }
    });
}

Sanguo.prototype.enumGenerals = function(callback) {
    var command = this.create(Message.GENERAL_GET_LIST2, [0]);
    this.send(command, function(json) {
        var generals = json.m.general;
        for (var key in generals) {
            callback(generals[key]);
        }
    });
}


