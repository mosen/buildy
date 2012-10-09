/**
 * buildy express middleware process demo
 *
 * This express application will demonstrate how you could use buildy to dynamically process items based on http requests.
 * My own test case is a YUI 3.x development environment for modules, but you could similarly use it to process code
 * or stylesheets for any platform.
 */

var express = require('express');
var app = express();
var path = require('path');
var util = require('util');

// Mount buildy middleware at /build
// Module request uri's are expected to follow this pattern:
// /build/modulename/module[-ext].js Where ext is "", "min" or "debug"
app.use('/build', function(req, res, next) {

    var uri_parts = req.path.split('/');

    var module_name = uri_parts[1];
    var module_release = uri_parts[2].split('-')[1];
    var source_directory = path.join(__dirname, 'src');
    var module_sources = path.join(source_directory, module_name, 'js', '*');

    var buildy = require(path.join(__dirname, '..', '..', 'lib', 'buildy.js'));
    var Queue = buildy.Queue;

    var q = new Queue('building ' + module_name, { logger: console })
        .task('files', [module_sources]) // all of these synchronous
        .task('jslint')
        .task('concat')

    q.run(function(err, state) {
        util.log('Finished running build queue');
        var output = "";
        state.forEach(function(key, value) {
            output += value.string;
        }, this);

        res.send(output);
    });

});

app.listen(3000);
console.log('Buildy on demand listening on port 3000');