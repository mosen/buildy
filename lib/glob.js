/*
Copyright (c) 2010 Sam Shull http://www.google.com/profiles/brickysam26

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
 */

// Borrowed and modified per Sam Shull's node-glob-async

var util = require("util"),
    fs = require("fs"),
    path = require("path"),
    EventEmitter = require('events').EventEmitter;

/**
 *
 *
 *    @param String pattern
 *    @param Number flags
 *    @returns Glob
 */
function glob(pattern, flags) {
    var base = glob2dir(pattern, flags || 0);
    return new Glob({
        flags: flags || 0,
        originalPattern: pattern,
        pattern: glob2regex(pattern, flags || 0),
        sync: false,
        baseDir: base || process.cwd(),
        base: base
    });
}

/**
 *
 *
 *    @param String pattern
 *    @param Number flags
 *    @returns Array
 *    @throws Error
 */
function globSync(pattern, flags) {
    var base = glob2dir(pattern, flags || 0),
        globber = new Glob({
            flags: flags || 0,
            originalPattern: pattern,
            pattern: glob2regex(pattern, flags || 0),
            sync: true,
            baseDir: base || process.cwd(),
            base: base
        });

    return globber.initialize() || [];
}

/**
 *
 *
 *    @param RegExp pattern
 *    @param String base
 *    @param Number flags
 *    @returns Glob
 */
function globRegExp(pattern, base, flags) {
    return new Glob({
        flags: flags || 0,
        pattern: pattern,
        sync: false,
        baseDir: base || process.cwd(),
        base: base || ""
    });
}

/**
 *
 *
 *    @param RegExp pattern
 *    @param String base
 *    @param Number flags
 *    @returns Array
 *    @throws Error
 */
function globRegExpSync(pattern, base, flags) {
    var globber = new Glob({
        flags: flags || 0,
        pattern: pattern,
        sync: true,
        baseDir: base || process.cwd(),
        base: base || ""
    });

    return globber.initialize() || [];
}

/**
 *
 *
 *    @param String glob
 *    @param Number flags
 *    @returns String
 */
function glob2dir(glob, flags) {
    flags = flags || 0;
    var base = "",
        i = 0, n,
        l = glob.length,
        character,
        exit = 0;

    while (i<l) {
        character = glob.charAt(i++);
        switch (character) {
            case "[":
            case "*":
            case "?":
                exit = 1;
                break;
            case "\\":
                if (!(flags & Glob.NOESCAPE)) {
                    base = base + glob.charAt(i++);
                } else {
                    base = base + character;
                }
                break;
            case "{":
                if (flags & Glob.BRACE) {
                    exit = 1;
                    break;
                }
                /* fall */
            default:
                base = base + character;
                break;
        }
        if (exit) {
            break;
        }
    }

    n = base.lastIndexOf("/");

    return n > -1 ? base.substr(0, n) : "";
}

/**
 *
 *
 *    @param String glob
 *    @param Number flags = 0
 *    @param Boolean returnString = false
 *    @returns RegExp | String
 */
function glob2regex(glob, flags, returnString) {
    flags = flags || 0;
    var regex = "",
        i = 0, n,
        l = glob.length,
        character,
        temp;

    while (i<l) {
        character = glob.charAt(i++);
        switch (character) {
            case "\\":
                if (!(flags & Glob.NOESCAPE)) {
                    regex = regex + character + glob.charAt(i++);
                } else {
                    regex = regex + character;
                }
                break;
            case "*":
                regex = regex + ".*";
                break;
            case "?":
                regex = regex + ".?";
                break;
            case "[":
                n = glob.indexOf("]", i);
                regex = regex + "[" + glob.substr(i, n) + "]";
                i = i + n + 1;
                break;
            case "{":
                if (flags & Glob.BRACE) {
                    n = glob.indexOf("}", i);
                    temp = glob.substr(i, n).split(/,/g);
                    regex = regex + "(";
                    temp.forEach(function(value,i) {
                        if (i > 0) {
                            regex = regex + "|";
                        }
                        regex = regex + glob2regex(value, flags);
                    });
                    i = i + n + 1;
                    break;
                }
                /* fall */
            case "}":
			case ".":
            case "/":
            case "]":
            case "(":
            case ")":
            case "^":
            case "$":
            case "+":
            case "-":
            case "|":
                regex = regex + "\\" + character;
                break;
            default:
                regex = regex + character;
                break;
        }
    }

    return returnString ? regex : new RegExp(regex, flags & Glob.CASEFOLD ? "i" : "");
}

/**
 *
 *
 *    @param Object ...args
 *    @returns Object
 */
function extend() {
    var target = arguments[0],
        name, current,
        i = 1,
        l = arguments.length;

    for (;i<l;++i) {
        current = arguments[i];
        for (name in current) {
            target[name] = current[name];
        }
    }

    return target;
}

