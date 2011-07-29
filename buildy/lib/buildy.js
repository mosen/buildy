/**
 * An attempt to create an alternative to Jake using only evented IO and event
 * dependant tasks.
 * 
 * TODO: metric tons of error handling
 */
var fs = require('fs'),
    glob = require('glob'),
    ju = require('./utils');


function Buildy(input) {
    this._input = input;
}

Buildy.TYPES = {
    FILES : 'FILES', // Collection of file paths, this is always an array, even with one filename
    STRINGS : 'STRINGS', // Collection of strings
    STRING : 'STRING' // Single string input
};

Buildy.prototype = {
    
    /**
     * Input given to the current build task
     * 
     * @property _input
     * @type {Object}
     */
    _input : null,
    
    /**
     * Type of the current buildy input (one of Buildy.TYPES.*)
     * 
     * @property _type
     * @type {String}
     */
    _type : null,
    
    /**
     * Overload toString to provide more readable information about the task
     */
    toString : function() {
       return "Buildytask[" + this._type + "]";
    },
    
    /**
     * Fork into multiple parallel tasks which may complete asynchronously.
     * 
     * @param forks {Array} Array of functions which take one parameter, this
     * @return null 
     * TODO: return BuildyCollection which allows selection of Buildys
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
        var output = new Buildy(filespec); // TODO: does nothing for now
        output._type = Buildy.TYPES.FILES;
        
        return output;
    },
    
    /**
     * Copy the input files to a destination using fs api
     * 
     */
    copy : function(dest) {
        
    },

    /**
     * Concatenate the input files
     * 
     * This task can be performed on files or strings
     */
    concat : function() {
        switch (this._type) {
            case Buildy.TYPES.STRINGS:
                var output = new Buildy(this._input.join());
                
                output._type = Buildy.TYPES.STRING;
                return output;
                break;
                
            case Buildy.TYPES.FILES:
                var concatString = ju.concatSync(null, this._input, 'utf8'),
                    output = new Buildy(concatString);
                    
                output._type = Buildy.TYPES.STRING;
                return output;
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
                // TODO: deal with multi file lists
                ju.lint({ sourceFile: this._input[0] }, lintOptions, function() {
                    // TODO: determine method of outputting lint, probably remove from ju
                });
                
                return this;
                break;
            
            case Buildy.TYPES.STRING:
                ju.lint({ source: this._input }, lintOptions, function() {
                    // TODO: same as above 
                });
                
                return this;
                break;
        }
    },
    
    /**
     * CSSLint the input
     */
    csslint : function(lintopts) {
        var lintOptions = lintopts || {};
        
        switch (this._type) {
            case Buildy.TYPES.FILES:
                // TODO: deal with multi file lists
                ju.cssLint({ sourceFile: this._input[0] }, lintOptions, function() {
                    // TODO: determine method of outputting lint, probably remove from ju
                });
                
                return this;
                break;
            
            case Buildy.TYPES.STRING:
                ju.cssLint({ source: this._input }, lintOptions, function() {
                    // TODO: same as above 
                });
                
                return this;
                break;
        }
    },
    
    /**
     * Write out the input to the destination filename
     * 
     * @param filename {String} Filename to write to
     * @return {Object} filespec build task
     */
    write : function(filename) {
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                var output; 
                
                fs.writeFileSync(filename, this._input, 'utf8'); // TODO: consider async write?
                output = new Buildy([ filename ]);
                output._type = Buildy.TYPES.FILES;
                return output;
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
     * @return {String} String content with expression replaced
     */
    replace : function(regex, replace, flags) {
        var regex = regex || '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n',
            replace = replace || '',
            flags = flags || 'mg',
            oregex = new RegExp(regex, flags),
            outputString = "", output;
            
        switch (this._type) {
            case Buildy.TYPES.STRING:
                outputString = this._input.replace(oregex, replace);
                output = new Buildy(outputString);
                output._type = Buildy.TYPES.STRING;
                return output;
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
                outputString = ju.minifySync({ source: this._input });
                output = new Buildy(outputString);
                output._type = Buildy.TYPES.STRING;
                return output;
                break;
            
            case Buildy.TYPES.FILES:
                // TODO: support multiple input files
                outputString = ju.minifySync({ sourceFile: this._input[0] });
                output = new Buildy(outputString);
                output._type = Buildy.TYPES.STRING;
                return output;
                break;
        }
        
    },
    
    /**
     * Minify the content of the input using Less
     * 
     * This should operate on string and files
     * TODO: files
     */
    cssminify : function(options) {
        var output, outputString;
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                // TODO: minifySync
                //outputString = ju.cssMinify({ source: this._input }, fnMinifyDone);
                output = new Buildy(outputString);
                output._type = Buildy.TYPES.STRING;
                return output;
                break;
        }
    },
    
    /**
     * Apply a mustache template
     * 
     * This should operate on string and files
     * TODO: files
     */
    template : function(template, model) {
        var output, outputString;
        
        switch (this._type) {
            case Buildy.TYPES.STRING:
                model.code = this._input;
                outputString = ju.applyTemplateSync(null, template, model);
                output = new Buildy(outputString);
                output._type = Buildy.TYPES.STRING;
                return output;
                break;
        }
    },
    
    /**
     * Just log the input to the console
     */
    log : function() {
        console.log(this._input);
        return this;
    }
};

exports.Buildy = Buildy;