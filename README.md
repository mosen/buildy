What
====

Buildy is a build system for web/javascript/node.js projects.

Main features:
    - Familiar pipeline concept, similar to the unix shell.
    - Build instructions are executed as javascript, you can inject your own functionality anywhere in the process.
    - You can extend the reusable build tasks, and they can be shared between your projects.
    - Tasks can be executed in parallel or serially, and async API is used in each of the tasks.

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

- You construct a `Queue` object for each chain of tasks that are dependent on each other. Each queue has a name so that
you will be able to recognise log output related to that queue.
- Add a chain of tasks to the `Queue` using the `.task(name, options)` method. The input of each task is the output of
the previous one. Some tasks, like `files`, generate output instead of modifying their input.
- At the end of the `Queue` chain, call the `.run()` method. This signifies the end of the task chain. Optionally you
can pass a function to the `run()` method to be executed upon completion of the `Queue`.

Flow Control
------------

The `fork` task splits the queue into sub-queues. These are run in parallel and asynchronously, so they are not
guaranteed to finish at the same time.

Each time you add a fork task, it actually spawns a new Queue with the name specified ('raw version'
in the last example). The new Queue inherits its state from the parent, but acts independently from then on.


Built in tasks
==============

Several tasks are built in to Buildy to carry out common build tasks. Some of these tasks rely on external libraries.
(TODO: In future the task will be automatically disabled unless you decide to install the 3rd party module).

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
The globbing module doesn't support win32/64

Custom tasks
============

If you need to add to the available tasks (because a 3rd party tool isn't listed in the built in tasks, for example),
you can write your own tasks to be loaded before queues are executed.

*WARNING: The task API is still in development, and may change until a 1.0 release*

Custom task walkthrough
-----------------------

TODO


The core parts of buildy
========================

State
-----

The state object is passed between tasks in the chain. It represents the thing(s) you are modifying.
It acts as a collection and delegates I/O operations for each of its values.

The state object acts like a collection which hints at the type of value it is storing. The hinted type is used to
 determine how to read or write that type of value. One of the clear reasons for this kind of type hinting is that a
 string's contents can be interpreted in quite a few different ways.

The naming of the keys in this collection usually corresponds to the source of the item, for example: The full path to
the filename of the source file, the URI of a stream that can be read, etc. This is not a hard rule (you can use
any unique string as the key for an item in the collection), but it allows you to trace the source(s) of your build more
easily.

Because the state object acts like a collection, it has inherited a fair amount of the API you would find when dealing
with collections in various dynamic scripting languages. Examples are `length()`, `forEach()`, `get()`, `set()`. See
the API docs for more information about dealing with the state as a collection in your custom tasks.

The other role of the state object is to delegate I/O for the objects or values that it represents. This presents the
custom tasks with a single set of methods to deal with various different types of files and streams. Even though this
part is abstracted, the task may assume that the content type is one that it can work with. The JSLint task for example
assumes that you won't try to construct a queue that runs a jpeg file through it.

Queue
-----

The queue object controls the flow of a single task chain. It moves through the set of tasks you instruct it to, with
the parameters you supplied. It also collects information about each task's progress; whether it failed, if there was
some kind of warning, etc.

Some special tasks cause the flow to change, like the `fork` task. The `fork` task creates a set of new queue objects
that inherit the state of the queue that spawned them. In a lot of ways, the fork task acts like a forked process.

The queue fires events related to each stage of execution. You can also supply a callback to the end of the queue which
will then be executed upon completion (including failure) to do any kind of post-build logic or cleanup.

Registry
--------

The registry manages a list of available tasks that you can add to a queue. It can load new tasks from a directory or
specified by single filename. It ensures that task names are unique.

The queue object always refers to an instance of registry to retrieve a task just before it is about to be executed.
The default task registry is available as a property of your queue object(s) as `queue.registry`.

TODO
====

* Convert all test suites to mocha (40%)
* Update tasks to suit new custom task format.
* Tasks should have access to logger in this.logger context (Queue object context).
* Convert parallel execution of async code to use the `async` module instead of my own homebrew method (20%).
* Document and design in more detail how custom tasks are loaded or added from your own project.
* Produce reports in various formats from tasks. Try to seperate reporting (details of build) from logging (events in
the build process).
* Determine a strategy for dealing with tasks that operate on a batch of files where the output is also a batch of
files. Use file and path modifiers for the write task like a "filename prefix", and a "filename suffix" to get custom
output naming.
* Establish a defaults system, so that a task option can be defaulted for the entire queue or set of queues.