/**
 * Created by JetBrains PhpStorm.
 * User: none
 * Date: 5/20/11
 * Time: 8:33 AM
 * To change this template use File | Settings | File Templates.
 */
$(document).ready(function() {
    $("#btnConnect").click(function() {
        if ('' != $.trim($("#txtNickName").val())) {
            username = $.trim($("#txtNickName").val());
            port = $.trim($("#txtPort").val());
            if ("" == port) {
                port = 80;
            }
            $.ajax({
                url: 'chatroom.html',
                type: 'GET',
                success: function(response) {
                    $("#roomchat").html(response);
                    user = {username: username, authToken: "ugly"};
                    njmc = new NJMC(document.domain + ":" + port, user);

                    njmc.onconnect = function(event) {
                        document.getElementById('form').style.display='block';
                        document.getElementById('chat').innerHTML = '';
                        message({announcement: user.username + ' is connected.'} );
                    };

                    njmc.onmessage = function(event) {
                        message({from: event.data.from, message: event.data.msg});
                    };

                    njmc.onclose = function(event) {
                        message({announcement: 'Socket closed.'} );
                    };

                    njmc.onerror = function(event) {
                           message({announcement: 'Error occured.'} );
                    };

                    NJMC.initialize();
                }
            });
        }
    });
});

function initialize() {
}

function message(obj) {
    var el = document.createElement('p');
    if ('announcement' in obj)
        el.innerHTML = '<em>' + esc(obj.announcement) + '<\/em>';
    else if ('message' in obj)
        el.innerHTML = '<b>' + esc(obj.from) + ':<\/b> ' + esc(obj.message);

    document.getElementById('chat').appendChild(el);
    document.getElementById('chat').scrollTop = 1000000;
}

function esc(msg){
    return msg.replace(/</g,'&lt;').replace(/>/g, '&gt;');
};

function send() {
    msg = $.trim($("#txtMessage").val());
    if ('' == msg) {
        return;
    }
    njmc.send(NJMC.createCommand('message', {to: "room", msg: msg}));
    message({from: user.username, message: msg});
    $("#txtMessage").val("");
    $("#txtMessage").focus();
}


