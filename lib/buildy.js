var util      = require('util'),
    fs        = require('fs'),
    path      = require('path'),
    events    = require('events'),
    utils     = require('buildy/lib/utils'),
    mkdirp    = require('mkdirp').mkdirp,
    glob      = require('buildy/lib/glob'),
    cprf      = require('buildy/lib/cprf').cprf;

/**
 * The buildy object executes Queue tasks.
 * There is generally one buildy per Queue, because it carries
 * the output of the previous task with it to the next.
 * 
 * In a forked task situation, a new buildy object is created for the fork
 * which inherits the state information of the parent.
 *
 * TODO: Separation of design is not clear wrt buildy and utils, as buildy contains some utility functions
 * TODO: promise.emit('complete', 'taskname', 'result') should be the signature for task completion events
 * promise.emit('failed', 'taskname', 'error') for failures
 *
 * @class Buildy
 * @param input {Object} Initial state
 * @constructor
 */
function Buildy(input) {
    this._state = input;
}

/**
 * Constants of Buildy input/output types that may exist.
 * For a single file, just give an array with one entry.
 * 
 * @property Buildy.TYPES
 * @type Object
 * @final
 */
Buildy.TYPES = {
    FILES   : 'FILES', // Collection of file paths, this is always an array, even with one filename
    STRINGS : 'STRINGS', // Collection of strings
    STRING  : 'STRING' // Single string input
};

/**
 * A convenience method for producing buildy objects.
 * 
 * @param type {String} Buildy input type (one of Buildy.TYPES)
 * @param input {Object} The buildy state, the data which will be operated on
 * @return {Buildy} Instance of a buildy task
 * @public
 * @static
 */
Buildy.factory = function(type, input) {
    var output = new Buildy(input);
    output._type = type;
    
    return output;
};

