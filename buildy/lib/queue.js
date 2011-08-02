var util = require('util'),
    events = require('events');
    

function Queue(name) {
    this._name = name;
    console.log('Created new queue ' + name);
}

util.inherits(Queue, events.EventEmitter);

Queue.prototype = {
    
    /**
     * Name of the task queue
     * 
     * @property _name
     * @default 'queue'
     */
    _name : 'queue',
    
    /**
     * Stack of calling queues
     * 
     * @property _nameStack
     * @default empty array
     */
    _nameStack : [],
    
    /**
     * Queued tasks
     * 
     * @property _queue
     * @default empty array
     */
    _queue : [],
    
    /**
     * Queue position
     * 
     * @property _queuePosition
     * @default 0
     */
    _queuePosition : 0,
    
    /**
     * Queue runner
     * 
     * @property _runner
     * @default null
     */
    _runner : null,
    
    /**
     * EventEmitter given to the runner which will
     * emit complete or failed
     * 
     * @property _promise
     * @default null
     */
    _promise : null,
    
    /**
     * Add a task to the queue
     * 
     * @method task
     * @param type {string} a valid task type
     * @param spec {object} valid specification for that task type
     * @public
     */
    task : function(type, spec) {

        this._queue.push({ type: type, spec: spec });
        return this;
    },
    
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
    run : function(runner) {
        var t = this._queue[this._queuePosition],
            self = this;
        
        this._promise = new events.EventEmitter;
        this._promise.on('complete', function() { self._onTaskComplete.apply(self, arguments); });
        this._promise.on('failed', function() { self._onTaskFailed.apply(self, arguments); });
        
        this._runner = runner;
        console.log('f:' + this._name + ' t:' + this._queuePosition + ' type=' + t.type + ' executing...');
        this._runner.exec(t.type, t.spec, this._promise);
    },
    
    _onTaskComplete : function(result) {
        this._queuePosition++;
        if (this._queuePosition < this._queue.length) {
            this.run(this._runner);
        } else {
            console.log('Queue complete: ' + this._name);
        }
    },
    
    _onTaskFailed : function(result) {
        console.log('Task has failed.');
        
        console.error('Failed');
    }
};

exports.Queue = Queue;