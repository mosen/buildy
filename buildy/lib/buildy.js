/**
 * An attempt to create an alternative to Jake using only evented IO and event
 * dependant tasks.
 * 
 * q('files', [files])('concat')('minify')('write', 'output.js').run()
 * 
 * TODO: metric tons of error handling
 */
var util = require('util'),
    fs = require('fs'),
    events = require('events'),
    glob = require('glob'),
    ju = require('./utils'),
    Queue = require('./queue').Queue;

/**
 * @class Buildy
 * @constructor
 */
function Buildy(input) {
    this._state = input;
}

//util.inherits(Buildy, events.EventEmitter);

/**
 * Static types of Buildy objects that may exist
 */
Buildy.TYPES = {
    FILES : 'FILES', // Collection of file paths, this is always an array, even with one filename
    STRINGS : 'STRINGS', // Collection of strings
    STRING : 'STRING' // Single string input
};

/**
 * A convenience method for producing buildy task objects.
 * 
 * Removes the need to access private members on the buildy task as well
 * as provide a point for injection of configuration information.
 * 
 * @param type {String} Buildy input type (one of Buildy.TYPES)
 * @param input {Object} The data which acts as the input for the next task in the chain
 * @return {Buildy} Instance of a buildy task
 */
Buildy.factory = function(type, input) {
    var output = new Buildy(input);
    output._type = type;
    
    return output;
};

