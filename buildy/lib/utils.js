/**
 * Utility functions called by the buildy build system.
 */
var sys = require('sys'),
    fs = require('fs'),
    path = require('path'),
    events = require('events');

/**
 * Concatenate one or more files to a destination file or string.
 * 
 * @param dest null|String String will be returned if null, or written to the specified filename.
 * @param sourcefiles Array of files to read and concatenate.
 * @param source file encoding (default utf8)
 */
exports.concatSync = function(dest, sourcefiles, format) {
    var i = 0,
        content = '',
        format = format || 'utf8';
    
    for (; i < sourcefiles.length; i++) {
        content += fs.readFileSync(sourcefiles[i], format) || '';
    }
    
    if (dest === null) {
        return content;
    } else {
        fs.writeFileSync(dest, content, format);
    }
}

/**
 * Append one or more files to a specified file.
 * 
 * @param dest String filename of the file to append.
 * @param appendfiles Array of files to append
 */
exports.appendSync = function(dest, appendfiles, format) {
    
}

/**
 * Apply a template to an object, and write the output to a file, or return the string.
 * 
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
        console.error('applyTemplate requires Mustache to be installed (npm install mustache)');
    }
    
    if (dest === null) {
        return Mustache.to_html(templateContent, o);
    } else {
        fs.writeFileSync(dest, Mustache.to_html(templateContent, o));
    }
}

/**
 * Run JSLint|JSHint on a string or file.
 * 
 * @param o {Object} Object containing properties .source | .sourceFile, string or file to lint respectively.
 * @param lintopts {Object} JSLint configuration options
 * @param callback {Function} Callback function when lint has finished.
 */
exports.lint = function(o, lintopts, callback) {
    
    var linter = require('jslint/lib/linter.js'),
        reporter = require('jslint/lib/reporter.js'),
        opts = lintopts || {},
        result;

    if (o.source && o.source.length > 0) {
        result = linter.lint(o.source, opts);
        callback(result);
    } else if (o.sourceFile && o.sourceFile.length > 0) {
        fs.readFile(o.sourceFile, 'utf8', function(err, data) {
           
           if (err) {
               throw err;
           } 
           
           data = data.toString('utf8');
          
           result = linter.lint(data, opts);
           reporter.report(o.sourceFile, result);
           callback(result);
        });
    } else {
        callback();
    }
}

/**
 * Minify a source file or string to a destination file or string
 * 
 * @param o {Object} Object containing at least one source property:
 * { source: 'String' || sourceFile: 'Filename.js', destFile: 'Filename.js' || no destination returns string value }
 */
exports.minifySync = function(o) {
    if (!(o.source || o.sourceFile)) {
        throw 'No source specified';
    } else {
        if (o.sourceFile) {
            o.source = fs.readFileSync(o.sourceFile, 'utf8');
        }
        
        var jsp = require("uglify-js").parser,
            pro = require("uglify-js").uglify,
            ast;

        try {
            ast = jsp.parse(o.source); // parse into syntax tree
            ast = pro.ast_mangle(ast);
            ast = pro.ast_squeeze(ast);
        } catch (e) {
            console.log(e.stack);
            fail('The minify task failed, most likely the source file was unparseable. Please check your syntax. Error: ' + e.message);
        }
       
        if (!o.destFile) {
            return pro.gen_code(ast);
        } else {
            fs.writeFileSync(o.destFile, pro.gen_code(ast), 'utf8');
        }
    }
}

/**
 * Minify the input
 * 
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
            console.log(e.stack);
            throw Error('The minify task failed, most likely the source file was unparseable. Please check your syntax. Error: ' + e.message);
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
}

/**
 * CSSLint source file
 * 
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
}

/*
 * Minify a css source file or string to a destination file or string
 * 
 * @param o {Object} Object containing at least one source property:
 * { source: 'String' || sourceFile: 'Filename.js', destFile: 'Filename.js' || no destination returns string value }
 */
exports.cssMinify = function(o, callback) {
    var less = require('less'),
        lessParser = new less.Parser;
        
    if (!(o.source || o.sourceFile)) {
        throw 'No source specified';
        
    } else {
        if (o.sourceFile) {
            o.source = fs.readFileSync(o.sourceFile, 'utf8');
        }

        lessParser.parse(o.source, function(err, tree) {
           var cssCompressed = tree.toCSS({ compress: true });
           
           if (err) {
               throw err;
           }

           if (o.destFile) {
               console.log(cssCompressed);
               console.log('Writing to ' + o.destFile);
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
}

//https://raw.github.com/piscis/fsext/master/lib/copy.js
// All credit goes to github user piscis, I had to merge a few modules here rather
// than create quite a few dependencies.

// Copy object, which encapsulates copy events / asynchronous operations
var Copy = function copy(src, dst, callback) {
  var self = this;

  if(!callback) {
    callback = function(){};
  }

  self.on('error', function(err) {
    callback(err);
  });

  self.on('validations', function() {

    path.exists(src, function(exists) {

      if(!exists) {

        self.emit('error', new Error(src + ' does not exists. Nothing to be copied'));
        return;
      }

      fs.stat(src, function(err, stat) {

        if(err) {

          self.emit('error', err);
          return;
        }

        if(stat.isDirectory()) {

          self.emit('error', new Error(src + ' is a directory. It must be a file'));
          return;
        }

        if(src == dst) {

          self.emit('error', new Error(src + ' and ' + dst + 'are identical'));
          return;
        }

        self.emit('open_infd');
      });
    });
  });

  self.on('open_infd', function() {

    fs.open(src, 'r', function(err, infd) {

      if(err) {

        self.emit('error', err);
        return;
      }

      self.emit('open_outfd', infd);
    });

  });

  self.on('open_outfd', function(infd) {

    fs.open(dst, 'w', function(err, outfd) {

      if(err) {

        self.emit('error', err);
        return;
      }

      self.emit('sendfile', infd, outfd);
    });
  });

  self.on('sendfile', function(infd, outfd) {

    fs.fstat(infd, function(err, stat) {

      if(err) {

        self.emit('error', err);
        return;
      }
      
      fs.sendfile(outfd, infd, 0, stat.size, function() {

        self.emit('close_fds', infd, outfd);
        callback();
      });
    });
  });

  self.on('close_fds', function(infd, outfd) {

    fs.close(infd, function(err) {

      if(err) {
        self.emit('error', err);
      }

    });

    fs.close(outfd, function(err) {

      if(err) {

        self.emit('error', err);
      }

    });
  });

  self.emit('validations');
};

sys.inherits(Copy, events.EventEmitter);
   
exports.copy = function(src, dst, callback) {

  return new Copy(src, dst, callback);
  
};

exports.copySync = function copySync(src, dst) {
 
  if(typeof dst == 'undefined') {
    throw new Error('Destination is not defined');
  } 

  if(!path.existsSync(src)) {

    throw new Error(src + ' does not exists.');
  }

  if(fs.statSync(src).isDirectory()) {

    throw new Error(src + ' is a directory. It must be a file');
  }

  if(src == dst) {

    throw new Error(src + ' and ' + dst + 'are identical');
  }

  var infd = fs.openSync(src, 'r');
  var size = fs.fstatSync(infd).size;
  var outfd = fs.openSync(dst, 'w');

  fs.sendfileSync(outfd, infd, 0, size);

  fs.close(infd);
  fs.close(outfd);
};
