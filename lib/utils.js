/**
 * A range of utility functions called by the Buildy object.
 *
 * Synchronous methods throw exceptions on error, async provides the error as a part of the callback.
 *
 * TODO: normalise destFile/outputFile attributes in tasks.
 * TODO: normalise validation of o.source or sourceFile attributes.
 */
var sys    = require('sys'),
    util   = require('util'),
    fs     = require('fs'),
    path   = require('path'),
    events = require('events'),
    cprf   = require('buildy/lib/cprf'),
    mkdirp = require('mkdirp').mkdirp;

/**
 * Concatenate one or more files to a destination file or string.
 *
 * @method concatSync
 * @param dest null|String String will be returned if null, or written to the specified filename.
 * @param sourcefiles Array of files to read and concatenate.
 * @param encoding source file encoding (default utf8)
 */
exports.concatSync = function(dest, sourcefiles, encoding) {
    var content  = '',
        encoding = encoding || 'utf8';
    
    try { 
        sourcefiles.forEach(function(f) {
            content += fs.readFileSync(f, encoding) || '';
        });
    } catch(e) {
        throw new Error('Could not read the files to be concatenated : ' + sourcefiles.toString() + ' ' + e);
    }

    try {
        if (dest === null) {
            return content;
        } else {
            fs.writeFileSync(dest, content, encoding);
        }
    } catch(e) {
        throw new Error('Could not write the file to be concatenated :' + dest.toString());
    }
};

/**
 * Apply a template to an object, and write the output to a file, or return the string.
 *
 * @method applyTemplateSync
 * @param dest null|String String will be returned if null, or written to the specified filename.
 * @param template String filename of the template file to use.
 * @param o Object object for which its properties will be used to generate the output.
 * @param format String file encoding (default 'utf8')
 */
exports.applyTemplateSync = function(dest, template, o, format) {
    var format          = format || 'utf8',
        templateContent = fs.readFileSync(template, format),
        Handlebars      = require('Handlebars'),
        hTemplate       = Handlebars.compile(templateContent);

    if (dest === null) {
        return hTemplate(o);
    } else {
        fs.writeFileSync(dest, hTemplate(o));
    }
};

/**
 * Apply a string or file template using a model object to substitute variables.
 *
 * @todo change callback method signature to err,data
 * @method applyTemplate
 * @param o {Object} configuration containing .template (String template) or .templateFile (File template),
 * .model (Object), .encoding (Template file Encoding) [Default 'utf8']
 * @param callback {Function}
 */
