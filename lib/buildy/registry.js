/**
 * Task registry
 *
 * @module core
 */

var fs = require('fs'),
    path = require('path'),
    util = require('util');

/**
 * Buildy task registry
 *
 * The registry holds a list of currently valid tasks, and performs auto-loading of custom tasks outside of buildy.
 *
 * @class Registry
 * @namespace buildy
 * @param {Object} options
 * @param {Boolean} options.autoload = true, Autoload tasks on construction.
 * @constructor
 */
var Registry = module.exports = function Registry(options) {

    /**
     * Collection of valid tasks to execute.
     *
     * Tasks are keyed by name and so may overwrite eachother. Recommend
     * using a dot notation namespace (eg. myproject.squish) if you require tasks that are really
     * specific to the project.
     *
     * @property _tasks
     * @type Object
     * @private
     */
    this._tasks = {};

    /**
     * Collection of directories to autoload as part of the registry.
     *
     * @property _taskDirectories
     * @type Array
     * @private
     */
    this._taskDirectories = [
        path.join(__dirname, "tasks")
    ];

    if (options && options.autoload === true) {
        this.load(this._taskDirectories[0]); // TODO: load needs to accommodate arrays
    }
};

/**
 * Add a task to the registry.
 *
 * The format of accepts is:
 * { 'FILE': _functionDoFileTask, 'STRING': _functionDoStringTask }
 *
 * @method add
 * @param {String} name Name of the task to add, tasks added later will override tasks loaded earlier.
 * @param {Object} accepts A description of what the task accepts and a reference to the function that will handle that type
 */
Registry.prototype.add = function(name, accepts) {
    if (this._isTaskDefinitionValid(accepts)) {
        this._tasks[name] = accepts;
    } else {
        throw new TypeError('Can\'t register task "' + name + '", specification is invalid.');
    }
};

/**
 * Load task definitions from modules in specified files or directories.
 *
 * This method can take any number of arguments referring to directories or files.
 *
 * @method load
 * @param {String} fsitem... Files or directories to load.
 */
Registry.prototype.load = function() {
    var argc = arguments.length,
        i = 0,
        fsitem;

    for (;i < argc;i++) {
        fsitem = arguments[i];

        var fsitemStats = fs.statSync(fsitem);

        if (fsitemStats.isDirectory()) {
            this._loadDir(fsitem);
        } else if (fsitemStats.isFile()) {
            this._loadFile(fsitem);
        } else {
            util.log('Unsupported file system object ' + fsitem);
        }
    }
};

/**
 * Load tasks into the registry from the specified directory.
 *
 * This will enumerate all of the .js files in the directory and check to see if they
 * export a tasks property on each module. The contents of that will be appended to the tasks registry.
 *
 * @method _loadDir
 * @param {String} dirname Directory to enumerate for custom tasks.
 * @private
 */
Registry.prototype._loadDir = function(dirname) {
    var files = fs.readdirSync(dirname),
        self = this;

    files.forEach(function(filename) {
        if (path.extname(filename) === '.js') {
            self._loadFile(path.join(dirname, filename));
        }
    });
};

/**
 * Read a single .js file and add the exported tasks to the registry.
 *
 * @method _loadFile
 * @param {String} filename Filename containing tasks to be added to the registry.
 * @private
 */
Registry.prototype._loadFile = function(filename) {

    if (path.extname(filename) != '.js'){
        return;
    }

    var tasks = require(filename),
        taskname;

    if (tasks.hasOwnProperty('tasks')) {
        for (taskname in tasks.tasks) {
            if (tasks.tasks.hasOwnProperty(taskname)) {
                this.add(taskname, tasks.tasks[taskname]);
            }
        }
    } else {
        util.log('No tasks to load from ' + filename);
    }
};

/**
 * Grab a list of task names that the registry knows about.
 *
 * @method tasks
 * @return {Array} Array of task names
 */
Registry.prototype.tasks = function() {
    return Object.keys(this._tasks);
};

/**
 * Retrieve a task from the registry
 *
 * @method task
 * @param {String} name Name of the task to retrieve.
 * @return {Function} The associated task function.
 */
Registry.prototype.task = function(name) {
    if (this._tasks.hasOwnProperty(name)) {
        return this._tasks[name];
    } else {
        throw new TypeError('Could not locate a task with the requested name: ' + name);
    }
};

/**
 * Test if the named task exists in the registry
 *
 * @method taskExists
 * @param {String} name Name of the task to check.
 * @return {Boolean} whether the name is the name of a registered task.
 */
Registry.prototype.taskExists = function(name) {
    return this._tasks.hasOwnProperty(name);
};

/**
 * Validate a task specification.
 *
 * TODO: Flesh out task validation method
 *
 * @method _isTaskDefinitionValid
 * @private
 * @param {Object} accepts Task definition to validate
 * @return {Boolean} True if the specification is valid.
 */
Registry.prototype._isTaskDefinitionValid = function(accepts) {
    return true; // TODO: stubbed out for new format test
};