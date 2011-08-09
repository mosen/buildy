What
====

Buildy is a build system for javascript/node.js projects.

The aim is:
    - relatively brief syntax
    - asynchronous build tasks
    - sequential and parallel build tasks (where possible).

*It's really really young right now, so API may change*

I compare it to the core philosophy of vows.js:

> The first, and obvious reason is that node.js is asynchronous, and therefore our tests should be. 
> The second reason is to make tests which target I/O run much faster, by running them concurrently. 

Do things
=========

Concatenate scripts, minify, and write to release directory
-----------------------------------------------------------

```javascript
var b = new Buildy();

new Queue('release version')
    .task('files', ['./js/test1.js', './js/test2.js'])
    .task('concat')
    .task('minify')
    .task('write', { name: "./build/test-min.js" })
    .run(b);
```

Make a minified version and a non minified version in parallel
--------------------------------------------------------------

```javascript
var b = new Buildy();

new Queue('build process')
    .task('files', ['./js/test1.js', './js/test2.js'])
    .task('concat')
    .task('fork', {
        'raw version' : function(b) {
            this.task('write', { name: './build/test.js' }).run(b);
        },
        'minified version' : function(b) {
            this.task('minify').task('write', { name: './build/test-min.js' }).run(b);
        }
    }).run(b);
```

How it works
============

There are two objects, Buildy and Queue.
Buildy performs the work, and Queue describes the parameters and flow of the 
build tasks.

Most tasks execute one after the other, even though they may be asynchronous.
The exception is the 'fork' task.

Each time you add a fork task, it becomes a new Queue with the name specified ('raw version' 
in the last example). The new queue gets its own buildy object with the output from the previous task.

In a sense the functions you add to 'fork' are a clean queue, just the same as writing
new Queue('queue name').


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
At the moment (in alpha stage) this does not support globbing.

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