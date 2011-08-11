var util = require('util'),
    fs = require('fs'),
    path = require('path'),
    events = require('events'),
    glob = require('glob'),
    utils = require('./utils'),
    mkdirp = require('mkdirp').mkdirp,
    cprf = require('./cprf').cprf,
    Queue = require('./queue').Queue;

/**
 * @class Buildy
 * @param input {Object} Initial state
 * @constructor
 */
function Buildy(input) {
    this._state = input;
}

/**
 * Constants of Buildy input/output types that may exist
 * 
 * @property Buildy.TYPES
 * @static
 */
Buildy.TYPES = {
    FILES : 'FILES', // Collection of file paths, this is always an array, even with one filename
    STRINGS : 'STRINGS', // Collection of strings
    STRING : 'STRING' // Single string input
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
     * 
     * @method files
     * @param filespec {Array} Array of literal filenames or globs
     * @param promise {EventEmitter}
     * @protected
     */
    files : function(filespec, promise) {
        var files = [],
            self = this,
            itemsToProcess = filespec.length,
            globFlags = null,
            fnAddFiles = function(filenames) {
                files.push.apply(files, filenames);
                itemsToProcess--;
                
                if (itemsToProcess == 0) {
                    self._type = Buildy.TYPES.FILES;
                    self._state = files;
                    
                    promise.emit('complete');
                }
            },
            fnGlobResults = function(err, matches) {
                if (err) {
                    promise.emit('failed');
                }
                
                fnAddFiles(matches);
            };
        
        filespec.forEach(function(f) {
            
            if (f.indexOf('?') > -1 || f.indexOf('*') > -1 || f.indexOf('[') > -1) {
                glob.glob(f, globFlags, fnGlobResults);
            } else {
                fnAddFiles([f]);
            }
        });
    },
    
    /**
     * Fork the current Buildy and start a new Queue
     * 
     * Each function receives one parameter, the child Buildy object.
     * Each function is also executed in the context of a new Queue object. so
     * new tasks must begin with this.task('abc')
     * 
     * @param forkspec {Object} Hash of queue name : function
     * @param promise {EventEmitter}
     */
    fork : function(forkspec, promise) {
        var child,
            childQueue,
            forkName;
        
        for (forkName in forkspec) {
           childQueue = new Queue(forkName);
           //childQueue._queueStack.push();
           child = Buildy.factory(this._type, this._state.slice());
           forkspec[forkName].call(childQueue, child);            
        }
        
        promise.emit('complete');
    },
    
    /**
     * Copy a file or multiple files to a destination.
     * Can also be used to copy a file to a new file name.
     * 
     * TODO: support recursive copying
     * 
     * @param destspec {String}|{Object} String containing absolute destination or object with properties: dest, recursive: [true/false] (Not implemented)
     * @param promise {EventEmitter}
     */
    copy : function(destspec, promise) {
        var numFilesToCopy = this._state.length,
            fnCopyDone = function(err) {
                if (err) {
                    promise.emit('failure');
                }
                
                numFilesToCopy--;
                
                if (numFilesToCopy == 0) {
                    promise.emit('complete');
                }
            },
            specObj = {
                dest: (destspec instanceof String) ? destspec : destspec.dest,
                recursive: (destspec.recursive !== undefined) ? destspec.recursive : false
            };
        
        switch (this._type) {
            case Buildy.TYPES.FILES:
                // Fully qualified file to file copy
                if (this._state.length == 1) {
                    utils.copy(this._state[0], specObj.dest, fnCopyDone)
                    
                    this._state = [specObj.dest];
                    this._type = Buildy.TYPES.FILES;
                    
                    promise.emit('complete');
                    
                } else {
                    var destFiles = [];
                    // Copy the source list to a destination directory
                    // TODO: auto strip trailing slash on destination
                    this._state.forEach(function(f) {
                       destFiles.push(specObj.dest + '/' + f);
                       utils.copy(f, specObj.dest + '/' + f, fnCopyDone); 
                    });
                    
                    this._state = destFiles;
                    this._type = Buildy.TYPES.FILES;
                    
                    promise.emit('complete');
                }
                break;
                
            default:
                promise.emit('failure');
        }
    },
    
    copy2 : function(spec, promise) {
        // spec.src
        // spec.dest
        // spec.recursive true|false
        // spec.excludes ['name']
        
        cprf(spec.src, spec.dest, function() {
            console.log('Done copying');
            promise.emit('complete');
        }, { 
            recursive : spec.recursive || false,
            excludes  : spec.excludes || []
        })
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
                promise.emit('complete');
                break;
                
            case Buildy.TYPES.FILES:
                var concatString = utils.concatSync(null, this._state, 'utf8');
                this._state = concatString;
                this._type = Buildy.TYPES.STRING;
                promise.emit('complete');
                break;
                
            default:
                promise.emit('failure');
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
                    utils.lint({sourceFile: f}, lintOptions, function(result) {
                        var reporter = require('jslint/lib/reporter.js');
                        reporter.report(f, result);
                        
                        // TODO: user defined lint output file or json or console ?
                    });
                
                });
                promise.emit('complete');
                break;
            
            case Buildy.TYPES.STRING:

                utils.lint({source: this._state}, lintOptions, function(result) {
                    var reporter = require('jslint/lib/reporter.js');
                    reporter.report('buildy', result);
                    
                });
                promise.emit('complete'); // Who cares, its async by nature
                
                break;
                
            case Buildy.TYPES.STRINGS:
                
                this._state.forEach(function(f) {
                    utils.lint({source: f}, lintOptions, function(result) {
                        var reporter = require('jslint/lib/reporter.js');
                        reporter.report('buildy', result);
                        
                    });
                });
                promise.emit('complete');
                
                break;
                
            default:
                promise.emit('failure');
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
                    utils.cssLint({sourceFile: f}, lintOptions, function(result) {
                        // TODO: user defined lint output
                        console.log(result);
                    });
                });
                promise.emit('complete');
                break;
            
            case Buildy.TYPES.STRING:
                utils.cssLint({source: this._state}, lintOptions, function(result) {
                    // TODO: user defined lint output
                    console.log(result);
                });
                promise.emit('complete');              
                break;
                
            case Buildy.TYPES.STRINGS:
                this._state.forEach(function(s) {
                    utils.cssLint({source: s}, lintOptions, function(result) {
                        // TODO: user defined lint output
                        console.log(result);
                    });
                });
                promise.emit('complete');
                break;

            default:
                promise.emit('failure');
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
                        promise.emit('failed', err);
                    } else {
                        self._state = [spec.name];
                        self._type = Buildy.TYPES.FILES;

                        promise.emit('complete');
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
                    }

                });
                break;
            
            default:
                promise.emit('failed');
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
                promise.emit('complete');
                break;
                
            case Buildy.TYPES.STRINGS:
                var outputStrings = [];
                
                this._state.forEach(function(s) {
                    outputStrings.push(s.replace(oregex, replace));
                });
                this._state = outputStrings;
                promise.emit('complete');
                break;

            default:
                promise.emit('failure');
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
                        promise.emit('failed');
                    } else {
                        self._state = output;
                        promise.emit('complete');
                    }                    
                }
                
                utils.minify({source: this._state}, fnMinifyCallback);
                break;
                
            case Buildy.TYPES.STRINGS:
                var stringsLeft = this._state.length,
                    outputStrings = [],
                    fnMinifyCallback = function(err, output) {
                        if (err) {
                            promise.emit('failed', err);
                        } else {
                            outputStrings.push(output);
                            stringsLeft--;
                            
                            if (stringsLeft < 1) {
                                self._state = outputStrings;
                                promise.emit('complete');
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
                            promise.emit('failed');
                        } else {
                            fileDone++;
                            if (fileDone == fileCount) {
                                promise.emit('complete');
                            }
                        }
                    });
                });
                break;
                
            default:
                promise.emit('failed');
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
                var fnMinifyCallback = function(data) {
                    self._state = data;
                    promise.emit('complete');
                };
                
                utils.cssMinify({ source: this._state }, fnMinifyCallback);
                break;
        }
    },
    
    /**
     * Apply a template using Mustache
     * 
     * At the moment the input automatically becomes a template variable called 'code'.
     * @todo This should be configurable to avoid a name clash
     * @todo support more than utilsst string inputs
     * @method template
     * @param spec {Object} Template task configuration { template: 'stringtemplate', templateFile: 'template.mustache', model: modelObj }
     * @param promise {EventEmitter}
     * @protected
     */
    template : function(spec, promise) {
        var self = this,
            fnTemplateCallback= function(data) {
                self._state = data;
                promise.emit('complete');
            };
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                spec.model.code = this._state;
                utils.applyTemplate(spec, fnTemplateCallback);
                break;
                
            //case Buildy.TYPES.FILES:
              
            default:
                promise.emit('failure');
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
        promise.emit('complete');
    },
    
    /**
     * Execute a task using this Buildy.
     * This method is normally invoked from the Queue object
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