/**
 * Asynchronous recursive copy, with exclusions.
 * 
 * The Cprf object takes an array of source files and glob patterns to match.
 * file names and expanded glob lists are started immediately (before the glob
 * matching is finished), recursive discovery of files also happens
 * asynchronously.
 * 
 * Everything is Async basically.
 * 
 * Example:
 * 
 * var myCopy = new Cprf([FILE, GLOB...], DIR | FILE, Callback, { 
 *      recursive : true,
 *      excludes  : ['FILE']
 * });
 * 
 */

var events = require('events'),
    util   = require('util'),
    fs     = require('fs'),
    path   = require('path'),
    mkdirp = require('mkdirp').mkdirp,
    glob   = require('glob');

// Node.js Copy (https://github.com/piscis)
// 
// Forked into here to support automatic directory creation on the destination.

var Copy = function copy(src, dst, callback) {
  var self = this;

  if(!callback) {
      callback = function(){};
  }

  self.on('error', function(err) {
      callback(err);
  });

  self.on('validate', function() {     
      self.emit('validate_source');
      
      // validate:source
      // validate:dest
      // validate:files
  });
  
  self.on('validate_source', function() {
      
      path.exists(src, function(src_exists) {
          if(!src_exists) {
              self.emit('error', new Error(src + ' does not exist. Nothing to be copied'));
              return;
          }
          
          self.emit('validate_dest');
      });
  });
  
  self.on('validate_dest', function() {
      path.exists(path.dirname(dst), function(dst_exists) {
//          console.log('Destination directory does not exist, creating...');
          if (!dst_exists) {
              // mkdirp refuses to use relative paths
              var pathAbs = path.resolve(path.dirname(dst));
              
              mkdirp(pathAbs, 0755, function(err) {
                  if (err) {
                      self.emit('error', err);
                      return;
                  }

                  self.emit('validate_files');
              });
          } else {
              self.emit('validate_files');
          }
      });
  });
  
  self.on('validate_files', function() {
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
    
    self.emit('done', src, dst);
  });

  self.emit('validate');
};

util.inherits(Copy, events.EventEmitter);
   
exports.copy = function(src, dst, callback) {
  return new Copy(src, dst, callback);
};

// My own cprf object

function Cprf(sources, destination, callback, options) {
    var self = this;
    // Array of operations pending
    // 
    // Format? Needs a GUID if we consider two copy operations
    // with the same parameters as a valid thing, but its not
    // because I said so.
    this._pendingOperations = [];
    
    //events.EventEmitter.call(this);
    this._callback = callback = callback || function(){};
    this._options = options = options || { excludes: [], recursive: false };
    
    self.on('error', function(err) {
       callback(err); 
    });
    
    self.on('warning', function(warning) {
       console.log('warning: ' + warning); 
    });
    
    self.on('info', function(info) {
       console.log('info: ' + info); 
    });
    
    self.on('pending', function() {
       console.log('pending: ' + self._pendingOperations.length + ' operation(s)');
    });
    
    self.on('taskdone', function() {
       if (self._pendingOperations.length == 0) {
           self.emit('batchdone');
           callback();
       } 
    });
    
    // The parser found a valid thing to copy, start copying it regardless
    // of the parser being finished
    self.on('add', function(fs_items, dest) {
        //console.log('event:add src:' + fs_items + ' dest:' + dest);
        
        fs_items.forEach(function eachFile(fs_item) {
            
            if (self.isNotExcluded(fs_item)) {
                
                fs.stat(fs_item, function callbackStat(err, stat) {
                       if (err) { 
                           self.emit('warning', err);
                           return; 
                       }

                       if (stat.isDirectory()) {
                           self.emit('info', 'traversing ' + fs_item);
                           
                           fs.readdir(fs_item, function(err, files) {
                              var appendDir = function appendDir(child) {
                                  return path.join(fs_item, child);
                              };

                              if (err) { 
                                  self.emit('warning', err);
                                  return;
                              }

                              if (files.length > 0) {
                                self.emit('info', 'adding (globbed) files: ' + files.join(','));
                                self.emit('add', files.map(appendDir), path.join(dest, path.basename(fs_item)));
                              }
                           });
                       } else {
                           self.emit('info', 'copy ' + fs_item + ' ' + dest);
                           self.emit('copy', fs_item, path.join(dest, path.basename(fs_item)));
                       }
                 });
            } else {
                self.emit('info', 'excluded ' + fs_item);
            }
        });
    });
    
    self.on('copy', function(source, destination) {
       self.emit('info', 'start ' + source + ' ' + destination);
       self._pendingOperations.push(source+'>'+destination); // Cant use an object reference, it copies and exits before adding the operation

       
       var op = new Copy(source, destination, function onCopied(err) {
           if (err) {
               self.emit('error', err);
           }
           
           self._pendingOperations.splice(self._pendingOperations.indexOf(source+'>'+destination), 1);
           self.emit('pending');
           self.emit('taskdone');
           self.emit('info', 'done ' + source + ' ' + destination);
       });
       
       self.emit('pending');
    });

    this.parse(sources, destination);
};

util.inherits(Cprf, events.EventEmitter);

console.log(Cprf.prototype.emit);

Cprf.prototype.isNotExcluded = function isNotExcluded(filename) {
    return (this._options.excludes.indexOf(filename) === -1);
};

// Parse an array of filenames and file globs, and expand the globs into
// individual entries
Cprf.prototype.parse = function parse(sources, destination) {
        var self = this,
            isNotExcluded = function isNotExcluded(filename) {
                return (self._options.excludes.indexOf(filename) === -1);
            };
        
        sources.forEach(function(item) {

            // Generate listing of files to copy
            if (/[?*\[]/.test(item)) {
                glob.glob(item, null, function(err, matches) {
                   if (err) {
                       self.emit('warning', err);
                       return; 
                   } // Glob matching failure is discarded

                   var filteredMatches = matches.filter(isNotExcluded);
                   
                   self.emit('info', 'Adding (glob matches): ' + filteredMatches.join(','));                   
                   self.emit('add', filteredMatches, destination);
                });
            } else {
                if (isNotExcluded(item)) {
                    self.emit('info', 'Adding: ' + item);
                    self.emit('add', [item], destination);
                }
            }

        }, this);
        
        this.emit('parseDone');    
};

// Public API
exports.cprf = function cprf(sources, destination, callback, options) {
    return new(Cprf)(sources, destination, callback, options);
};