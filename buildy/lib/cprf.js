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
    
    var self = this; // Necessary to correct scope inside async functions without using .call .apply
    events.EventEmitter.call(this);

    /**
     * List of copy operations pending.
     *
     * @property _pendingOperations
     * @type {Array}
     */
    this._pendingOperations = [];
    
    /**
     * Callback executed on completion.
     * 
     * @property _callback
     * @type {Function}
     */
    this._callback = callback = callback || function(){};
    
    /**
     * Options
     * 
     * excludes : [], An array of path and filename exclusions, these will not be copied.
     * recursive : true | false, Whether to traverse subdirectories when copying.
     * 
     * @property _options
     * @type {Object}
     */
    this._options = options = options || { excludes: [], recursive: false };
    
    /**
     * Error event
     * 
     * @event error
     * @param err {Error} Error object
     */
    self.on('error', function(err) {
       callback(err); 
    });
    
    // Logging events
    // TODO: remove and replace with interesting events for the code instantiating this.
    
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
//    self.on('add', function(fs_items, dest) {
//        //console.log('event:add src:' + fs_items + ' dest:' + dest);
//        
//        fs_items.forEach(function eachFile(fs_item) {
//            
//            if (self.isNotExcluded(fs_item)) {
//                
//                fs.stat(fs_item, function callbackStat(err, stat) {
//                       if (err) { 
//                           self.emit('warning', err);
//                           return; 
//                       }
//
//                       if (stat.isDirectory()) {
//                           self.emit('info', 'traversing ' + fs_item);
//                           
//                           fs.readdir(fs_item, function(err, files) {
//                              var appendDir = function appendDir(child) {
//                                  return path.join(fs_item, child);
//                              };
//
//                              if (err) { 
//                                  self.emit('warning', err);
//                                  return;
//                              }
//
//                              if (files.length > 0) {
//                                self.emit('info', 'adding (globbed) files: ' + files.join(','));
//                                self.emit('add', files.map(appendDir), path.join(dest, path.basename(fs_item)));
//                              }
//                           });
//                       } else {
//                           self.emit('info', 'copy ' + fs_item + ' ' + dest);
//                           self.emit('copy', fs_item, path.join(dest, path.basename(fs_item)));
//                       }
//                 });
//            } else {
//                self.emit('info', 'excluded ' + fs_item);
//            }
//        });
//    });
    
//    self.on('copy', function(source, destination) {
//       self.emit('info', 'start ' + source + ' ' + destination);
//       self._pendingOperations.push(source+'>'+destination); // Cant use an object reference, it copies and exits before adding the operation
//
//       
//       var op = new Copy(source, destination, function onCopied(err) {
//           if (err) {
//               self.emit('error', err);
//           }
//           
//           self._pendingOperations.splice(self._pendingOperations.indexOf(source+'>'+destination), 1);
//           self.emit('pending');
//           self.emit('taskdone');
//           self.emit('info', 'done ' + source + ' ' + destination);
//       });
//       
//       self.emit('pending');
//    });

//    this.parse(sources, destination);
};

util.inherits(Cprf, events.EventEmitter);

/**
* Check a file or directory against the exclusion list, used with Array.map
* 
* @method isNotExcluded
* @param filename {String} File or directory name
* @return {Boolean} true if the file does NOT exist in the exclusion list
*/
Cprf.prototype.isNotExcluded = function isNotExcluded(filename) {
    return (this._options.excludes.indexOf(filename) === -1);
};

/**
 * Parse a list of source files, directories and globs and add copy tasks for
 * each to the given destination.
 * 
 * @todo make sure single file copy works here
 * @method parse
 * @param sources {Array} filenames, directories and globs/wildcards
 * @param destination {String} destination directory
 */
