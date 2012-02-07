/* The Queue object describes a plan to execute a series of tasks.
 *
 * Each queue is assigned a name so that the log can have some meaningful output, and debugging can be traced back
 * to the responsible object.
 *
 * The Queue object also holds instances of other buildy objects:
 * - registry: the task registry where different 3rd party tasks are dynamically loaded.
 * - state: the object that will carry the output state all the way through the queue chain.
 * - logger: the logger that will respond to any kind of status message
 * - status: the emitter object that hands control over to the task, and takes it back when complete.
 * (TODO rename status to StatusEmitter)
 */

var util = require('util'),
    events = require('events'),
    winston = require('winston'),
    Registry  = require('buildy/lib/registry'),
    State = require('buildy/lib/state');

var Queue = module.exports = function Queue(name, options) {
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
     * @default buildy supplied logger (winston) with console output only.
     */
    this._logger = options.logger || new (winston.Logger)({
        transports: [
            new (winston.transports.Console)()
        ]
    });

    /**
     * Log output from specified task types.
     *
     * This is a very general way to control logging, by only
     * filtering the types of tasks that might be important for the output.
     *
     * @property _logByTypes
     * @default { "write" : true }
     */
    this._logByTypes = {
        "write" : true
    };

    /**
     * Task registry
     *
     * @property _registry
     * @default instance of registry with default paths.
     */
    this.registry = options.registry || new Registry();

    /**
     * State object that is passed between queue tasks.
     *
     * @property _state
     * @default empty state.
     */
    this._state = options.state || new State();

};

util.inherits(Queue, events.EventEmitter);

/**
 * Add a task to the queue
 * 
 * @method task
 * @param type {string} a valid task type
 * @param params {object} valid paramsification for that task type (see the task docs)
 * @return Queue a reference to the same Queue object.
 * @public
 */
Queue.prototype.task = function(type, params) {
    this._queue.push({type: type, spec: params});
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

    var self = this,
        forks = [];

    this._logger.log('verbose', '[fork] creating fork(s)...');

    Object.keys(forkspec).forEach(function eachFork(queue_name) {
        var clonedState = new State(),
            q = new Queue(queue_name, {
                registry: self.registry,
                state: clonedState,
                logger: self._logger
            });

        clonedState.fromState(self._state);

        self._logger.log('verbose', '[fork] created new fork: ' + queue_name);

        q._queueStack.push(self._name);

        forks.push(q);
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
 * of .exec(type, params, status), normally this is a Buildy object
 * @public
 */
Queue.prototype.run = function() {
    var t    = this._queue[this._queuePosition],
        self = this;

    this.emit('queueStarted', {
        queue : this._name
    });

    this._logger.log('verbose', '[' + this._name + '] Started');

    if (t.type === 'fork') {
        this._fork(t.spec);

    } else {
    
        this._status = new events.EventEmitter;
        this._status.on('complete', function handleComplete() {
            self._onTaskComplete.apply(self, arguments);
        });
        this._status.on('failed', function handleFailed() {
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
        this._logger.log('verbose', '[' + t.type + '] Started');
        this._logger.log('verbose', '[' + t.type + '] DEBUG:', {
           queue : this._name,
           stack : this._queueStack.toString(),
           position : this._queuePosition,
           type : t.type
        }); // TODO: dry

        this._exec(t.type, t.spec, this._status);
    }
};


/**
 * Execute a task using this queue.
 * This method is normally invoked from the Queue object.
 *
 * The task type must exist in the registry referred to by registry.
 *
 * @method _exec
 * @param type {String} Type of task to execute
 * @param params {Object} Options/Parameters to pass to the task
 * @param status {EventEmitter} emitter that will emit ('complete' or
 * 'failed') upon result
 * @private
 */
Queue.prototype._exec = function(type, params, status) {
    if (this.registry.taskExists(type)) {
        this.registry.task(type).apply(this, [params, status, this._logger]);
    } else {
        status.emit('failed', 'No such task exists: ' + type);
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
        this._logger.log('verbose', '[' + this._name + '] Complete.');
    }    
};
    
/**
 * Called after a task completes
 * 
 * Receives arguments supplied by the Buildy task
 * TODO: tasks can currently fire the complete event multiple times, resulting in an exception here.
 * 
 * @method _onTaskComplete
 * @param type {String} Task type
 * @param result {Object} Task results
 * @protected
 */
Queue.prototype._onTaskComplete = function(type, result) {

    if (this._queuePosition > this._queue.length) {
        this.emit('error', 'A fatal error occurred: probably one of your tasks has emit complete twice.');
    }

    this.emit('taskComplete', {
        queue : this._name,
        task : this._queue[this._queuePosition], 
        result : result 
    });

    this._logger.log('verbose', '[' + this._name + '][' + this._queue[this._queuePosition].type + '] Task complete: ' + result);

    if (this._logByTypes[type]) {
        this._logger.log('info', result);
    }

    this.next();
};
    
/**
 * Called after a task fails
 * 
 * Receives arguments supplied by Buildy task, at the
 * moment only an error message is passed back.
 * 
 * @method _onTaskFailed
 * @param type {String} Task type
 * @param result {String} Error message
 * @protected
 */
Queue.prototype._onTaskFailed = function(type, result) {

    this.emit('taskFailed', {
        queue : this._name,
        task : this._queue[this._queuePosition],
        result: result 
    });

    this._logger.log('verbose', '[' + this._name + '][' + this._queue[this._queuePosition].type + '] failed: ' + result);

    this.emit('queueFailed', {
        queue : this._name,
        task : this._queue[this._queuePosition],
        result: result
    });
};