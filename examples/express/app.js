/**
 * buildy express middleware process demo
 *
 * This express application will demonstrate how you could use buildy to dynamically process items based on http requests.
 * My own test case is a YUI 3.x development environment for modules, but you could similarly use it to process code
 * or stylesheets for any platform.
 */

var express = require('express');
var app = express();

var buildy_middleware = function(req, res, next) {

    require('./queues.js').module(req.params[0], function(err, data) {
        res.send(data);
        next();
    });

};

// Mount the buildy middleware using a route
app.get('/build/*', [buildy_middleware], function(req, res) {
   res.send('got your request');
});

app.listen(3000);
console.log('Listening on port 3000');