Cprf.prototype.parse = function parse(sources, destination) {
        var self = this,
            isNotExcluded = this.isNotExcluded;
        
        sources.forEach(function(item) {

            // Generate listing of files to copy
            if (/[?*\[]/.test(item)) {
                glob.glob(item, null, function(err, matches) {
                   if (err) {
                       self.emit('warning', err);
                       return; 
                   } // Glob matching failure is just discarded

                   var filteredMatches = matches.filter(isNotExcluded);
                   
                   /**
                    * @event globMatched
                    * @param item {String} Glob that was matched
                    * @param filteredMatches {Array} Array of matches to the glob
                    */
                   self.emit('globMatched', item, filteredMatches);                   
                   self.add(filteredMatches, destination);
                });
            } else {
                if (isNotExcluded(item)) {
                    this.add([item], destination);
                }
            }

        }, this);
        
        // TODO: does not take into account async globs returning late
        /**
         * @event parseDone
         */
        this.emit('parseDone');    
};

/**
 * Add a file or directory to the copy queue.
 * 
 * @todo Check that destination can be single file
 * 
 * @method add
 * @param fs_items {Array} Array of source dirs and files.
 * @param dest {String} Destination directory
 */
Cprf.prototype.add = function add(fs_items, dest) {
    var self = this;
    
    fs_items.forEach(function eachFile(fs_item) {
        if (self.isNotExcluded(fs_item)) {
            fs.stat(fs_item, function callbackStat(err, stat) {
                   if (err) { // If we cant even stat, just disregard the file with warning.
                       return self.emit('warning', err);
                   }

                   if (stat.isDirectory()) {
                       /**
                        * @event traversed
                        * @param {String} fs_item Directory being traversed
                        */
                       self.emit('traversed', fs_item);

                       fs.readdir(fs_item, function(err, files) {
                          var appendDir = function appendDir(child) {
                              return path.join(fs_item, child);
                          };

                          if (err) { 
                              return self.emit('warning', err);
                          }

                          if (files.length > 0) {
                              self.add(files.map(appendDir), path.join(dest, path.basename(fs_item)));
                          }
                          // TODO: consider mkdir even on empty dirs?
                       });
                   } else {
                       this.copy(fs_item, path.join(dest, path.basename(fs_item)));
                   }
             });
        } else {
            /**
             * @event excluded
             * @param {String} fs_item Directory or file that was excluded
             */
            self.emit('excluded', fs_item);
        }
    });    
};

/**
 * Copy a single item from source to destination
 * 
 * @method copy
 * @param source {String} absolute filename of source
 * @param destination {String} absolute filename of destination
 */
Cprf.prototype.copy = function copy(source, destination) {

       var copyPromise = new events.EventEmitter();
       copyPromise.on('complete', this._onTaskComplete.apply(this, [true, copyPromise, source, destination]));
       copyPromise.on('failed', this._onTaskComplete.apply(this, [false, copyPromise, source, destination]))
       
       this._pendingOperations.push(copyPromise);

       /**
        * @event fileStart
        * @param source {String} absolute filename
        * @param destination {String} absolute filename
        */
       this.emit('fileStart', source, destination);

       var operation = new Copy(source, destination, function onCopied(err) {
           if (err) {
               copyPromise.emit('failed', err);
           }
           
           copyPromise.emit('complete');
       });   
};

/**
 * Handle the completion of a copy task by removing it from the queue
 * 
 * @method _onTaskComplete
 * @param status {Boolean} Whether the copy task completed or failed. true|false
 * @param promise {EventEmitter} copy task promise that has fired complete.
 * @param source {String} Absolute path to source file
 * @param destination {String} Absolute path to destination file
 * @protected
 */
Cprf.prototype._onTaskComplete = function _onTaskComplete(status, promise, source, destination) {
    this._pendingOperations.splice(this._pendingOperations.indexOf(promise), 1);
    
    /**
     * @event fileComplete
     * @param source {String} absolute filename
     * @param destination {String} absolute filename
     */
    this.emit('fileComplete', source, destination);
    this._checkOperationsDone();
};

/**
 * Check if all of the pending operations have finished.
 * 
 * @method _checkOperationsDone
 */
Cprf.prototype._checkOperationsDone = function _checkOperationsDone() {
    var numOperations = this._pendingOperations.length;
    
    /**
     * @event operationCount
     * @param numOperations {Integer} number of operations pending
     */
    this.emit('operationCount', numOperations);
    
    if (numOperations === 0) {
        this.emit('complete');
        this._callback();
    }
};

/**
 * Copy a list of sources to a destination
 * 
 * @method cprf
 * @param sources {Array} Array of filenames, directories, and glob patterns.
 * @param destination {String} Destination directory
 * @param options {Object} Hash of copy options
 * @return {Cprf} Cprf object which emits events at various stage through the copy process.
 * @public
 * @static
 */
exports.cprf = function cprf(sources, destination, callback, options) {
    var cprf = new(Cprf)(sources, destination, callback, options);
    cprf.parse(sources, destination);
    
    return cprf;
};