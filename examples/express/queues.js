var path = require('path');
var buildy = require(path.join(__dirname, '..', '..', 'lib', 'buildy.js'));
var Queue = buildy.Queue;

/**
 * Create a YUI module based upon the given uri
 * @param {String} uri
 * @param {Function} cb Callback taking err, data
 * @return {String} module content
 */
exports.module = function(uri, cb) {
    var uri_parts = uri.split('/');
    var module_name = uri_parts[0];
    var module_file = uri_parts[1];
    var source_directory = path.join(__dirname, 'src');

    console.log('constructing build queue');
//    cb(null, "this would be the js output");

    var module_sources = path.join(source_directory, module_name, 'js', '*');
    console.log(module_sources);

    new Queue('build yui module')
        .task('files', ['./src/test/js/test.js']) // all of these synchronous
        .task('jslint')
        .task('concat')
        .task('uglify')
        .task('write', { dest: './build/test.js' })
        .run(function() {
            console.log('output');
            cb(null, "this would be the js output");
        });
};