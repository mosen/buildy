// Report events that occur when the Queue is run.
var events = require('events'),
    util   = require('util'),
    color  = require('color.js');
    
var result = {
    "good" : "✔",
    "bad" : "✖"
};

var sep = " ➔ ";


function logStack(q) {
    return q.join(']' + sep + '[');
}

function Reporter() {
    events.EventEmitter.constructor.call(this);
}

util.inherits(Reporter, events.EventEmitter);

/**
 * Attach the reporter to a Queue object
 * 
 * @method attach
 * @param q {Queue} Buildy queue
 */
Reporter.prototype.attach = function(q) {
  if (q.on) {
      q.on('taskStarted', this._onTaskStarted);
      q.on('taskComplete', this._onTaskComplete);
      q.on('taskFailed', this._onTaskFailed);
      q.on('queueComplete', this._onQueueComplete);
  } else {
      console.log('queue doesnt seem to be an emitter.');
  }
};

Reporter.prototype._onTaskStarted = function(taskinfo) {
//    console.log(color.codes.bold('[' + taskinfo.queue + ']') + sep + taskinfo.type);
    //console.log(taskinfo.stack);
    //console.log('queue:' + taskinfo.queue + ' #' + taskinfo.position + ' type=' + taskinfo.type + ' executing...');
};

Reporter.prototype._onTaskComplete = function(taskinfo) {
    var taskresult = "";
    
    if (taskinfo.result !== undefined) {
        taskresult = "\n\t(" + taskinfo.result + ")";
    }
    //console.log('queue:' + taskinfo.queue + ' ' + taskinfo.task.type + ' complete!');
    
    console.log(color.codes.bold('[' + taskinfo.queue + ']') + sep + color.codes.green(taskinfo.task.type + " " + result['good']) + taskresult);
};

Reporter.prototype._onTaskFailed = function(taskinfo) {
    console.log(color.codes.red("\t" + result['bad'] + " " + taskinfo.task.type));
};

Reporter.prototype._onQueueComplete = function(taskinfo) {
    console.log(color.codes.bold('[' + taskinfo.queue + ']') + ' finished.');
};

exports.Reporter = Reporter;