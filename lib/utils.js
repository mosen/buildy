/**
 * A range of utility functions called by the Buildy object.
 *
 * Most of these will throw an Exception whenever an error occurs, it is the job of the caller to
 * convey the failed task information.
 */
var sys    = require('sys'),
    util   = require('util'),
    fs     = require('fs'),
    path   = require('path'),
    events = require('events'),
//    glob   = require('glob'),
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
    var content = '',
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
 *
 * @todo Use handlebars instead as is the written word of the yui gods.
 * @method applyTemplateSync
 * @param dest null|String String will be returned if null, or written to the specified filename.
 * @param template String filename of the template file to use.
 * @param o Object object for which its properties will be used to generate the output.
 * @param format String file encoding (default 'utf8')
 */
exports.applyTemplateSync = function(dest, template, o, format) {
    var format = format || 'utf8',
        templateContent = fs.readFileSync(template, format);
    
    try {
        var Mustache = require('Mustache');
    } catch (e) {
        throw new Error('applyTemplate requires Mustache to be installed (npm install mustache)');
    }
    
    if (dest === null) {
        return Mustache.to_html(templateContent, o);
    } else {
        fs.writeFileSync(dest, Mustache.to_html(templateContent, o));
    }
};

/**
 * Apply a string or file template using a model object to substitute variables.
 *
 * @todo change callback method signature to err,data
 * @method applyTemplate
 * @param o {Object} configuration containing .template (String template) or .templateFile (File template),
 * .model (Object)
 * @param callback {Function}
 */
exports.applyTemplate = function applyTemplate(o, callback) {
    var Mustache = require('Mustache'),
        format = 'utf8',
        fnGotTemplate = function(templateString) {
            var templatedString;
            
            // TODO: file output
            //if (o.hasOwnProperty('dest')) {}
            
            templatedString = Mustache.to_html(templateString, o.model);
            callback(templatedString);
        };
    
    if (o === undefined) {
        throw new TypeError('applyTemplate configuration object was not supplied');
    }
    
    if (o.hasOwnProperty('templateFile')) {
        fs.readFile(o.templateFile, format, function(err, data) {
           if (err) {
               throw new Error('Could not read specified template file: ' + o.templateFile);
           } else {
               fnGotTemplate(data);
           }
        });
    } else if (o.hasOwnProperty('template')) {
        fnGotTemplate(o.template);
    }
};

/**
 * Run JSLint|JSHint on a string or file.
 *
 * @method lint
 * @param o {Object} Object containing properties .source | .sourceFile, string or file to lint respectively.
 * @param options {Object} JSLint options
 * @param callback {Function} Callback function when lint has finished.
 * @param encoding {String} [Optional] Encoding to use for files, default 'utf8'
 */
exports.lint = function(o, options, callback, encoding) {
    
    var linter = require('jslint/lib/linter.js'),
        reporter = require('jslint/lib/reporter.js'),
        result;
        
    options = options || {};
    encoding = encoding || 'utf8';

    if (o.source && o.source.length > 0) {
        result = linter.lint(o.source, options);
        callback(result);
    } else if (o.sourceFile && o.sourceFile.length > 0) {
        fs.readFile(o.sourceFile, encoding, function(err, data) {   
           if (err) {
               throw err;
           } 

           result = linter.lint(data.toString(encoding), options);
           // TODO: report results in builder output, not here in utils
           //reporter.report(o.sourceFile, result);
           callback(result);
        });
    } else {
        callback();
    }
};

/**
 * Minify the input
 *
 * @method minify
 * @param o {Object} Minify parameters:
 *  o.source - source code as string
 *  o.sourceFile - source filename
 *  o.destFile - destination file to be written, otherwise the first argument to the complete
 *  event will be the output string.
 * @param callback {Function} Callback when done
 */
exports.minify = function(o, callback) {
    
    var min = function(o, callback) {

        var jsp = require("uglify-js").parser,
            pro = require("uglify-js").uglify,
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
            fs.writeFile(o.destFile, pro.gen_code(ast), 'utf8', function(err) {
                if (err) throw err;
                callback(false, o.destFile);
            });
        }
    };
    
    if (o.sourceFile) {
        fs.readFile(o.sourceFile, 'utf8', function(err, data) {
            if (err) throw err;
            delete o.sourceFile;
            o.source = data;
            min(o, callback);
        });
    } else if (o.source) {
        min(o, callback);
    } else {
        callback(true);
    }
};

/**
 * CSSLint source file
 *
 * @todo change callback signature to standard err,data
 * @method cssLint
 * @param o {Object} Object containing at least one source property:
 * { source: 'String' || sourceFile: 'Filename.js' } 
 * @param csslintopts {Object} Object literal containing options for csslint
 * @param callback {Function} Callback function which receives one value, the result of csslint.
 */
exports.cssLint = function(o, csslintopts, callback) {
    var csslint = require('csslint').CSSLint,
        opts = csslintopts || {},
        result;

    if (o.source && o.source.length > 0) {
        result = csslint.verify(o.source, opts);
        callback(result);
        
    } else if (o.sourceFile && o.sourceFile.length > 0) {
        fs.readFile(o.sourceFile, 'utf8', function(err, data) {
           
           if (err) {
               throw err;
           } 
           
           data = data.toString('utf8');
          
           result = csslint.verify(data, opts);
           callback(result);
        });
    } else {
        callback();
    }
};

/*
 * Minify a css source file or string to a destination file or string
 *
 * @method cssMinify
 * @todo Async this
 * @param o {Object} Object containing at least one source property:
 * { source: 'String' || sourceFile: 'Filename.js', destFile: 'Filename.js' || no destination returns string value }
 * @param callback {Function}
 * @public
 */
exports.cssMinify = function(o, callback) {
    var less = require('less'),
        lessParser = new less.Parser;
        
    if (!(o.source || o.sourceFile)) {
        throw new TypeError('No source specified');
        
    } else {
        if (o.sourceFile) {
            o.source = fs.readFileSync(o.sourceFile, 'utf8');
        }

        lessParser.parse(o.source, function(err, tree) {
           var cssCompressed = tree.toCSS({compress: true});
           
           if (err) {
               throw err;
           }

           if (o.destFile) {
               fs.writeFile(o.destFile, cssCompressed, 'utf8', function(err) {
                   if (err) {
                       throw err;
                   }
                   
                   callback();
               });
           } else {
               callback(cssCompressed);
           }
        });
    }
};

//exports.copySync = function copySync(src, dst) {
// 
//  if(typeof dst == 'undefined') {
//    throw new Error('Destination is not defined');
//  } 
//
//  if(!path.existsSync(src)) {
//
//    throw new Error(src + ' does not exists.');
//  }
//
//  if(fs.statSync(src).isDirectory()) {
//
//    throw new Error(src + ' is a directory. It must be a file');
//  }
//
//  if(src == dst) {
//
//    throw new Error(src + ' and ' + dst + 'are identical');
//  }
//
//  var infd = fs.openSync(src, 'r');
//  var size = fs.fstatSync(infd).size;
//  var outfd = fs.openSync(dst, 'w');
//
//  fs.sendfileSync(outfd, infd, 0, size);
//
//  fs.close(infd);
//  fs.close(outfd);
//};
