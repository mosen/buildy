/**
 * Task Queue
 *
 * @module core
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
 * The queue object describes a plan to execute a series of tasks.
 *
 * Each queue is assigned a name so that the log can have some meaningful output, and debugging can be traced back
 * to the responsible task.
 *
 * The queue object manages several other objects in the build process:
 *
 *
 *+ **registry** The task registry where built-in tasks and 3rd party tasks are dynamically loaded.
 *+ **state** The object that carries the output of one task to the input of another.
 *+ **logger** The logger instance that will report warnings or errors to the console.
 *+ **status** The emitter object that observes the progress and information given by a task, as well as its completion status.
 *
 *
 * Queue options are specified as properties of an object, supplied as the second parameter of the constructor.
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
    this.registry = options.registry || new Registry({ autoload: true });

    /**
     * Object containing the state or file contents to be modified by the task.
     *
     * @property state
     * @default empty state.
     * @public
     */
    this.state = options.state || new State();

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
 * @method fork
 * @param {Object} parameters Object describing fork parameters
 */
Queue.prototype.fork = function(parameters) {

    var self = this;
    var fork_count = Object.keys(parameters).length;

    this._logger.log('verbose', '[fork] creating ' + fork_count + ' fork(s)...');

    Object.keys(parameters).forEach(function (name) {
        var clonedState = new State(),
            q = new Queue(name, {
                registry: self.registry,
                state: clonedState,
                logger: self._logger,
                skip: self._skip,
                defaults: self._defaults
            });

        // Called at the end of a fork if resuming the Queue
        var fnDone = function(err) {
            if (err) {
                this._logger.log('error', 'a forked queue failed to complete successfully: ' + err);
            } else {
                if (!--fork_count) {
                    self.next.call(self);
                }
            }
        };

        clonedState.reset(self.state._values);

        self._logger.log('verbose', '[fork] created new fork: ' + name);
        self._logger.log('verbose', self.skip);

        q._queueStack.push(self._name);

        parameters[name].call(q, fnDone); // Execute the next fork in the context of the child queue.
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
Queue.prototype.run = function(done) {
    var task = this._queue[this._queuePosition],
        self = this;

    if (done) {
        this.callback = done;
    }

    this.emit('queueStarted', {
        queue : this._name
    });

    this._logger.log('verbose', '[' + this._name + '] Started');

    if (task.type === 'fork') {
        // A fork is a special type of task because it causes the queue to spawn copies of itself.
        this.fork(task.spec);
    } else {
    
        this._status = new events.EventEmitter();
        this._status.on('complete', function handleComplete() {
            self._onTaskComplete.apply(self, arguments);
        });
        this._status.on('failed', function handleFailed() {
            self._onTaskFailed.apply(self, arguments);
        });
        this._status.on('results', function handleResults() {
            self._onTaskResults.apply(self, arguments);
        });

        if (task === undefined) {
            throw new Error('Task ' + task + ' is undefined');
        }

        if (this._skip.indexOf(task.type) > -1) {
            this.emit('taskSkipped', {
                queue : this._name,
                stack : this._queueStack,
                position : this._queuePosition,
                type : task.type
            });
            this._logger.log('verbose', '[' + task.type + '] Skipped');
        } else {
            this.emit('taskStarted', {
               queue : this._name,
               stack : this._queueStack,
               position : this._queuePosition,
               type : task.type
            });
            this._logger.log('verbose', '[' + task.type + '] Started');
            this._logger.log('verbose', '[' + task.type + '] DEBUG:', {
               queue : this._name,
               stack : this._queueStack.toString(),
               position : this._queuePosition,
               type : task.type
            }); // TODO: dry

            this._exec(task.type, task.spec, this._status);
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
        status.emit('failed', 'queue', 'No such task exists: ' + type);
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
        if (this.callback) {
            this.callback();
        }
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

    if (this.callback) {
        // Some tasks may throw exceptions with no information at all. In this case you will need to debug the task.
        result = result || 'Task failed, no reason given.';

        this.callback.call(this, result);
    }
};

/**
 * Called when a task supplies results or information
 *
 * @param {String} type The task type that supplied the result(s)
 * @param {Object} result The result(s) as an object or an array. The reporter should figure out how to display them.
 * @private
 */
Queue.prototype._onTaskResults = function(type, result) {
    console.log('result from ' + type);
    console.dir(result);
};
