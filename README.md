What
====

Buildy is a build system for javascript/node.js projects.
It acts like a sequence of 'piped' commands.

Main features:
    - relatively brief syntax.
    - uses asynchronous api where practical.
    - sequential and parallel build tasks (its up to you how the build will flow).
    - [coming soon] extensible tasks, integrate your own tools, or any 3rd party tool.

*WARNING: API Still in development, and may change without notice*

Do things
=========

Concatenate scripts, minify, and write to release directory
-----------------------------------------------------------

```javascript
new Queue('release version')
    .task('files', ['./js/test1.js', './js/test2.js'])
    .task('concat')
    .task('minify')
    .task('write', { name: "./build/test-min.js" })
    .run();
```

Make a minified version and a non minified version in parallel
--------------------------------------------------------------

```javascript
new Queue('build process')
    .task('files', ['./js/test1.js', './js/test2.js'])
    .task('concat')
    .task('fork', {
        'raw version' : function() {
            this.task('write', { name: './build/test.js' }).run();
        },
        'minified version' : function() {
            this.task('minify').task('write', { name: './build/test-min.js' }).run();
        }
    }).run();
```

How it works
============

- Construct a `Queue`. You can have multiple queues and they will execute in parallel.
- Add a chain of tasks to the `Queue` using the `.task(name, options)` method. The input of each task is the output of
the previous one. Some tasks, like `files`, generate some output for the next task.
- At the end of the `Queue` chain, call the `.run()` method. The `Queue` will then be automatically run as soon as node
executes the queue file.

Flow Control
------------

The `fork` task splits the queue into sub-queues. These are run in parallel.

Each time you add a fork task, it becomes a new Queue with the name specified ('raw version' 
in the last example). The new queue gets a clone of the output before the fork.


Task Reference (Incomplete)
===========================

The built in tasks are as follows:

`concat`

* inputs: files | strings
* outputs: string

Take the output of the previous task and concatenate it.

***

`csslint`

* inputs: file | string
* outputs: same result as the input, does not modify

Run CSSLint on the output of the previous task

***

`cssminify`

* inputs: file | string
* outputs: string

Minify the input string using Less.

***

`files`

* inputs: nothing
* outputs: files

Generate a list of filenames which will act as the input for the next task in the chain.
At the moment (in alpha stage) this does not support globbing (TODO: needs cross-platform globbing).

***

`fork`

* inputs: anything
* outputs: nothing

Take the output of the previous task, and split into a number of tasks running
parallel. 

The fork function takes an array of functions which receive two parameters:
a reference to the previous buildy task and a callback function to let fork know that
the task has completed. If the fork task is the last one in a chain, you don't need to
deal with the callback. At the moment you cannot chain at the end of a fork task but
this feature is planned.

***

`invoke`

* inputs: anything
* outputs: nothing

Take the output of the previous task and give it to your own anonymous function.

***

`jslint`

* inputs: file | string
* outputs: same result as the input, does not modify

Run JSLint on the output of the previous task, the output of this task
is a repeat of what was fed into it. It takes one object parameter which
is passed to JSLint as the lint options.

***

`log`

* inputs: string | strings | files
* outputs: same result as the input, does not modify

Log the output of the previous task to the console, to inspect its current state.

***

`minify`

* inputs: file | string
* outputs: string

Minify the input string using uglify-js.

***

`replace`

* inputs: string
* outputs: string

Apply a regular expression to replace strings from the input.

***

`template`

* inputs: file | string
* outputs: string

Apply the input to a mustache template, with additional variables specified in *model*.
At the moment the input of the task is assigned to the template variable 'code' although
this will be configurable in the near future.

***

`write`

* inputs: string
* outputs: file

Write the output of the previous task to the specified filename, the output
is the filename of the written file which can be chained to further tasks.

Known bugs
----------

The globbing module doesn't interpret relative paths using . or ..

TODO
====

* Separate the logger logic from the other modules.
* Clarify the custom task autoloading method.
* Cover more test cases for each built in task
* Re-examine task functions that were imported from utils.js, as they may be suboptimal for the new layout.
* Standardise an option for producing .json formatted reports from tasks that produce that kind of output.