Buildy.prototype = {
    
    /**
     * Input given to the current build task
     * 
     * @property _state
     * @type {Object}
     */
    _state : null,
    
    /**
     * Type of the current buildy input (one of Buildy.TYPES.*)
     * 
     * @property _type
     * @type {String}
     */
    _type : null,
    
    /**
     * Generate a list of files
     * 
     * This task behaves much like FileList in Jake which converts globs into
     * a list of files. The list is returned as an array.
     * 
     * @param filespec {Array} Array of filenames, relative paths, and globs
     * @return Array resolved filenames
     */
    files : function(filespec, promise) {
        // TODO: node-glob globbing
        this._type = Buildy.TYPES.FILES;
        this._state = filespec;
        
        promise.emit('complete');
    },
    
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
     * Copy the input files to a destination using fs api
     * This is normally synchronous
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
                throw new TypeError('copy can only be used with the file collection type');
        }
    },

    /**
     * Concatenate the input files
     * 
     * This task can be performed on files or strings
     */
    concat : function(spec, promise) {
        switch (this._type) {
            case Buildy.TYPES.STRINGS:
                this._state = this._state.join();
                this._type = Buildy.TYPES.STRING;
                promise.emit('complete');
                break;
                
            case Buildy.TYPES.FILES:
                var concatString = ju.concatSync(null, this._state, 'utf8');
                this._state = concatString;
                this._type = Buildy.TYPES.STRING;
                promise.emit('complete');
                break;
                
            default:
                // TODO: more detailed exceptions
                throw new TypeError('concat does not support the input type');
                return this;
                break;
        }
    },
    
    /**
     * JSLint the input
     * 
     * This task can be performed on a string, or strings or files
     * This is a leaf task, there is no chaining.
     * 
     * @param spec {Object} options passed to lint
     * @param promise {EventEmitter} emit complete when complete
     * @return undefined
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
     * This can be executed on files, strings or string type Buildy tasks.
     * 
     * @param lintopts {Object} CSSLint options
     */
    csslint : function(lintopts) {
        var lintOptions = lintopts || {};
        
        switch (this._type) {
            case Buildy.TYPES.FILES:
                this._state.forEach(function(f) {
                    ju.cssLint({sourceFile: f}, lintOptions, function(result) {
                        // TODO: user defined lint output
                        console.log(result);
                    });
                });
                
                return this;
                break;
            
            case Buildy.TYPES.STRING:
                ju.cssLint({source: this._state}, lintOptions, function(result) {
                    // TODO: user defined lint output
                    console.log(result);
                });
                
                return this;
                break;
                
            case Buildy.TYPES.STRINGS:
                this._state.forEach(function(s) {
                    ju.cssLint({source: s}, lintOptions, function(result) {
                        // TODO: user defined lint output
                        console.log(result);
                    });
                });
                
                return this;
                break;

            default:
                throw new TypeError('csslint does not support the input type');
                return this;
                break;  
        }
    },
    
    /**
     * Write out the input to the destination filename
     * 
     * TODO: fix inaccurate docblocks
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
                }); // TODO: consider async write?
                break;
            
            default:
                promise.emit('failed');
                break;
        }
    },
    
    /**
     * Replace the content of the input by applying string.replace
     * 
     * This should operate on strings and files
     * TODO: files
     * 
     * @param regex {String} Regular expression to match
     * @param replace {String} Replacement string (Default '')
     * @param flags {String} Regular expression flags
     * @return {Object} Buildy.STRING | Buildy.STRINGS with expression replaced
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
                
            // TODO: support FILES type
            default:
                promise.emit('failure');
                break;
        }
    },
    
    /**
     * Minify the content of the input using uglify-js
     * 
     * This should operate on string and files
     * TODO: files
     * TODO: use options
     */
    minifySync : function(spec, promise) {
        var output, outputString;
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                outputString = ju.minifySync({source: this._state});
                this._state = outputString;
                promise.emit('complete');
                break;
                
            case Buildy.TYPES.STRINGS:
                var outputStrings = [];
                this._state.forEach(function(s) {
                    outputStrings.push(ju.minifySync({source: s}));
                });
                this._state = outputStrings;
                promise.emit('complete');
                break;
            
            case Buildy.TYPES.FILES:
                // TODO: support multiple input files
                if (this._state.length > 1) {
                    promise.emit('failed');
                    throw new TypeError('Buildy does not yet support multiple file minification');
                }
                
                outputString = ju.minifySync({sourceFile: this._state[0]});
                
                this._state = outputString;
                this._type = Buildy.TYPES.STRING;
                promise.emit('complete');
                break;
                
            default:
                promise.emit('failed');
                throw new TypeError('minify cannot be performed on this input');
                break;
        }
        
    },
    
    /**
     * Asynchronously minify the input
     *
     * @method aminify
     * @param
     * @returns
     * @public
     */
    minify : function(spec, promise) {
        var self = this;
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                ju.minify({source: this._state}, function(err, output) {
                    if (err) {
                        promise.emit('failed');
                    } else {
                        self._state = output;
                        promise.emit('complete');
                    }
                });
                break;
                
            case Buildy.TYPES.STRINGS:
                var stringCount = this._state.length,
                    stringDone = 0,
                    outputStrings = [];
                    
                this._state.forEach(function(s) {
                    ju.minify({source: s}, function(err, output) {
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
                    });
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
                throw new TypeError('minify cannot be performed on this input');
                break;
        }
    },
    
    /**
     * Minify the content of the input using Less
     * 
     * This should operate on string and files
     * TODO: files
     * TODO: basically everything in cssminify
     */
    cssminify : function(options) {
        var output, outputString;
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                // TODO: minifySync
                //outputString = ju.cssMinify({ source: this._state }, fnMinifyDone);
                this._state = outputString;
                return this;
                break;
        }
    },
    
    /**
     * Apply a mustache template
     * 
     * At the moment the input automatically becomes a template variable called 'code'.
     * TODO: This should be configurable to avoid a name clash
     * 
     * @param template {String} Filename of the template to apply
     * @param model {Object} Model containing template variables
     */
    template : function(template, model) {
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                var outputString;
                model.code = this._state;
                outputString = ju.applyTemplateSync(null, template, model);
                this._state = outputString;
                return this;
                break;
                
            //case Buildy.TYPES.FILES:
              
            default:
                throw new TypeError('template cannot be performed on this input');
                return this;
                break;
        }
    },
    
    /**
     * Log the output of the previous task to the console.
     * 
     * @return {Buildy} The output of the previous task.
     */
    log : function() {
        console.log(this._state);
        return this;
    },
    
    /**
     * Execute a task for the Buildy queue
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