exports.applyTemplate = function applyTemplate(o, callback) {

    var Handlebars = require('Handlebars'),
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
 * Run JSLint|JSHint on a string or file.
 *
 * @method lint
 * @param o {Object} Object containing properties .source | .sourceFile, string or file to lint respectively,
 * .options {Object} JSLint options, .encoding {String} Encoding for files [default 'utf8']
 * @param callback {Function} Callback function when lint has finished.
 */
exports.lint = function(o, callback) {
    
    var linter = require('jslint/lib/linter.js'),
        reporter = require('jslint/lib/reporter.js'),
        result;
        
    options = o.options || {};
    encoding = o.encoding || 'utf8';

    if (o.source && o.source.length > 0) {
        result = linter.lint(o.source, options);
        callback(false, result);
    } else if (o.sourceFile && o.sourceFile.length > 0) {
        fs.readFile(o.sourceFile, encoding, function(err, data) {   
           if (err) {
               callback(err);
           } else {
               result = linter.lint(data.toString(encoding), options);
               // TODO: report results in builder output, not here in utils
               //reporter.report(o.sourceFile, result);
               callback(false, result);
           }
        });
    } else {
        callback(true);
    }
};

/**
 * Minify the input using uglify
 *
 * @method minify
 * @param o {Object} Minify parameters:
 *  o.source - source code as string
 *  o.sourceFile - source filename
 *  o.destFile - destination file to be written, otherwise the first argument to the complete
 *  o.encoding - file encoding [default 'utf8']
 *  event will be the output string.
 * @param callback {Function} Callback when done
 */
exports.minify = function(o, callback) {
    
    var min = function(o, callback) {

        var jsp = require("uglify-js").parser,
            pro = require("uglify-js").uglify,
            encoding = o.encoding || 'utf8',
            ast;

        try {
            ast = jsp.parse(o.source); // parse into syntax tree
            ast = pro.ast_mangle(ast);
            ast = pro.ast_squeeze(ast);
        } catch (e) {
            callback('The minify task failed, most likely the source file was unparseable. Please check your syntax. Error: ' + e.message);
            return;
        }

        if (!o.destFile) {
            callback(false, pro.gen_code(ast));
        } else {
            fs.writeFile(o.destFile, pro.gen_code(ast), encoding, function(err) {
                if (err) {
                    callback(err);
                } else {
                    callback(false, o.destFile);
                }
            });
        }
    };
    
    if (o.sourceFile) {
        fs.readFile(o.sourceFile, encoding, function(err, data) {
            if (err) {
                callback(err);
            } else {
                delete o.sourceFile;
                o.source = data;
                min(o, callback);
            }
        });
    } else if (o.source) {
        min(o, callback);
    } else {
        callback('No source or sourcefile was specified to be minified.');
    }
};

/**
 * CSSLint source file using csslint
 *
 * @todo change callback signature to standard err,data
 * @method cssLint
 * @param o {Object} Object containing at least one source property:
 * { source: 'String' || sourceFile: 'Filename.js', options : { [CSSLint Options] }, encoding: 'utf8' }
 * @param callback {Function} Callback function which receives one value, the result of csslint.
 */
exports.cssLint = function(o, callback) {
    var csslint = require('csslint').CSSLint,
        opts = o.options || {},
        encoding = o.encoding || 'utf8',
        result;

    if (o.source && o.source.length > 0) {
        result = csslint.verify(o.source, opts);
        callback(false, result);
        
    } else if (o.sourceFile && o.sourceFile.length > 0) {
        fs.readFile(o.sourceFile, encoding, function(err, data) {
           
           if (err) {
               callback(err);
           } 
           
           data = data.toString(encoding);
          
           result = csslint.verify(data, opts);
           callback(false, result);
        });
    } else {
        callback('No source or sourcefile was specified to be css linted.');
    }
};

/*
 * Minify a css source file or string to a destination file or string using less.
 *
 * TODO: could also employ less in its intended usage, as a new task.
 *
 * @method cssMinify
 * @param o {Object} Object containing at least one source property:
 * { source: 'String' || sourceFile: 'Filename.js', destFile: 'Filename.js' || no destination returns string value }
 * @param callback {Function}
 * @public
 */
exports.cssMinify = function(o, callback) {
    var less = require('less'),
        encoding = o.encoding || 'utf8',
        lessParser = new less.Parser,
        fnCssFileResult = function fnCssFileResult(err, data) {
            if (err) {
                callback(err); // Cant read CSS file

            } else {
                lessParser.parse(data, function(err, tree) {

                   if (err) {
                       callback(err); // Cant parse CSS file
                   } else {
                       var cssCompressed = tree.toCSS({compress: true});

                       if (o.destFile) {
                           fs.writeFile(o.destFile, cssCompressed, encoding, function(err) {
                               if (err) {
                                   callback(err); // Cant write CSS file
                               }

                               callback(false);
                           });
                       } else {
                           callback(false, cssCompressed);
                       }
                   }
                });
            }
        };
        
    if (!(o.source || o.sourceFile)) {
        callback('No source or sourcefile was specified to be css minified.');
        
    } else {
        if (o.sourceFile) {
            fs.readFile(o.sourceFile, encoding, fnCssFileResult);
        } else if (o.source) {
            fnCssFileResult(false, o.source);
        }
    }
};