/**
 *
 *    @constructor
 *    @param Object options - @see Glob.defaultOptions
 *    @returns Glob
 */
function Glob(options) {
    if (!(this instanceof Glob)) {
        return new Glob(options);
    }

    this.options = extend({}, Glob.defaultOptions, options || {});

    if (!this.options.sync) {
        this.initialize();
    }
}

// Set the Super Constructor
util.inherits(Glob, EventEmitter);

/**
 *    A distionary of the default options used by Glob
 *
 *    @const Object
 */
Object.defineProperty(Glob, "defaultOptions", {value: {

    /**
     *
     *
     *    @var Number
     */
    flags: 0,

    /**
     *
     *
     *    @var String
     */
    originalPattern: "",

    /**
     *
     *
     *    @var RegExp
     */
    pattern: /.*/,

    /**
     *
     *
     *    @var Boolean
     */
    sync: false,

    /**
     *
     *
     *    @var String
     */
    baseDir: "./",

    /**
     *
     *
     *    @var String
     */
    base: "",
}, configurable: false, writable: false});

// flags

/**
 *    Adds a slash to each directory returned
 *
 *    @const Number
 */
Object.defineProperty(Glob, "MARK", {value: 1, configurable: false, writable: false});

/**
 *    Return files as they appear in the directory (no sorting)
 *
 *    @const Number
 */
Object.defineProperty(Glob, "NOSORT", {value: 2, configurable: false, writable: false});

/**
 *    Return the search pattern if no files matching it were found
 *
 *    @const Number
 */
Object.defineProperty(Glob, "NOCHECK", {value: 4, configurable: false, writable: false});

/**
 *    Backslashes do not quote metacharacters
 *
 *    @const Number
 */
Object.defineProperty(Glob, "NOESCAPE", {value: 8, configurable: false, writable: false});

/**
 *    Expands {a,b,c} to match 'a', 'b', or 'c'
 *
 *    @const Number
 */
Object.defineProperty(Glob, "BRACE", {value: 16, configurable: false, writable: false});

/**
 *    Return only directory entries which match the pattern
 *
 *    @const Number
 */
Object.defineProperty(Glob, "ONLYDIR", {value: 32, configurable: false, writable: false});

/**
 *    Stop on read errors (like unreadable directories), by default errors are ignored.
 *
 *    @const Number
 */
Object.defineProperty(Glob, "ERR", {value: 64, configurable: false, writable: false});

/**
 *    caseless matching
 *
 *    @const Number
 */
Object.defineProperty(Glob, "CASEFOLD", {value: 128, configurable: false, writable: false});

/**
 *    Holds the options for the given instance of Glob
 *
 *    @var Object - @see Glob.defaultOptions
 */
Glob.prototype.options = Glob.defaultOptions;

/**
 *    Since the events occur asynchronously, we need to keep track
 *    of the cancelation of the request until all the callbacks have
 *    been satisfied
 *
 *    @var Boolean
 */
Glob.prototype.cancel = false;

/**
 *   Keep track of the number of open directories
 *   so that when it falls to zero (0), as well as
 *   pendingCalls falls to zero (0), we can emit an
 *   "end" event
 *
 *    @var Number
 */
Glob.prototype.openDirs = 0;

/**
 *   Keep track of the number of pending stat calls
 *   so that when it falls to zero (0), as well as
 *   openDirs falls to zero (0), we can emit an
 *   "end" event
 *
 *    @var Number
 */
Glob.prototype.pendingCallbacks = 0;

/**
 *    Initialize the request by making a special
 *    call to readdir using the seperate base and
 *    baseDir parameters
 *
 *    @returns Array | Boolean | null
 */
Glob.prototype.initialize = function() {
    var options = this.options,
        baseDir = options.baseDir,
        base = options.base;

    ++this.openDirs;

    if (options.sync) {
        try{
            return this.readdir(base, null, fs.readdirSync(baseDir));
        } catch(e) {
            this.error(e);
            return false;
        }
    }

    return fs.readdir(baseDir, this.readdir.bind(this, base));
};

/**
 *    Periodically, we need to check if there are
 *    still pending callbacks or open directories,
 *    if neither is greater than zero (0), we emit the
 *    "end" event
 *
 *    @returns null
 *    @emits Event "end"
 */
Glob.prototype.pending = function() {
    if (!this.options.sync && this.openDirs < 1 && this.pendingCallbacks < 1) {
        this.emit("end", this.options.pattern);
    }
    return null;
};

/**
 *    Handle an error from a readdir operation
 *
 *    @param Error err
 *    @returns null
 *    @throws Error
 *    @emits Event "error"
 */
Glob.prototype.error = function(err) {
    if (err) {
        if (!this.options.sync) {
            this.emit("error", err);
        }

        if (this.options.flags & Glob.ERR) {
            this.cancel = true;

            if (this.options.sync) {
                throw err;
            }
        }
    }
    return null;
};

