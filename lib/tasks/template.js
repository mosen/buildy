var Buildy = require('buildy/lib/buildy').Buildy,
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
                self._state = data;
                promise.emit('complete', 'template', '');
            }
        };

    switch (this._type) {
        case Buildy.TYPES.STRING:
            spec.model.code = this._state;
            applyTemplate(spec, fnTemplateCallback);
            break;

        //case Buildy.TYPES.FILES:

        default:
            promise.emit('failed', 'template', 'unrecognised input type: ' + this._type);
            // todo: eliminate repetition of this pattern of default cases
            break;
    }
}

exports.tasks = {
    'template' : {
        callback: templateTask
    }
};