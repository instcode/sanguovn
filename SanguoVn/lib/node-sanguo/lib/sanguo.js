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

Sanguo.prototype.openChest = function(type, callback) {
    var command = this.create(Message.OPEN_BOX, [type])
    this.flood(command, 1000, function(json) {
        //var award = json.m.award;
        callback(json.m);
    });
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

Sanguo.prototype.attackNPC = function(npc, callback) {
    var command = this.create(Message.BATTLE_ARMY, [npc, '0']);
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

/**
 * Dong Trac: 900001
 * Truong Lo: 900004
 * 
 * #1:#2;#3
 *
 * #1: Unknown ('4' so far)
 * #2: Level ('0')
 * #3: Type (1: Free, 2: Ally, 3: Guid)
 */
Sanguo.prototype.createParty = function(map, options, callback) {
    var params = '5' + ':' + options.level + ';' + options.type;
    var command = this.create(Message.B_CREATE_TEAM, [map, params]);
    this.send(command, function(json) {
        callback(json);
    });
}

Sanguo.prototype.enumParties = function(map, callback) {
    var command = this.create(Message.B_GET_TEAM_INFO, [map]);
    this.send(command, function(json) {
        var teams = json.m.team;
        for (var key in teams) {
            callback(teams[key]);
        }
    });
    
}

Sanguo.prototype.joinParty = function(teamId, callback) {
    var command = this.create(Message.B_JOIN_TEAM, [teamId]);
    this.send(command, function(json) {
        callback(json);
    });
}

Sanguo.prototype.getRefreshInfo = function(generalid, callback) {
    var command = this.create(Message.GENERAL_GET_REFRESH_INFO, [generalid]);
    this.send(command, function(json) {
        console.log(JSON.stringify(json));
        callback(json.m.general.originalattr);
    });
}

Sanguo.prototype.improve = function(generalid, acceptance, callback) {
    var command = this.create(Message.GENERAL_REFRESH, [generalid, 0]);
    var self = this;
    this.send(command, function(json) {
        var confirm = '0';
        if (acceptance(json.m.general)) {
            confirm = '1';
        }
        var command = self.create(Message.GENERAL_REFRESH_CONFIRM, [generalid, confirm]);
        self.send(command, callback);
    });
}

Sanguo.prototype.conquer = function(playerid, callback) {
    var command = this.create(Message.AREA_CONQUER_PLAYER, [playerid]);
    this.send(command, callback);
}


Sanguo.prototype.sendCaravan = function(playerid, callback) {
    var command = this.create(Message.CARAVAN_SEND, [playerid]);
    this.send(command, callback);
}

Sanguo.prototype.invest = function(callback) {
    var command = this.create(Message.WORLD_INVEST_AREA, ['9', '1']);
    this.send(command, callback);
}


Sanguo.prototype.addConstructor = function(callback) {
    var command = this.create(Message.ADD_C);
    this.send(command, callback);
}

Sanguo.prototype.buyTrainPos = function(callback) {
    var command = this.create(Message.GENERAL_BUY_TRAIN_POSITION);
    this.send(command, callback);
}

/**
 *  1 - Khan Vang
 *  2 - Dong Trac
 *  3 - Cong Ton Toan
 *  4 - Tieu The Luc
 *  5 - Truong Lo
 *  6 - Vien Thuat
 *  7 - Nghiem Bach Ho
 *  8 - Luu Bieu
 *  9 - Luu Chuong
 * 10 - Ma Dang
 * 11 - Manh Hoach
 * 12 - Vien Thuat
 * 13 - Lu Bo
*/
Sanguo.prototype.getMapReward = function(index, callback) {
    //this.send(Message.OPEN_POWERMAP);
    //this.send(Message.BATTLE, [index]);
    var command = this.create(Message.BATTLE_GET_REWARDS, [index]);
    this.send(command, callback);
}

Sanguo.prototype.collectGift = function(giftcode, callback) {
    var command = this.create(Message.RECEIVE_GIFT, [giftcode]);
    this.send(command, callback);
}

