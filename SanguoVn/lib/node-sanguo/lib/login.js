var http = require('http');
var url = require('url');
var querystring = require('querystring');

var Login = function() {
    // Should have a list of TQTK servers
}

module.exports = new Login();

Login.prototype.login = function(username, password, server, handler) {
    var post_data = querystring.stringify({
        'username': username,
        'password': password,
        '_submit': '',
        'service': 'http://tamquoctruyenky.com/home/login/' + server + '.html',
        'lt': '',
        '_eventId': 'submit'
    });
    
    var options = {
        host: 'tamquoctruyenky.com',
        port: 80,
        path: '/home/login/' + server + '.html',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': post_data.length
        }
    };

    /*
     * Redirect to the given location and handle the result
     */
    function redirect(redirectUrl, handler) {
        var parsedUrl = url.parse(redirectUrl);
        var options = {
            host: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + '?' + parsedUrl.query
        };
        http.get(options, handler);
    }
    
    var req = http.request(options, function(res) {
        res.setEncoding('utf8');
        var loginUrl = res.headers.location;
        redirect(loginUrl, function(res) {
            var redirectUrl = res.headers.location;
            redirect(redirectUrl, function(res) {
                res.setEncoding('utf8');
                var body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.on('end', function () {
                    var re = /var flashvars = ([^}]*});/;
                    /*
                    {
                        userID : ######,
                        ip : 's18.tamquoctruyenky.com',
                        ports : '6018',
                        sessionKey : "an-md5-hash-hex",
                        locale:"vi_VN",
                        version:"1.01",
                        reportURL:"http://s18.tamquoctruyenky.com/",
                        customerURL:"http://s18.tamquoctruyenky.com/sfadm/",
                        gameURL:"http://s18.tamquoctruyenky.com/",
                        loginURL:"http://tamquoctruyenky.com/",
                        rechargeURL:"http://pay.sgame.vn?paymentType=Sale|GameId=2|sid=S1",
                        fid:"null",
                        bfid:"null",
                        rootpath:"http://img.tamquoctruyenky.com/1106101/"
                    }
                    */
                    var match = re.exec(body);
                    eval('var userinfo = ' + match[1]);
                    handler(userinfo);
                });
            });
        });
    });

    req.on('error', function(e) {
        console.log('Problem: ' + e.message);
    });

    req.write(post_data);
    req.end();
}
