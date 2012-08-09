/**
 * Apply a template to the input using the popular handlebars module (wycats/handlebars.js)
 *
 * https://github.com/wycats/handlebars.js
 *
 * Note: be very careful to use a valid template, and that the template variable matches the output of the task
 * eg. array output is treated as an array by the template. Otherwise it will throw a TypeError.
 *
 * @module tasks
 * @submodule handlebars
 */

var State = require('../state'),
    fs    = require('fs');

var Handlebars = require('handlebars');

function _handlebars(params, status, logger) {
    var self = this;
    var input_var = params.input_var || 'content'; // How to assign the state to the template
    var values = params.values || {}; // Other values assigned to the template
    var encoding = params.encoding || 'utf8'; // Source encoding TODO: should be determined by the state object.
    var template = params.template || undefined; // Handlebars template to use, as a string
    var template_file = params.template_file || undefined; // Handlebars template to use, as a filename

    if (template === undefined && template_file === undefined) {
        return status.emit('failure', 'handlebars', 'A template string or template file must be specified to use this task');
    }

    function readTemplate(cb) {
        if (template_file) {
            fs.readFile(template_file, function(err, buf) {
                cb(err, (buf ? buf.toString(encoding) : null));
            });
        } else {
            cb(null, template);
        }
    }

    readTemplate(function(err, template_string) {

        if (err) {
            return status.emit('failure', 'handlebars', 'The template could not be read: ' + err);
        }


        var compiled_template = Handlebars.compile(template_string);

        self.state.forEach(function(name, value) {

            self.state.readSync(value, function(err, data) {
                values[input_var] = data;
                var template_data = compiled_template(values);
                self.state.set(name, { string: template_data });
                delete values[input_var];
            });
        });

        return status.emit('complete', 'handlebars', 'Handlebars completed successfully');

    });

}

exports.tasks = {
    'handlebars' : _handlebars
};