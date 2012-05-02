/**
 * @module Queue
 */

var util        = require('util')
    , events    = require('events')
    , winston   = require('winston')
    , Registry  = require('./registry')
    , State     = require('./state')
    , isArray = util.isArray || function(ar) {
        return Array.isArray(ar) ||
            (typeof ar === 'object' && objectToString(ar) === '[object Array]');
    };



/**
 *
 * <p>The Queue object describes a plan to execute a series of tasks.</p>
 *
 * <p>Each queue is assigned a name so that the log can have some meaningful output, and debugging can be traced back
 * to the responsible object.</p>
 *
 * <p>The Queue object also holds instances of other buildy objects:</p>
 *
 * <ul>
 * <li><em>registry</em> the task registry where built-in tasks and 3rd party tasks are dynamically loaded.</li>
 * <li><em>state</em>    the object that will carry the output state all the way through the queue chain.</li>
 * <li><em>logger</em>   the logger that will be passed to each task for detailed log information.</li>
 * <li><em>status</em>   the emitter object that hands control over to the task, and takes it back when complete.</li>
 * </ul>
 *
 * <p>Queue options are specified as properties of an object, supplied as the second parameter of the constructor.</p>
 *
 * @class Queue
 * @namespace buildy
 * @constructor
 * @param {String} name The name of the queue (used in logging).
 * @param {Object} [options] Queue options
 */
var Queue = module.exports = function Queue(name, options) {

    events.EventEmitter.call(this);

    options = options || {};

    /**
     * Name of the task queue
     *
     * @property _name
     * @default undefined
     * @private
     */
    this._name = name;

    /**
     * Queued tasks
     *
     * @property _queue
     * @default []
     * @private
     */
    this._queue = [];

    /**
     * Queue position
     *
     * @property _queuePosition
     * @default 0
     * @private
     */
    this._queuePosition = 0;

    /**
     * Stack of calling queues
     *
     * @property _queueStack
     * @default array
     * @private
     */
    this._queueStack = [];

    /**
     * Logger instance
     *
     * @property _logger
     * @default winston logger with console output
     * @private
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
     * @private
     */
    this._logByTypes = {
        "write" : true
    };

    /**
     * Skip (i.e blacklist) a list of tasks by name.
     *
     * This feature gives you some very general control over which tasks you would like
     * to skip. For more detailed logic you may have to code some conditions into a fork task.
     *
     * @property _skip
     * @default []
     * @private
     */
    this._skip = isArray(options.skip) ? options.skip : [];

    /**
     * Task default parameters.
     *
     * Configure a set of default task parameters to be used in lieu of them being supplied
     * with the task. The parameter is an object with property names that match the task names.
     *
     * @property _defaults
     * @default {}
     * @private
     */
    this._defaults = options.defaults || {};

    /**
     * Task registry
     *
     * @property registry
     * @default instance of registry with default paths (buildy built-in tasks only).
     * @private
     */
    this.registry = options.registry || new Registry();

    /**
     * Object containing the state or file contents to be modified by the task.
     *
     * @property _state
     * @default empty state.
     * @private
     */
    this._state = options.state || new State();

};

util.inherits(Queue, events.EventEmitter);

/**
 * Add a task to the queue.
 *
 * The task type will not be checked for validity until execution time.
 * 
 * @method task
 * @param {String} type A valid task type
 * @param {Object} params Valid task parameters for the given type. If unspecified the task will refer to the 'defaults' option.
 * @return {Queue} A reference to this Queue object.
 * @public
 */
Queue.prototype.task = function(type, params) {
    this._queue.push({type: type, spec: params});
    return this;
};

/**
 * Fork the current Queue into multiple Queues.
 *
 * Each function is executed in the context of a new Queue object. so
 * new tasks must begin with this.task('abc'). The child Queues will inherit
 * all configuration from the parent queues except for the name.
 *
 * TODO: each time we add a new property to the queue the cloning process needs to be extended.
 * The cloning itself should be performed via another process.
 *
 * @method _fork
 * @param {Object} forks Object containing queue names as properties which are functions
 * @private
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
                logger: self._logger,
                skip: self._skip,
                defaults: self._defaults
            });

        clonedState.fromState(self._state);

        self._logger.log('verbose', '[fork] created new fork: ' + queue_name);
        self._logger.log('verbose', self.skip);

        q._queueStack.push(self._name);

        forks.push(q);
        forkspec[queue_name].call(q); // Execute the next fork in the context of the child queue.
    });
};

/**
 * Run the current task queue
 * 
 * Starts the execution of tasks listed with their parameters in this._queue, starting from the index
 * this._queuePosition
 *
 * On completion of this task, the success handler will increment the queue position.
 * On the failure of this task, the entire queue will bail with an error (firing taskFailed and queueFailed).
 * 
 * @method run
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
        // A fork is a special type of task because it causes the queue to spawn copies of itself.
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

        if (this._skip.indexOf(t.type) > -1) {
            this.emit('taskSkipped', {
                queue : this._name,
                stack : this._queueStack,
                position : this._queuePosition,
                type : t.type
            });
            this._logger.log('verbose', '[' + t.type + '] Skipped');
        } else {
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
    }
};

/**
 * Execute a task using this queue.
 * This method is normally invoked by Queue.run().
 *
 * The task type must exist in the registry referred to by this.registry, otherwise
 * the task and queue will fail.
 *
 * @method _exec
 * @param {String} type Type of task to execute
 * @param {Object} params Options/Parameters to pass to the task
 * @param {EventEmitter} status Emitter that will emit ('complete' or
 * 'failed') upon result
 * @private
 */
Queue.prototype._exec = function(type, params, status) {
    if (this.registry.taskExists(type)) {
        if (this._defaults.hasOwnProperty(type)) {
            params = params || this._defaults[type]; // TODO: merge defaults with specified parameters.
        }
        this.registry.task(type).apply(this, [params, status, this._logger]);
    } else {
        status.emit('failed', 'No such task exists: ' + type);
    }
};

/**
 * Move to the next task in the queue and execute it, if the position is after the last task then
 * the Queue will stop.
 *
 * @method next
 * @public
 */
Queue.prototype.next = function() {
    
    this._queuePosition++;

    if (this._queuePosition < this._queue.length) {
        this.run();
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
 * TODO: This method should ensure that a unique task does not fire complete on multiple occasions.
 * 
 * @method _onTaskComplete
 * @param {String} type Task type
 * @param {Object} result Task results
 * @private
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
 * @param {String} type Task type
 * @param {String} result Error message
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
