/**
 * Apply a template to the input using the popular handlebars module (wycats/handlebars.js)
 *
 * https://github.com/wycats/handlebars.js
 *
 * Note: be very careful to use a valid template, and that the template variable matches the output of the task
 * eg. array output is treated as an array by the template. Otherwise it will throw a TypeError.
 *
 * ---
 * INPUTS:
 *
 *  - FILES
 *  Read the contents of all the files in the input and assign them as an array to the template.
 *
 *  - STRINGS
 *  Assign strings as an array to the template.
 *
 *  - STRING
 *  Assign string to the template.
 *
 *  - UNDEFINED
 *  Generate output based on template and vars supplied in the options.template_vars
 *
 * OUTPUT:
 *
 *  - STRING
 *  Template string output, with variables substituted.
 * ---
 */

var State = require('buildy/lib/state'),
    fs    = require('fs');

/**
 * Apply a string or file based template using Handlebars.
 *
 * @method applyHandlebarsTemplate
 * @param options {Object} Templating options
 * @param options.template {String} Handlebars template as a string variable.
 * @param options.template_file {String} Handlebars template as a filename.
 * @param options.encoding {String} File and string encoding to use
 * @param options.template_vars {Object} Variables that will be applied to the template.
 * @param callback {Function} Taking err, output parameters.
 * @throws {Error} if handlebars template could not be read.
 * @return {undefined}
 * @private
 */
function applyHandlebarsTemplate(options, callback) {

    var Handlebars = require('handlebars');

        function templateDoneReading(err, template) {
            if (!err) {
                try {
                    var compiled_template = Handlebars.compile(template),
//                        output = compiled_template({ content: 'foo' });
                        output = compiled_template(options.template_vars);

                    callback(null, output);
                } catch (e) {
                    callback('error compiling handlebars template: ' + e);
                }
            } else {
                callback(err);
            }
        }

    if (!options || (options.template == null && options.template_file == null)) {
        callback('didnt supply a template for the handlebars template task');
    } else {
        if (options.template && options.template !== null) {
            templateDoneReading(null, options.template);
        }

        if (options.template_file && options.template_file !== null) {
            fs.readFile(options.template_file, options.encoding, templateDoneReading);
        }
    }
}

/**
 * Apply a template using Handlebars
 *
 * @method template
 * @param spec {Object} Template task configuration
 * @param spec.template {String} Handlebars template to apply as a string.
 * @param spec.template_file {String} Handlebars template filename.
 * @param spec.input_var {String} [input_var='content'] Which template variable will be replaced with the task input.
 * @param spec.template_vars {Object} Additional variables to be used with the template.
 * @param spec.encoding {String} [encoding='utf8'] Encoding to use for all files and strings.
 * @param promise {EventEmitter}
 * @protected
 */
function templateTask(spec, promise) {
    var self = this,
        input_var     = spec && spec.input_var || 'content',
        template_vars = spec && spec.template_vars || {},
        encoding      = spec && spec.encoding || 'utf8',
        template      = spec && spec.template || null,
        template_file = spec && spec.template_file || null,
        options       = {
            template: template,
            template_file: template_file,
            encoding: encoding,
            template_vars: template_vars
        },
        doneTemplating = function doneTemplating(err, data) {

            if (err) {
                promise.emit('failed', 'template', err);
            } else {
                self._state.set(State.TYPES.STRING, data);
                promise.emit('complete', 'template', '');
            }
        };

    switch (this._state.get().type) {

        // Implicitly read content of files and assign as array to input_var
        case State.TYPES.FILES:
            var files = this._state.get().value,
                filedata = [],
                fileCount = files.length,
                fileCountTotal = files.length;

            function fileDoneReading(err, data) {

                if (!err) {
                    filedata.push(data);

                    if (!--fileCount) {
                        options.template_vars[input_var] = filedata;
                        applyHandlebarsTemplate(options, doneTemplating);
                    }
                } else {
                    promise.emit('failed', 'template', 'could not read one of the files in the task input: ' + err);
                    // TODO: uniform way to recover from tasks with multiple callbacks.
                    throw new Error('Failed to read one of the files in the task input: ' + err);
                }
            }

            files.forEach(function(filename) {
                fs.readFile(filename, encoding, fileDoneReading);
            });

            break;

        // Assign string or array of strings to template input_var
        case State.TYPES.STRINGS:
        case State.TYPES.STRING:
            options.template_vars[input_var] = this._state.get().value;
            applyHandlebarsTemplate(options, doneTemplating);
            break;

        // Replace entire content with templating system output.
        case State.TYPES.UNDEFINED:
            applyHandlebarsTemplate(options, doneTemplating);
            break;

        default:
            promise.emit('failed', 'template', 'unrecognised input type: ' + this._state.get().type);
            break;
    }
}

exports.tasks = {
    'template' : {
        callback: templateTask
    }
};

// Export private methods for testing.
exports.testing = {}
exports.testing.applyHandlebarsTemplate = applyHandlebarsTemplate;