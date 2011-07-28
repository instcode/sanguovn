var sanguo = require('./lib/sanguo');
var Message = require('./lib/message');

var collectGift = function(bot, giftcode) {
    var command = bot.create(Message.RECEIVE_GIFT, [giftcode]);
    var success = 0;
    var failure = 0;
    bot.flood(command, 20, function(json) {
        console.log(JSON.stringify(json.m));
        if (json.m.message[0] !== 'T') {
            success++;
        }
        else {
            failure++;
        }
        if (success + failure > 400) {
            console.log('Gift [' + success + '] ' + JSON.stringify(json.m));
        }
    });
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
var clearMap = function(bot, index) {
    //bot.send(Message.OPEN_POWERMAP);
    //bot.send(Message.BATTLE, [index]);
    var command = bot.create(Message.BATTLE_GET_REWARDS, [index]);
    var success = 0;
    var failure = 0;
    bot.flood(command, 2, function(json) {
        console.log('Reward [' + success + '] ' + JSON.stringify(json.m));
        if (json.m.message[0] !== 'N') {
            success++;
        }
        else {
            failure++;
        }
        if (success + failure > 10) {
            console.log('Reward [' + success + '] ' + JSON.stringify(json.m));
        }
    });
}

var attackNPC = function(bot, npc) {
    var command = bot.create(Message.BATTLE_ARMY, [npc, '0']);
    var success = 0;
    var failure = 0;
    bot.flood(command, 1, function(json) {
        console.log(JSON.stringify(json.m));
        if (json.m.items !== undefined && json.m.items.length > 0) {
            console.log(json.m.items + ' ' + json.m.message);
        }
    });
}

//bot.send(bot.create(Message.EQUIP_GET_UPGRADE_INFO, ['0', '0', '10']));
//bot.send(bot.create(Message.STOREHOUSE, ['0', '15']));
var sellEquipment = function(bot, id) {
    var command = bot.create(Message.SELL_GOODS, [id, '-1']);
    bot.flood(command, 2, function(json) {
        console.log('Update: ' + JSON.stringify(json.m));
    });
}

var buyEquipment = function(bot, id) {
    var command = bot.create(Message.BUY_GOODS, ['3', '13', '1']);
    bot.flood(command, 1, function(json) {
        console.log('Update: ' + JSON.stringify(json.m));
    });
}

var up = function(bot, id) {
    var command = bot.create(Message.MARKET_TRADE, [id, '0']);
    bot.flood(command, 2, function(json) {
        console.log('Update: ' + JSON.stringify(json.m));
    });
}

var addC = function(bot) {
    var command = bot.create(Message.ADD_C);
    bot.flood(command, 1, function(json) {
        console.log('Update: ' + JSON.stringify(json.m));
    });
}

var buyP = function(bot) {
    var command = bot.create(Message.GENERAL_BUY_TRAIN_POSITION);
    bot.flood(command, 1, function(json) {
        console.log('Update: ' + JSON.stringify(json.m));
    });
}

var sendCaravan = function(bot, id) {
    var command = bot.create(Message.CARAVAN_SEND, [id]);
    bot.flood(command, 2, function(json) {
        console.log('Update: ' + JSON.stringify(json.m));
    });
}

//311121444442	31b0e29018f052ad3fb6b4ab0062e7cb14362646a424406025b00bd322cb06b14a2a1ad
var conquer = function(bot, id) {
    var command = bot.create(Message.AREA_CONQUER_PLAYER, [id]);
    bot.flood(command, 1, function(json) {
        console.log('Update: ' + JSON.stringify(json.m));
    });
}

//413011356782	80b8ac84545f99c3a11bafbefe9de8a913376	0bb8ca18dfde2c8952da389b6cb2fb5a7
//{"u":1244552,"r":0,"m":{"playerupdateinfo":{"jyungong":20630},"general":{"plusleader":6,"plusforces":4,"plusintelligence":23}},"h":41301}
//413031255542	80b8ac84545f99c3a11bafbefe9de8a913376	189fd53b58058f7f5cb01346c0a22c1ed
//{"u":12444442,"r":0,"m":{"":""},"h":41303}
var improveGeneral = function(bot, id) {
}

var invest = function(bot) {
    var command = bot.create(Message.WORLD_INVEST_AREA, ['9', '1']);
    bot.flood(command, 1, function(json) {
        console.log('Update: ' + JSON.stringify(json.m));
    });
}

var now = new Date();
var debug = function(message) {
    console.log(now + ' - ' + message);
}

var login = require('./lib/login');

var username = process.argv[2];
var password = process.argv[3];
var server = process.argv[4];
var userinfos = [];
var bots = [];
var max = 1;

var logEverything = function(json) {
    debug(JSON.stringify(json));
}

var startBot = function(bot) {
    bot.market(0, -1000, logEverything);

    bot.enumItemsInStore(function(item) {
        console.log('\t' + item.id + ' - ' + item.name);
    });

    bot.enumRecruitGenerals(function(general) {
        console.log('\t' + general.generalid + ' - ' + general.generalname);
    });

    bot.enumGenerals(function(general) {
        console.log('\t' + general.generalid + ' - ' + general.generalname);
        var id = general.generalid;
        bot.enumGeneralEquipments(id, function(equipment) {
            console.log('\t\t' + equipment.storeid + '/' + equipment.equipname);
        });
    });

/*
    var itemId = '1171831';
    //var generalId = 6454;// Linh Nguyet
    //var generalId = 6070;// Nam Cung Ninh
    var generalId = 42355;// Tu Vinh
    bot.equip(itemId, generalId, function(json) {
        logEverything(json);
        bot.sell(itemId, function() {
            debug('Sold????????????????????');
            logEverything(json);
            bot.unequip(itemId, generalId, logEverything);
        });
    });
    */
}

var createSession = function(username, password, server) {
    debug('Creating a new session...');
    login.login(username, password, server, function(userinfo) {
        var master = sanguo.create(userinfo);
        master.on('message', function(json) {
            if (json.h == Message.SERVER_GET_PLAYER_INFO) {
                debug('[' + userinfo.sessionKey + ']: Authenticated.');
                //createClone(userinfo);
                startBot(master);
            }
        });
        master.connect();
    });
}

var createClone = function(userinfo) {
    userinfo.login = true;
    var bot = sanguo.create(userinfo);
    bots.push(bot);
    bot.connect();
    bot.on('message', function(json) {
        debug('[' + userinfo.sessionKey + ']: ' + json.h);
    });
    if (bots.length >= 8) {
        for (var i = 0; i < bots.length; i++) {
            try {
                //attackNPC(bots[i], '1224');
                clearMap(bots[i], '9');
            }
            catch (e) {
            }
        }
    }
}

for (var i = 0; i < max; i++) {
    createSession(username, password, server);
}

