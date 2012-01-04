/* The Queue object describes a plan to execute a series of tasks.
 *
 * Each queue is assigned a name so that the log can have some meaningful output, and debugging can be traced back
 * to the responsible object.
 */

var util = require('util'),
    events = require('events'),
    Registry  = require('buildy/lib/registry'),
    State = require('buildy/lib/state'),
    defaultLogger = require('./logger').defaultLogger;

function Queue(name, options) {
    events.EventEmitter.call(this);

    options = options || {}; // If no options were specified then options becomes an empty object.

    /**
     * Name of the task queue
     *
     * @property _name
     * @default none
     */
    this._name = name;

    /**
     * Queued tasks
     *
     * @property _queue
     * @default array
     */
    this._queue = [];

    /**
     * Queue position
     *
     * @property _queuePosition
     * @default 0
     */
    this._queuePosition = 0;

    /**
     * Stack of calling queues
     *
     * @property _queueStack
     * @default array
     */
    this._queueStack = [];

    /**
     * Logger instance
     *
     * @property _logger
     * @default buildy supplied logger (winston)
     */
    this._logger = options.logger || defaultLogger;

    /**
     * Task registry
     *
     * @property _registry
     * @default instance of registry with default paths.
     */
    this._registry = options.registry || new Registry();

    /**
     * State object that is passed between queue tasks.
     *
     * @property _state
     * @default empty state.
     */
    this._state = options.state || new State();

//
//    /**
//     * EventEmitter given to the runner which will
//     * emit complete or failed
//     *
//     * @property _promise
//     * @default null
//     */
//    _promise : null,

}

util.inherits(Queue, events.EventEmitter);

/**
 * Add a task to the queue
 * 
 * @method task
 * @param type {string} a valid task type
 * @param spec {object} valid specification for that task type (see the task docs)
 * @return Queue a reference to the same Queue object.
 * @public
 */
Queue.prototype.task = function(type, spec) {
    this._queue.push({type: type, spec: spec});
    return this;
};

/**
 * Fork the current Queue into multiple Queues
 * 
 * Each function receives one parameter, the child Buildy object.
 * Each function is also executed in the context of a new Queue object. so
 * new tasks must begin with this.task('abc')
 * 
 * @method _fork
 * @param forkspec {Object} Hash of forked queue name => function
 * @protected
 */
Queue.prototype._fork = function(forkspec) {

    var self = this;

    Object.keys(forkspec).forEach(function eachFork(queue_name) {
        var q = new Queue(queue_name, {
            registry: self._registry,
            state: new State().fromState(self._state)
        });
        
        q._queueStack.push(self._name);
        //q._queueStack.push.apply(q._queueStack, self._queueStack);
        forkspec[queue_name].call(q); // Execute the next fork in the context of the child queue.
    });
};

/**
 * Run the current task queue
 * 
 * The runner keeps the input and output states for each task that is executed.
 * 
 * @method run
 * @param runner {object} An object which will accept a function signature
 * of .exec(type, spec, promise), normally this is a Buildy object
 * @public
 */
Queue.prototype.run = function() {
    var t    = this._queue[this._queuePosition],
        self = this;

    this.emit('queueStarted', {
        queue : this._name
    });

    this._logger.log('task', '[' + this._name + '] Started');

    if (t.type === 'fork') {
        this._fork(t.spec);

    } else {
    
        this._promise = new events.EventEmitter;
        this._promise.on('complete', function handleComplete() {
            self._onTaskComplete.apply(self, arguments);
        });
        this._promise.on('failed', function handleFailed() {
            self._onTaskFailed.apply(self, arguments);
        });

        if (t === undefined) {
            throw new Error('Task ' + t + ' is undefined');
        }

        this.emit('taskStarted', {
           queue : this._name,
           stack : this._queueStack,
           position : this._queuePosition,
           type : t.type
        });
        this._logger.log('info', '[' + t.type + '] Started');
        this._logger.log('debug', '[' + t.type + '] DEBUG:', {
           queue : this._name,
           stack : this._queueStack.toString(),
           position : this._queuePosition,
           type : t.type
        }); // TODO: dry

        this._exec(t.type, t.spec, this._promise);
    }
};


/**
 * Execute a task using this queue.
 * This method is normally invoked from the Queue object.
 *
 * The task type must exist in the registry referred to by _registry.
 *
 * @method _exec
 * @param type {String} Type of task to execute
 * @param spec {Object} Options/Parameters to pass to the task
 * @param promise {EventEmitter} emitter that will emit ('complete' or
 * 'failed') upon result
 * @private
 */
Queue.prototype._exec = function(type, spec, promise) {
    if (this._registry.taskExists(type)) {
        this._registry.task(type).apply(this, [spec, promise]);
    } else {
        promise.emit('failed', 'No such task exists: ' + type);
    }
};

/**
 * Move to the next task in the queue, or emit queueComplete if finished.
 *
 * @method next
 * @public
 */
Queue.prototype.next = function() {
    
    this._queuePosition++;

    if (this._queuePosition < this._queue.length) {
        this.run(this._runner);
    } else {
        this.emit('queueComplete', {
            queue : this._name
        });
        this._logger.log('task', '[' + this._name + '] Complete.');
    }    
};
    
/**
 * Called after a task completes
 * 
 * Receives arguments supplied by the Buildy task
 * TODO: tasks can currently fire the complete event multiple times, resulting in an exception here.
 * 
 * @method _onTaskComplete
 * @param result {Object} Task results
 * @protected
 */
Queue.prototype._onTaskComplete = function(result) {

    this.emit('taskComplete', {
        queue : this._name,
        task : this._queue[this._queuePosition], 
        result : result 
    });
    this._logger.log('info', '[' + this._name + '][' + this._queue[this._queuePosition].type + '] Task complete');
    
    this.next();
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
Queue.prototype._onTaskFailed = function(name, result) {

    this.emit('taskFailed', {
        queue : this._name,
        task : this._queue[this._queuePosition],
        result: result 
    });

    this._logger.log('info', '[' + this._name + '][' + this._queue[this._queuePosition].type + '] failed: ' + result);

    this.emit('queueFailed', {
        queue : this._name,
        task : this._queue[this._queuePosition],
        result: result
    });
};

exports.Queue = Queue;