Buildy.prototype = {
    
    /**
     * The current state information. Determined by the output of
     * the previous task OR the constructor.
     * 
     * @property _state
     * @type {Object}
     */
    _state : null,
    
    /**
     * The type of state that is currently held (one of Buildy.TYPES.*)
     * 
     * @property _type
     * @type {String}
     */
    _type : null,
    
    /**
     * Generate a list of files using a combination of names and globs
     * 
     * @todo abstract the recursive globbing of Cprf to share with this
     * 
     * @method files
     * @param filespec {Array} Array of literal filenames or globs
     * @param promise {EventEmitter}
     * @protected
     */
    files : function(filespec, promise) {
        var files = [],
            self = this,
            globsToProcess = [],
            itemsToProcess = filespec.length,
            fnGlobFinished = function(globEnded, pattern) {
                globsToProcess = globsToProcess.filter(function(v) {
                    return (v === globEnded) ? false : true;
                });
                itemsToProcess--;

                fnIsDone();
            },
            fnAddFile = function(filenames) {
                files.push.apply(files, filenames);
                itemsToProcess--;

                fnIsDone();
            },
            fnIsDone = function() {
                if (itemsToProcess == 0 && globsToProcess.length == 0) {
                    self._type = Buildy.TYPES.FILES;
                    self._state = files;

                    promise.emit('complete', 'files', self._state.join(', '));
                }
            };
        
        filespec.forEach(function(f) {
            
            if (/(^!|^#|[?*])/.test(f)) { // Test for Glob

                var newGlob = glob.glob(f);
                globsToProcess.push(newGlob);

                newGlob.on('data', function(filename) {
                    files.push.apply(files, [filename]);
                });

                newGlob.on('error', function(err) {
                    // TODO: fail queue on glob error? or proceed?
                    promise.emit('failure', 'files', err);
                });

                newGlob.on('end', function(pattern) {
                    fnGlobFinished(this, pattern);
                });

            } else { // Resolved path
                fnAddFile([f]);
            }
        });
    },
    
    /**
     * Copy a number of sources to a destination
     * (Supports wildcard matching and exclusion list)
     * 
     * spec {
     *  src : [ 'file', 'directory', 'file.*', 'directory/*' ],
     *  dest : '/absolute/or/relative/path',
     *  recursive : true, false
     *  excludes : [ 'excludedfile', 'excluded/directory/' ] - wildcards currently not supported
     * }
     * 
     * @method copy
     * @param spec {Object} task specification
     * @param promise {EventEmitter} task promise
     */
    copy : function(spec, promise) {
        cprf(spec.src, spec.dest, function() {
            promise.emit('complete', 'copy', spec);
        }, { 
            recursive : spec.recursive || false,
            excludes  : spec.excludes || []
        });
    },

    /**
     * Concatenate the input
     * 
     * This task can be performed on files or strings.
     * Asynchronous concatenation is never performed.
     * 
     * The default output type is string, because it is better and
     * easier to work with the in-memory representation of the concat output.
     * 
     * @param spec {Object} [Unused] Required for the Buildy interface
     * @param promise {EventEmitter}
     */
    concat : function(spec, promise) { 
        switch (this._type) {
            case Buildy.TYPES.STRINGS:
                this._state = this._state.join();
                this._type = Buildy.TYPES.STRING;
                promise.emit('complete', 'concat', this._state.length + ' bytes.');
                break;
                
            case Buildy.TYPES.FILES:
                var concatString = utils.concatSync(null, this._state, 'utf8');
                this._state = concatString;
                this._type = Buildy.TYPES.STRING;
                promise.emit('complete', 'concat', 'concatenated files');
                break;
                
            default:
                promise.emit('failure', 'concat', 'unrecognised input type: ' + this._type);
                break;
        }
    },
    
    /**
     * JSLint the input
     * 
     * This task can be performed on a string, or strings or files
     * The task will return immediately and produces no output for the following
     * task.
     * 
     * @param spec {Object} jslint task configuration
     * @param promise {EventEmitter}
     */
    jslint : function(spec, promise) {
        var lintOptions = spec || {};

        switch (this._type) {

            case Buildy.TYPES.FILES:
                this._state.forEach(function(f) {
                    utils.lint({sourceFile: f, options: lintOptions}, function(err, result) {
                        var reporter = require('jslint/lib/reporter.js');
                        reporter.report(f, result);

                        // TODO: user defined lint output file or json or console ?
                    });

                });
                // Don't care about the exit status or timing of lint jobs
                promise.emit('complete', 'jslint', this._state.join(', '));
                break;

            case Buildy.TYPES.STRING:

                utils.lint({source: this._state, options: lintOptions}, function(err, result) {
                    var reporter = require('jslint/lib/reporter.js');
                     reporter.report('buildy', result);

                });
                promise.emit('complete', 'jslint', 'string linted.'); // Who cares, its async by nature
                break;

            case Buildy.TYPES.STRINGS:

                this._state.forEach(function(f) {
                    utils.lint({source: f, options: lintOptions}, function(err, result) {
                        var reporter = require('jslint/lib/reporter.js');
                        reporter.report('buildy', result);

                    });
                });
                promise.emit('complete', 'jslint', 'strings linted.');
                break;

            default:
                promise.emit('failure', 'jslint', 'unrecognised input type: ' + this._type);
                break;
        }
    },
    
    /**
     * CSSLint the input
     * 
     * This can be executed on files, strings or string.
     * 
     * @param spec {Object} csslint task configuration
     * @param promise {EventEmitter}
     * @protected
     */
    csslint : function(spec, promise) {
        var lintOptions = spec || {};
        
        switch (this._type) {
            case Buildy.TYPES.FILES:
                this._state.forEach(function(f) {
                    utils.cssLint({sourceFile: f, options: lintOptions}, function(err, result) {
                        // TODO: user defined lint output
                        //console.log(result);
                    });
                });
                promise.emit('complete', 'csslint', this._state.join(', '));
                break;
            
            case Buildy.TYPES.STRING:
                utils.cssLint({source: this._state, options: lintOptions}, function(err, result) {
                    // TODO: user defined lint output
                    //console.log(result);
                });
                promise.emit('complete', 'csslint', 'linted string');
                break;
                
            case Buildy.TYPES.STRINGS:
                this._state.forEach(function(s) {
                    utils.cssLint({source: s, options: lintOptions}, function(err, result) {
                        // TODO: user defined lint output
                        //console.log(result);
                    });
                });
                promise.emit('complete', 'csslint', 'linted strings');
                break;

            default:
                promise.emit('failure', 'csslint', 'unrecognised input type: ' + this._type);
                break;  
        }
    },
    
    /**
     * Write out the input to the destination filename.
     * 
     * This can only apply to single string inputs.
     * 
     * @param spec {Object} options containing .name (filename)
     * @param promise {EventEmitter}
     * @return {Object} Buildy.TYPES.FILES Buildy Task
     */
    write : function(spec, promise) {
        var self = this,
            pathAbs = path.resolve(path.dirname(spec.name)),
            fnWriteFile = function fnWriteFile() {
                
                fs.writeFile(spec.name, self._state, 'utf8', function(err) {
                    if (err) { 
                        promise.emit('failed', 'write', err);
                    } else {
                        self._state = [spec.name];
                        self._type = Buildy.TYPES.FILES;

                        promise.emit('complete', 'write', self._state.join(', '));
                    }
                });               
            };
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                path.exists(pathAbs, function(exists) {
                    
                    if (!exists) {
                        mkdirp(pathAbs, '0755', function(err) {
                            if (err) {
                                promise.emit('failed', err);
                                return;
                            }
                            
                            fnWriteFile();
                        });
                    } else {
                        fnWriteFile();
                    }

                });
                break;
            
            default:
                promise.emit('failed', 'write', 'unrecognised input type: ' + this._type);
                break;
        }
    },
    
    /**
     * Replace the content of the input by applying string.replace
     * 
     * This operates on single or multiple strings.
     * 
     * @todo replace file content using the file input
     * @method replace
     * @param spec {Object} Replace task config containing .regex .replace .flags
     * @param promise {EventEmitter}
     * @protected
     */
    replace : function(spec, promise) {
        var replace = spec.replace || '',
            flags = spec.flags || 'mg',
            oregex = new RegExp(spec.regex, flags),
            outputString = "";
            
        switch (this._type) {
            case Buildy.TYPES.STRING:
                outputString = this._state.replace(oregex, replace);
                this._state = outputString;
                promise.emit('complete', 'replace', 'replaced regex in input string');
                break;
                
            case Buildy.TYPES.STRINGS:
                var outputStrings = [];
                
                this._state.forEach(function(s) {
                    outputStrings.push(s.replace(oregex, replace));
                });
                this._state = outputStrings;
                promise.emit('complete', 'replace', 'replaced regex in ' + this._state.length + ' strings');
                break;

            default:
                promise.emit('failed', 'replace', 'unrecognised input type: ' + this._type);
                break;
        }
    },
    
    /**
     * Minify the input (JavaScript)
     *
     * @method minify
     * @param spec {Object} Minify task configuration
     * @param promise {EventEmitter}
     * @protected
     */
    minify : function(spec, promise) {
        var self = this;
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                var fnMinifyCallback = function(err, output) {
                    if (err) {
                        promise.emit('failed', 'minify', err);
                    } else {
                        self._state = output;
                        promise.emit('complete', 'minify', 'string minified');
                    }                    
                }
                
                utils.minify({source: this._state}, fnMinifyCallback);
                break;
                
            case Buildy.TYPES.STRINGS:
                var stringsLeft = this._state.length,
                    outputStrings = [],
                    fnMinifyCallback = function(err, output) {
                        if (err) {
                            promise.emit('failed', 'minify', err);
                        } else {
                            outputStrings.push(output);
                            stringsLeft--;
                            
                            if (stringsLeft < 1) {
                                self._state = outputStrings;
                                promise.emit('complete', 'minify', 'minified ' + this._state.length + ' strings');
                            }
                        }                        
                    };
                    
                this._state.forEach(function(s) {
                    utils.minify({source: s}, fnMinifyCallback);
                });
                break;
            
            case Buildy.TYPES.FILES:
                var fileCount = this._state.length,
                    fileDone = 0;
                    
                this._state.forEach(function(f) {
                    utils.minify({sourceFile: f}, function(err, output) {
                        if (err) {
                            promise.emit('failed', 'minify', err);
                        } else {
                            fileDone++;
                            if (fileDone == fileCount) {
                                promise.emit('complete', 'minify', this._state.join(', '));
                            }
                        }
                    });
                });
                break;
                
            default:
                promise.emit('failed', 'minify', 'unrecognised input type: ' + this._type);
                break;
        }
    },
    
    /**
     * Minify the input (CSS) using Less
     * 
     * @todo support multiple strings
     * @method cssminify
     * @param spec {Object} CSS minify task configuration
     * @param promise {EventEmitter}
     * @protected
     */
    cssminify : function(spec, promise) {
        var self = this;
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                var fnMinifyCallback = function(err, data) {

                    if (err) {
                        promise.emit('failed', 'cssminify', err);
                    } else {
                        self._state = data;
                        promise.emit('complete', 'cssminify', 'minified css string');
                    }
                };
                
                utils.cssMinify({ source: this._state }, fnMinifyCallback);
                break;

            default:
                promise.emit('failed', 'cssminify', 'unrecognised input type: ' + this._type);
                break;
        }
    },
    
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
    template : function(spec, promise) {
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
                utils.applyTemplate(spec, fnTemplateCallback);
                break;
                
            //case Buildy.TYPES.FILES:
              
            default:
                promise.emit('failure', 'template', 'unrecognised input type: ' + this._type);
                // todo: eliminate repetition of this pattern of default cases
                break;
        }
    },
    
    /**
     * Log the output of the previous task (the current state) to the console.
     * 
     * @method log
     * @param spec {Object} Unused
     * @param promise {EventEmitter}
     * @protected
     */
    log : function(spec, promise) {
        console.log('Buildy(' + this._type + ')');
        console.log(this._state);
        promise.emit('complete', 'log', ''); // TODO: Maybe this should be the log output? the event arg
    },
    
    /**
     * Execute a task using this Buildy.
     * This method is normally invoked from the Queue object.
     *
     * The task type must exist on the Buildy object as a method.
     * TODO: custom task types via prototype mixin, maybe even autoloading?
     * 
     * @method exec
     * @param type {String} Type of task to execute
     * @param spec {Object} Options to pass to the task
     * @param promise {EventEmitter} emitter that will emit ('complete' or
     * 'failed') upon result
     * @public
     */
    exec : function(type, spec, promise) {
        this[type](spec, promise);
    }
};

exports.Buildy = Buildy;