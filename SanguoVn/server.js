/*
This will start an http server for serving static contents.
*/
var url = require('url');
var http = require('http');
var fs = require('fs');
var sys = require('sys');
var config = require('./config');

// Handle static contents. This is temporary and will be migrated to
// the main server later.
var httpServer = http.createServer(function(req, res) {
    var path = url.parse(req.url).pathname;
    console.log('Request for ' + path);
    webPath = './web';
    switch (path) {
    case '/':
        path = '/index.html';
        // fall-through
    default:
        serveStaticContent(res, webPath + path);
    }
});

serveStaticContent = function(res, path) {
    fs.readFile(__dirname + '/' + path, function(err, data) {
        if (err) {
            return send404(res);
        }
        var mimes = {
            css: 'text/css',
            js: 'application/javascript',
            html: 'text/html',
        };

        var ext = path.replace(/.*[\.\/]/, '').toLowerCase();
        var contentType = mimes[ext] || mimes.html;

        res.writeHead(200, {'Content-Type': contentType});
        res.write(data);
        res.end();
    });
};

send404 = function(res){
    res.writeHead(404);
    res.write('404!');
    res.end();
};

httpServer.listen(8080, config.hostname);

// Reduce process privilege to normal user, such as 'nobody'
if (config.runas !== '') {
    process.setuid(config.runas);
}

