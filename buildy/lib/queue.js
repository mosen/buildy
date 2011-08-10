var util = require('util'),
    events = require('events');

function Queue(name) {
    events.EventEmitter.call(this);

    this._name = name;
    this._queue = [];
    this._queuePosition = 0;
}

util.inherits(Queue, events.EventEmitter);

// Prototypical properties that were removed due to the way util.inherits behaves
// Left here for reference.

//     /**
//     * Name of the task queue
//     * 
//     * @property _name
//     * @default 'queue'
//     */
//    _name : 'queue',
//    
//    /**
//     * Stack of calling queues
//     * 
//     * @property _queueStack
//     * @default undefined
//     */
//    _queueStack : undefined,
//    
//    /**
//     * Queued tasks
//     * 
//     * @property _queue
//     * @default undefined
//     */
//    _queue : undefined,
//    
//    /**
//     * Queue position
//     * 
//     * @property _queuePosition
//     * @default 0
//     */
//    _queuePosition : 0,
//    
//    /**
//     * Queue runner
//     * 
//     * @property _runner
//     * @default null
//     */
//    _runner : null,
//    
//    /**
//     * EventEmitter given to the runner which will
//     * emit complete or failed
//     * 
//     * @property _promise
//     * @default null
//     */
//    _promise : null,


/**
 * Add a task to the queue
 * 
 * @method task
 * @param type {string} a valid task type
 * @param spec {object} valid specification for that task type
 * @public
 */
Queue.prototype.task = function(type, spec) {
    this._queue.push({ type: type, spec: spec });
    return this;
};

/**
 * Run the task queue
 * 
 * The runner keeps the input and output
 * 
 * @method run
 * @param runner {object} An object which will accept a function signature
 * of .exec(type, spec, promise)
 * @public
 */
Queue.prototype.run = function(runner) {
    var t    = this._queue[this._queuePosition],
        self = this;

    this._promise = new events.EventEmitter;
    this._promise.on('complete', function handleComplete() { self._onTaskComplete.apply(self, arguments); });
    this._promise.on('failed', function handleFailed() { self._onTaskFailed.apply(self, arguments); });

    this._runner = runner;
    // TODO: create reporter that watches Queue events.
    //console.log('f:' + this._name + ' t:' + this._queuePosition + ' type=' + t.type + ' executing...');
    this._runner.exec(t.type, t.spec, this._promise);
};
    
/**
 * Called after a task completes
 * 
 * Receives arguments supplied by the Buildy task
 * 
 * @method _onTaskComplete
 * @param result {Object} Task results
 * @protected
 */
Queue.prototype._onTaskComplete = function(result) {

    this.emit('taskComplete', { task: this._queue[this._queuePosition], result: result });
    this._queuePosition++;

    if (this._queuePosition < this._queue.length) {
        this.run(this._runner);
    } else {
        this.emit('complete');
    }
};
    
/**
 * Called after a task fails
 * 
 * Receives arguments supplied by Buildy task, at the
 * moment only an error message is passed back.
 * 
 * @method _onTaskFailed
 * @param result {String} Error message
 * @protected
 */
Queue.prototype._onTaskFailed = function(result) {
    this.emit('taskFailed', { result: result });
};


exports.Queue = Queue;