/**
 * Apply a template to the input using the popular handlebars module (wycats/handlebars.js)
 *
 * https://github.com/wycats/handlebars.js
 */

var State = require('buildy/lib/state'),
    fs = require('fs');

/**
 * Apply a string or file template using a model object to substitute variables.
 *
 * @todo change callback method signature to err,data
 * @method applyTemplate
 * @param o {Object} configuration containing .template (String template) or .templateFile (File template),
 * .model (Object), .encoding (Template file Encoding) [Default 'utf8']
 * @param callback {Function}
 */
function applyTemplate(o, callback) {

    var Handlebars = require('handlebars'),
        encoding = o.encoding || 'utf8',
        fnTemplateResult = function fnLoadedTemplate(err, templateString) {
            var hTemplate;

            if (err) {
                callback(err);
            } else {
                hTemplate = Handlebars.compile(templateString);
                // TODO: file output, as specified by o.outputFile
                callback(null, hTemplate(o.model));
            }
        };

    // Deal with template file, get a string either way and pass it to fnTemplateResult()
    if (o === undefined || ( o.templateFile === undefined && o.template === undefined ) ) {
        callback('didnt supply a valid template or template file.');

    } else {
        if (o.hasOwnProperty('templateFile')) {
            fs.readFile(o.templateFile, encoding, function(err, data) {
                if (err) {
                    fnTemplateResult('Could not read specified template file: ' + o.templateFile);
                } else {
                    fnTemplateResult(null, data);
                }
            });
        } else if (o.hasOwnProperty('template')) {
            fnTemplateResult(null, o.template);
        }
    }
};

/**
 * Apply a template using Handlebars
 *
 * At the moment the input automatically becomes a template variable called 'code'.
 * @todo This should be configurable to avoid a name clash
 * @todo support more than utilsst string inputs
 * @method template
 * @param spec {Object} Template task configuration { template: 'stringtemplate', templateFile: 'template.handlebars', model: modelObj }
 * @param promise {EventEmitter}
 * @protected
 */
function templateTask(spec, promise) {
    var self = this,
        fnTemplateCallback = function(err, data) {
            if (err) {
                promise.emit('failed', 'template', err);
            } else {
                self._state.set(State.TYPES.STRING, data);
                promise.emit('complete', 'template', '');
            }
        };

    switch (this._state.get().type) {
        case State.TYPES.STRING:
            spec.model.code = this._state;
            applyTemplate(spec, fnTemplateCallback);
            break;

        //case State.TYPES.FILES:

        default:
            promise.emit('failed', 'template', 'unrecognised input type: ' + this._state.get().type);
            // todo: eliminate repetition of this pattern of default cases
            break;
    }
}

exports.tasks = {
    'template' : {
        callback: templateTask
    }
};