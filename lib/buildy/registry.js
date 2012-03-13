var fs = require('fs'),
    path = require('path'),
    util = require('util');

/**
 * Buildy task registry
 *
 * Aim:
 *
 * - The registry holds a list of valid tasks to execute and ensures that new user-added tasks adhere to the same protocol.
 * - The buildy tool uses this registry to include the default tasks.
 * - End users can add their own tasks, ideally with some kind of auto-loading in their own project so that those tasks
 * are already included in whatever queue they create. Initially, custom tasks will be manually loaded via addFile and addDirectory.
 * - TODO: the registry should store default options for each task, which can then be overridden by the users build files so that their
 * entire build process inherits those same defaults.
 *
 * TODO: Remove debug logging when this becomes stable.
 * TODO: This might be better as a singleton? though theres no direct need.
 */

var Registry = module.exports = function Registry() {

    /**
     * Collection of valid tasks to execute.
     *
     * Tasks are keyed by name and so may overwrite eachother. Recommend
     * using a dot notation namespace (eg. myproject.squish) if you require tasks that are really
     * specific to the project.
     *
     * @property _tasks
     * @type Object
     */
    this._tasks = {};

    /**
     * Collection of directories to autoload as part of the registry.
     *
     * @property _taskDirectories
     * @type Array
     */
    this._taskDirectories = [
        __dirname + "/tasks"
    ];

    this.load(this._taskDirectories[0]); // TODO: load needs to accommodate arrays
};

/**
 * Add a task type to the registry.
 *
 * Task specification example:
 * <code>
 * {
 *  callback: function(){} // Function that will be called when executing the task.
 *  accepts: ['string', 'strings', 'files']
 * }
 * </code>
 *
 * @method add
 * @param name {String} Name of the task to add, this can override builtin tasks.
 * @param params {Object} Task specifications, describes how the task will act, what kind of inputs it takes etc.
 * @public
 */
Registry.prototype.add = function(name, params) {
    //util.log('Registering task: ' + name);

    if (this._isTaskDefinitionValid(params)) {
        this._tasks[name] = params;
    } else {
        throw new TypeError('Can\'t register task "' + name + '", specification is invalid.');
    }
};

/**
 * Load task definitions from modules in specified file(s) or directory(s)
 *
 * @method load
 * @param [dir1], [dir2], [fileA], [fileB] {String} Files or directories to load.
 * @public
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
 * @param dirname {String} Directory to enumerate for custom tasks.
 * @private
 */
Registry.prototype._loadDir = function(dirname) {
    var files = fs.readdirSync(dirname),
        self = this;

    files.forEach(function(filename) {
        self._loadFile(path.join(dirname, filename));
    });
};

/**
 * Read a single .js file and add the exported tasks to the registry.
 *
 * @method _loadFile
 * @param filename {String} Filename containing tasks to be added to the registry.
 * @private
 */
Registry.prototype._loadFile = function(filename) {
    if(path.extname(filename) != '.js'){ 
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
 * Retrieve a task from the registry
 *
 * @method task
 * @param name {String} Name of the task to retrieve.
 * @public
 */
Registry.prototype.task = function(name) {
    if (this._tasks.hasOwnProperty(name)) {
        return this._tasks[name].callback;
    } else {
        util.log('Attempt to fetch task ' + name + ' failed. Task is not defined.');
    }
};

/**
 * Test if the named task exists in the registry
 *
 * @method taskExists
 * @param name {String} Name of the task to check.
 * @public
 */
Registry.prototype.taskExists = function(name) {
    if (this._tasks.hasOwnProperty(name)) {
        return true;
    } else {
        return false;
    }
};

/**
 * Validate a task specification.
 *
 * TODO: Task validation needs a lot of refinement.
 *
 * @method _isTaskDefinitionValid
 * @param params {Object} Task specification to validate
 * @return {Boolean} True if the specification is valid.
 * @private
 */
Registry.prototype._isTaskDefinitionValid = function(params) {
    if (params.hasOwnProperty('callback') && typeof params.callback === "function") {
        return true;
    } else {
        return false;
    }
};