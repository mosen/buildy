/**
 * An attempt to create an alternative to Jake using only evented IO and event
 * dependant tasks.
 * 
 * TODO: metric tons of error handling
 */
var util = require('util'),
    fs = require('fs'),
    events = require('events'),
    glob = require('glob'),
    ju = require('./utils');

/**
 * @class Buildy
 * @constructor
 */
function Buildy(input) {
    this._state = input;
    this._promise = new events.EventEmitter;
    this._promise.on('complete', this._taskComplete)
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
     * Promise used by current ASYNC task
     *
     * @property _promise
     * @type {EventEmitter}
     * @value 
     */
    _promise: null,

    
    /**
     * 
     *
     * @method _taskComplete
     * @param
     * @returns
     * @protected
     */
    _taskComplete : function() {
        
    },
    
    /**
     * Fork into multiple parallel tasks which may complete asynchronously.
     * 
     * @param forks {Array} Array of functions which take one parameter, this
     * @return null 
     * TODO: return BuildyCollection which allows selection of Buildys
     * TODO: fork returns promise
     */
    fork : function(forks) {
        var nForks = forks.length,
            forksDone = 0,
            fnForkDone = function() {
                forksDone++;
                // emit fork complete
            },
            self = this;
        
        forks.forEach(function(f) {
           f(self, fnForkDone); 
        });
    },
    
    /**
     * Generate a list of files
     * 
     * This task behaves much like FileList in Jake which converts globs into
     * a list of files. The list is returned as an array.
     * 
     * @param filespec {Array} Array of filenames, relative paths, and globs
     * @return Array resolved filenames
     */
    files : function(filespec) {
        // TODO: node-glob globbing
        this._type = Buildy.TYPES.FILES;
        this._state = filespec;
        return this;
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
    concat : function() {
        switch (this._type) {
            case Buildy.TYPES.STRINGS:
                this._state = this._state.join();
                this._type = Buildy.TYPES.STRING;
                return this;
                break;
                
            case Buildy.TYPES.FILES:
                var concatString = ju.concatSync(null, this._state, 'utf8');
                this._state = concatString;
                this._type = Buildy.TYPES.STRING;
                return this;
                break;
                
            default:
                // TODO: more detailed exceptions
                throw new TypeError('concat does not support the input type');
                return this;
                break;
        }
    },
    
    /**
     * Execute a supplied anonymous function
     * 
     * Allows the developer to insert custom logic into the build process.
     * The anonymous function receives the output of the previous task as
     * the only parameter.
     * 
     * TODO: invocation context is what?
     * 
     * @param aFn {Function} The anonymous function to execute.
     */
    invoke : function(aFn) {
        aFn(this);
    },
    
    /**
     * JSLint the input
     * 
     * This task can be performed on a string, or strings or files
     * This is a leaf task, there is no chaining.
     * 
     * @param lintopts {Object} Options to pass to JSLint
     * @return this {Object} Return this only, it is a leaf node.
     */
    jslint : function(lintopts) {
        var lintOptions = lintopts || {};
        
        switch (this._type) {
            case Buildy.TYPES.FILES:
                this._state.forEach(function(f) {
                    ju.lint({sourceFile: f}, lintOptions, function(result) {
                        var reporter = require('jslint/lib/reporter.js');
                        reporter.report(f, result);
                        
                        // TODO: user defined lint output file or json or console ?
                    });
                
                });
                
                return this;
                break;
            
            case Buildy.TYPES.STRING:
                ju.lint({source: this._state}, lintOptions, function(result) {
                    var reporter = require('jslint/lib/reporter.js');
                    reporter.report('buildy', result);

                    // TODO: user defined lint output file or json or console ?
                });
                
                return this;
                break;
                
            case Buildy.TYPES.STRINGS:
                this._state.forEach(function(f) {

                    ju.lint({source: f}, lintOptions, function(result) {
                        var reporter = require('jslint/lib/reporter.js');
                        reporter.report('buildy', result);
                        
                        // TODO: user defined lint output file or json or console ?
                    });
                
                });
                
                return this;
                break;
                
            default:
                throw new TypeError('jslint does not support the input type');
                return this;
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
     * @param filename {String} Filename to write to
     * @return {Object} Buildy.TYPES.FILES Buildy Task
     */
    write : function(filename) {
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                fs.writeFileSync(filename, this._state, 'utf8'); // TODO: consider async write?
                this._state = [filename];
                this._type = Buildy.TYPES.FILES;
                return this;
                break;
            
            default:
                throw new TypeError('write can only be performed on a string');
                return this;
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
    replace : function(regex, replace, flags) {
        var replace = replace || '',
            flags = flags || 'mg',
            oregex = new RegExp(regex, flags),
            outputString = "", output;
            
        switch (this._type) {
            case Buildy.TYPES.STRING:
                outputString = this._state.replace(oregex, replace);
                this._state = outputString;
                return this;
                break;
                
            case Buildy.TYPES.STRINGS:
                var outputStrings = [];
                
                this._state.forEach(function(s) {
                    outputStrings.push(s.replace(oregex, replace));
                });
                this._state = outputStrings;
                return this;
                break;
                
            // TODO: support FILES type
            default:
                throw new TypeError('replace cannot be performed on the input');
                return this;
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
    minify : function(options) {
        var output, outputString;
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                outputString = ju.minifySync({source: this._state});
                this._state = outputString;
                return this;
                break;
                
            case Buildy.TYPES.STRINGS:
                var outputStrings = [];
                this._state.forEach(function(s) {
                    outputStrings.push(ju.minifySync({source: s}));
                });
                this._state = outputStrings;
                return this;
                break;
            
            case Buildy.TYPES.FILES:
                // TODO: support multiple input files
                if (this._state.length > 1) {
                    throw new TypeError('Buildy does not yet support multiple file minification');
                }
                
                outputString = ju.minifySync({sourceFile: this._state[0]});
                
                this._state = outputString;
                this._type = Buildy.TYPES.STRING;
                return this;
                break;
                
            default:
                throw new TypeError('minify cannot be performed on this input');
                return this;
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
    aminify : function(options) {
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                outputString = ju.minify({source: this._state}, this._promise);
                
                return this;
                break;
                
            case Buildy.TYPES.STRINGS:
                var outputStrings = [];
                this._state.forEach(function(s) {
                    outputStrings.push(ju.minifySync({source: s}));
                });
                this._state = outputStrings;
                return this;
                break;
            
            case Buildy.TYPES.FILES:
                // TODO: support multiple input files
                if (this._state.length > 1) {
                    throw new TypeError('Buildy does not yet support multiple file minification');
                }
                
                outputString = ju.minifySync({sourceFile: this._state[0]});
                
                this._state = outputString;
                this._type = Buildy.TYPES.STRING;
                return this;
                break;
                
            default:
                throw new TypeError('minify cannot be performed on this input');
                return this;
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
    }
};

exports.Buildy = Buildy;