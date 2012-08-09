/**
 * files
 *
 * Generate a list of files to be modified.
 *
 * @module tasks
 * @submodule files
 */

var filelist = require('../filelist');
var State    = require('../state');


function _files(params, status, logger) {
    var self = this;
    var filenames = params;
    console.log('generating files for ' + filenames.join(','));

    filelist(filenames, function(err, data) {

        if (err) {
            status.emit('failed', 'files', err);
        } else {
            var file_state = data.map(function(file) {
                return { name: file, file: file };
            });

            self.state.reset(file_state);

            status.emit('complete', 'files');
        }
    });
}

exports.tasks = {
    "files" : _files
};