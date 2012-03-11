What
====

Buildy is a build system for web/javascript/node.js projects.
It acts like a sequence of 'piped' commands.

Main features:
    - relatively brief syntax.
    - can use asynchronous api where practical.
    - tasks and task queues can execute in serial or parallel.
    - extend the built in build tasks with your own tools, or 3rd party tools.

*WARNING: API still in development, and may change without notice until v1.0.0*

Build things
============

Concatenate scripts, minify, and write to release directory
-----------------------------------------------------------

```javascript
new Queue('release version')
    .task('files', ['./js/test1.js', './js/test2.js'])
    .task('concat')
    .task('jsminify')
    .task('write', { name: './build/test-min.js' })
    .run();
```

Make a minified version and a non minified version in parallel using the 'fork' task
------------------------------------------------------------------------------------

```javascript
new Queue('build process')
    .task('files', ['./js/test1.js', './js/test2.js'])
    .task('concat')
    .task('fork', {
        'raw version' : function() {
            this.task('write', { name: './build/test.js' }).run();
        },
        'minified version' : function() {
            this.task('jsminify').task('write', { name: './build/test-min.js' }).run();
        }
    }).run();
```

The fork task changes the flow of the build from serial to parallel when you need to take a single input and do
a number of independent things with it.

Write a raw version to the release directory and lint the stylesheets simultaneously
------------------------------------------------------------------------------------

```javascript
new Queue('release version')
    .task('files', ['./js/test1.js', './js/test2.js'])
    .task('concat')
    .task('jsminify')
    .task('write', { name: './build/test-min.js' })
    .run();

new Queue('lint stylesheets')
    .task('files', ['./css/test1.css', './css/test2.css'])
    .task('csslint')
    .run();
```

You can have as many queues as you like. They will run independently and in parallel. This is the best situation for
two or more build processes that have nothing to do with each other.

How it works
============

- Construct a `Queue` object with a name (for the logger output).
- Add a chain of tasks to the `Queue` using the `.task(name, options)` method. The input of each task is the output of
the previous one. Some tasks, like `files`, generate output.
- At the end of the `Queue` chain, call the `.run()` method. The `Queue` will then be automatically run as soon as node
executes the queue file.

Flow Control
------------

The `fork` task splits the queue into sub-queues. These are run in parallel.

Each time you add a fork task, it becomes a new Queue with the name specified ('raw version' 
in the last example). The new queue inherits its state from the parent, but acts independently from then on.


Built in tasks
==============

The built in tasks are as follows:

`concat`

Concatenate the input from the previous task.

***

`csslint` (async)

CSSLint the input (Note: doesn't try to detect if you are actually supplying CSS).

***

`cssminify`

Reformat/Minify the CSS using Less.js (Also doesn't attempt to detect if you are supplying CSS).

***

`files`

Generate a files list, commonly used as the start of a queue.

***

`fork`

Split the build process into two or more parallel build processes.

The fork function takes a hash of new child queue name to function.

The function is executed in the context of the queue, so you may use this.task() to continue
adding tasks to the child queue.

*Known limitation* : you cannot chain to the end of a fork task (as in, going from parallel tasks back to serial).

***

`inspect`

Log the output of the previous task.

***

`jslint` (async)

JSLint the input.

***

`jsminify`

Minify the input using uglify-js.

***

`replace`

Apply a regular expression to replace strings in the input.

***

`template`

Apply a handlebars template to the input.

***

`write`

Write the input to the specified file name.

Known bugs
----------

The globbing module doesn't interpret relative paths using . or ..

Custom tasks
============

If you need to add to the available tasks (because a 3rd party tool isn't listed in the built in tasks, for example),
you can write your own tasks to be loaded before queues are executed.

*WARNING: API Still in development, may change*

Basic guidelines
----------------

Take a look at some of the built in tasks (in ./lib/tasks) to see how a custom task should be structured.

* Each task has its own source file, but you can publish many tasks in one file if you like.
* The task file must export a property called `tasks`, which is an object.
* The `tasks` object contains a property name, which the user supplies when invoking the task, and a function.
* The task function is called with options, and an event emitter. The queue expects you to emit `complete` or `failed`
from the emitter, to let it know the result of your asynchronous (or synchronous) task.

Hello.js - a custom task example
--------------------------------

hello.js

```javascript
var State = require('buildy/lib/state'); // Required to use State.TYPES.*, see switch statement later...

function hello() {
    return 'hello world';
}

function helloHandler(options, promise) {
    switch (this._state.get().type) { /* What type of input are we handling? we should handle every pseudo constant in
                                         State.TYPES.* */

        case State.TYPES.STRING:
            var myStringValue = hello(), // Call another function to handle the functionality of the task
                myStatusMessage = 'Set new value to ' + myStringValue;

            this._state.set(State.TYPES.STRING, myStringValue); // We set a new value 'hello world' of type string
            promise.emit('complete', 'hello', myStatusMessage); // Tell the queue we are done successfully

            break;

        case State.TYPES.STRINGS:
            // Iterate through strings
            // Set all of them to 'hello world'
            // Set the new state value from that array
            break;

        case State.TYPES.FILES:
            // Behaviour is up to you...
            break;

        default:
            promise.emit('failed', 'hello', 'Unrecognized input type: ' + this._state.get().type);

    }
}

exports.tasks = {
    'hello' : helloHandler
}
```

This task is now registered as the `hello` task. We can use it now as a part of our build process, like so:

testqueue.js

```javascript
var Registry = require('buildy/lib/registry'),
    Queue = require('buildy/lib/queue').Queue,
    customRegistry, testq;

customRegistry.add('/path/to/tasks/hello.js'); // Add the custom task OR
// customRegistry.load('/path/to/tasks/directory'); // Load *.js from this directory

testq = new Queue('Testing queue', { registry: customRegistry }); // Set up a new queue with custom registry.

testq.task('hello'); // The current state will be set to 'hello world'
testq.write({ dest: './hello.txt' }) // The string will be written out to a file, ./hello.txt
testq.run(); // Run the task chain, the hello.txt file is created.
```

Queue
=====

The following options can be supplied as the second parameter, an object containing any of these properties:

* `skip : ['task name to skip', ...]` Basic task skipping, allows you to skip a particular task by its task name.
Execution will continue on the next task in the queue.
* `defaults : { 'task name' : { ... } }` Object containing task names with their respective default parameters.


TODO
====

* Clarify the custom task autoloading method.
* 100% test coverage of each task.
* Standardise an option for producing .json formatted reports from tasks that produce that kind of output. (probably use
winston metadata/custom transports).
* Determine a strategy for dealing with tasks that operate on a batch of files where the output is also files. Use
destination dir, file prefix, file suffix options.
* Establish a defaults system, so that a task option can be defaulted for the entire queue or set of queues.
* Files that are cast into strings should retain filename throughout the process, so that they may be written out based upon the original name.
* Dont use an inspect task in the unit tests, the unit test might expose a problem with inspect instead of the subject.

non piped file output should take these options:
{ dir: '/output/directory', prefix: 'prepended-to-filename', suffix: 'appended-to-filename' }
this is to handle a multiple-string or multiple-file operation