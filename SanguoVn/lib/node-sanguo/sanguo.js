var sanguo = require('./lib/sanguo');
var Message = require('./lib/message');

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
    bot.flood(command, 500, function(json) {
        if (json.m.message[0] !== 'N') {
            success++;
        }
        else {
            failure++;
        }
        if (success + failure > 400) {
            console.log('Reward [' + success + '] ' + JSON.stringify(json.m));
        }
    });
}

var collectGift = function(bot, giftcode) {
    var command = bot.create(Message.RECEIVE_GIFT, [giftcode]);
    var success = 0;
    var failure = 0;
    bot.flood(command, 500, function(json) {
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

var attackNPC = function(bot, npc) {
    var command = bot.create(Message.BATTLE_ARMY, [npc, '0']);
    var success = 0;
    var failure = 0;
    bot.flood(command, 1000, function(json) {
        if (json.m.items !== undefined && json.m.items.length > 0) {
            console.log(json.m.items + ' ' + json.m.message);
        }
    });
}

var login = require('./lib/login');

var username = process.argv[2];
var password = process.argv[3];
var server = process.argv[4];

login.login(username, password, server, function(userinfo) {
    var bot = sanguo.create(userinfo);
    var now = new Date();

    bot.on('message', function(json) {
        if (json.h == Message.BATTLE) {
            console.log('Service [' + json.h + ']\t' + JSON.stringify(json.m));
        }
        if (json.h == Message.SERVER_GET_PLAYER_INFO) {
            console.log(now + ' - Connected successfully.');
            
            //var map = '5';
            //clearMap(bot, map);

            //var giftcode = '';
            //collectGift(bot, giftcode);

			//bot.send(bot.create(Message.OPEN_POWERMAP));
			//bot.send(bot.create(Message.BATTLE, ['7']));
			
            var npc = '1716';//'2113';1716, 1717;
            attackNPC(bot, npc);
        }
    });

    bot.connect();
});
