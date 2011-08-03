var util = require('util'),
    fs = require('fs'),
    events = require('events'),
    glob = require('glob'),
    ju = require('./utils'),
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
 * @param input {Object} The data which acts as the input for the next task in the chain
 * @return {Buildy} Instance of a buildy task
 * @public
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
           childQueue._queue = [];
           childQueue._nameStack.push(this._name);
           child = Buildy.factory(this._type, this._state.slice());
           forkspec[forkName].call(childQueue, child);            
        }
        
        promise.emit('complete');
    },
    
    /**
     * Copy a file or multiple files to a destination.
     * Can also be used to copy a file to a new file name.
     * 
     * TODO: async mode
     * TODO: use promise
     * 
     * @param dest {String} The destination filename (if the source is a single file) or destination directory (no trailing slash)
     * @return {Object} Buildy.FILES containing paths to the files that have been copied
     */
    copy : function(dest) {
        switch (this._type) {
            case Buildy.TYPES.FILES:
                // Fully qualified file to file copy
                if (this._state.length == 1) {
                    ju.copySync(this._state[0], dest);
                    this._state = [dest];
                    this._type = Buildy.TYPES.FILES;
                    return this;
                    
                } else {
                    var destFiles = [];
                    // Copy the source list to a destination directory
                    // TODO: auto strip trailing slash on destination
                    this._state.forEach(function(f) {
                       destFiles.push(dest + '/' + f);
                       ju.copySync(f, dest + '/' + f); 
                    });
                    
                    this._state = destFiles;
                    this._type = Buildy.TYPES.FILES;
                    return this;
                }
                break;
                
            default:
                promise.emit('failure');
        }
    },

    /**
     * Concatenate the input
     * 
     * This task can be performed on files or strings
     * 
     * @param spec {Object} [Unused]
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
                // Doesn't make sense to concatenate asynchronously, because we want
                // to preserve the ordering
                var concatString = ju.concatSync(null, this._state, 'utf8');
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
     * @protected
     */
    jslint : function(spec, promise) {
        var lintOptions = spec || {};
        
        switch (this._type) {
            
            case Buildy.TYPES.FILES:
                this._state.forEach(function(f) {
                    ju.lint({sourceFile: f}, lintOptions, function(result) {
                        var reporter = require('jslint/lib/reporter.js');
                        reporter.report(f, result);
                        
                        // TODO: user defined lint output file or json or console ?
                    });
                
                });
                promise.emit('complete');
                break;
            
            case Buildy.TYPES.STRING:

                ju.lint({source: this._state}, lintOptions, function(result) {
                    var reporter = require('jslint/lib/reporter.js');
                    reporter.report('buildy', result);
                    
                });
                promise.emit('complete'); // Who cares, its async by nature
                
                break;
                
            case Buildy.TYPES.STRINGS:
                
                this._state.forEach(function(f) {
                    ju.lint({source: f}, lintOptions, function(result) {
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
                    ju.cssLint({sourceFile: f}, lintOptions, function(result) {
                        // TODO: user defined lint output
                        console.log(result);
                    });
                });
                promise.emit('complete');
                break;
            
            case Buildy.TYPES.STRING:
                ju.cssLint({source: this._state}, lintOptions, function(result) {
                    // TODO: user defined lint output
                    console.log(result);
                });
                promise.emit('complete');              
                break;
                
            case Buildy.TYPES.STRINGS:
                this._state.forEach(function(s) {
                    ju.cssLint({source: s}, lintOptions, function(result) {
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
     * @return {Object} Buildy.TYPES.FILES Buildy Task
     */
    write : function(spec, promise) {
        var self = this;
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                fs.writeFile(spec.name, this._state, 'utf8', function(err) {
                    if (err) { 
                        promise.emit('failed'); 
                    } else {
                        self._state = [spec.name];
                        self._type = Buildy.TYPES.FILES;
                        
                        promise.emit('complete');
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
                
                ju.minify({source: this._state}, fnMinifyCallback);
                break;
                
            case Buildy.TYPES.STRINGS:
                var stringCount = this._state.length,
                    stringDone = 0,
                    outputStrings = [],
                    fnMinifyCallback = function(err, output) {
                        if (err) {
                            console.log('cant minify');
                            promise.emit('failed');
                        } else {
                            outputStrings.push(output);
                            stringDone++;
                            console.log('finished minifying string');
                            
                            if (stringDone == stringCount) {
                                self._state = outputStrings;
                                promise.emit('complete');
                            }
                        }                        
                    };
                    
                this._state.forEach(function(s) {
                    ju.minify({source: s}, fnMinifyCallback);
                });
                break;
            
            case Buildy.TYPES.FILES:
                var fileCount = this._state.length,
                    fileDone = 0;
                    
                this._state.forEach(function(f) {
                    ju.minify({sourceFile: f}, function(err, output) {
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
                
                ju.cssMinify({ source: this._state }, fnMinifyCallback);
                break;
        }
    },
    
    /**
     * Apply a template using Mustache
     * 
     * At the moment the input automatically becomes a template variable called 'code'.
     * @todo This should be configurable to avoid a name clash
     * @todo support more than just string inputs
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
                ju.applyTemplate(spec, fnTemplateCallback);
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
     * @param promise {EventEmitter} Promise that will emit ('complete' or
     * 'failed') upon result
     * @public
     */
    exec : function(type, spec, promise) {
        var t = this[type];
        t(spec, promise);
    }
};

exports.Buildy = Buildy;