/**
 *    Bound function that handles readdir operations
 *
 *    @param String dir
 *    @param Error err
 *    @param Array files
 *    @returns Array | null
 */
Glob.prototype.readdir = function(dir, err, files) {
	this.error(err);

	var i = 0,
        l = files && files.length || 0,
        name, temp,
        result = [],
        options = this.options,
        flags = options.flags,
        sync = options.sync,
        pattern = options.pattern,
        onlydir = (flags & Glob.ONLYDIR),
        mark = flags & Glob.MARK;



    for (;i<l;++i) {
        //exit early for cancelled request
		if (this.cancel) {
            return result;
        }

        name = dir && path.join(dir, files[i]) || files[i];

        if (pattern.test(name)) {
            // check for directory only limitation
			if (onlydir) {
                if (!sync) {
                    ++this.pendingCallbacks;
                    fs.stat(name, this.emitifdir.bind(this, name));
                } else {
                    try{
                        temp = fs.statSync(name);
                        if (temp && temp.isDirectory()) {
                            result.push(name + (mark ? "/" : ""));
                        }
                    }catch(e){}
                }
            } else if (sync) {
                // check for a mark end if directory limitation
				if (mark) {
                    try{
                        temp = fs.statSync(name);
                        result.push(name + (temp && temp.isDirectory() ? "/" : ""));
                    } catch(e) {
                        result.push(name);
                    }
                } else {
                    result.push(name);
                }
            } else {
                ++this.pendingCallbacks;
                fs.stat(name, this.markifdir.bind(this, name));
            }
        }

        temp = this.bindifdir(name);

        if (sync && temp && temp.length) {
            result.push.apply(result, temp);
        }
    }

    --this.openDirs;

    if (sync) {
        if (!this.openDirs && !(flags & Glob.NOSORT)) {
            result.sort();
        }

        return !this.openDirs && !result.length && (flags & Glob.NOCHECK) ? pattern : result;
    }

    return this.pending();
};

/**
 *    Emits a data event if the result of the stat is a directory
 *
 *    @param String name - name of the file/directory
 *    @param Error err -
 *    @param fs.Stat stat
 *    @returns null
 *    @emits Event "data"
 */
Glob.prototype.emitifdir = function(name, err, stat) {
    if (!this.options.sync) {
        --this.pendingCallbacks;
    }

    if (!this.cancel && stat && stat.isDirectory()) {
        this.emit("data", name + (this.options.flags & Glob.MARK ? "/" : ""));
    }

    return this.pending();
};

/**
 *    Emits a data event for the file, and appends a "/" if the file is a directory
 *
 *    @param String name - name of the file/directory
 *    @param Error err -
 *    @param fs.Stat stat
 *    @returns null
 *    @emits Event "data"
 */
Glob.prototype.markifdir = function(name, err, stat) {
    if (!this.options.sync) {
        --this.pendingCallbacks;
    }

    if (!this.cancel) {
        this.emit("data", name + (stat && stat.isDirectory() ? "/" : ""));
    }

    return this.pending();
};

/**
 *    Binds a stat call for a filename to bindonstat
 *
 *    @param String dir
 *    @returns Array | Boolean | null
 */
Glob.prototype.bindifdir = function(dir) {
    if (!this.cancel) {
        if (this.options.sync) {
            try{
                return this.bindonstat(dir, null, fs.statSync(dir));
            } catch (e) {}
        } else {
            ++this.pendingCallbacks;
            return fs.stat(dir, this.bindonstat.bind(this, dir));
        }
    }
    return false;
};

/**
 *    Binds a filename for reading if the file is a directory
 *
 *    @param String dir
 *    @param Error err
 *    @param Stat stat
 *    @returns Array | Boolean | null
 */
Glob.prototype.bindonstat = function(dir, err, stat) {
    if (!this.options.sync) {
        --this.pendingCallbacks;
    }

    if (!this.cancel && stat && stat.isDirectory()) {
        return this.binddir(dir);
    }

    return this.pending();
};

/**
 *    Binds a directory for readdir
 *
 *    @param String dir
 *    @returns Array | Boolean | null
 */
Glob.prototype.binddir = function(dir) {
    if (this.cancel) return;
    ++this.openDirs;
    try{
        return this.options.sync ?
                this.readdir(dir, null, fs.readdirSync(dir)) :
                fs.readdir(dir, this.readdir.bind(this, dir));
    } catch(e) {
        --this.openDirs;
        this.error(e);
        return false;
    }
};

exports.Glob = Glob;
exports.glob = glob;
exports.globSync = globSync;
exports.globRegExp = globRegExp;
exports.globRegExpSync = globRegExpSync;
exports.glob2regex = glob2regex;
exports.glob2dir = glob2dir;