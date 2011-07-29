What?
=====

buildy aims to be an asynchronous build system for node.js

*It's really really young right now, in its alpha stage*

Why?
====

Because the core philosophy of node.js is asynchronous operation. But I think
the author of vows, a BDD testing framework, put it better in their main blurb:

> The first, and obvious reason is that node.js is asynchronous, and therefore our tests should be. 
> The second reason is to make tests which target I/O run much faster, by running them concurrently. 

Pretty ironically quite a few buildy tasks run synchronously at the moment, but 
the idea is to move to asynchronous/event driven operation. The first priority
was ease of use, or - how can you get a lot of value without writing much code.

Examples
========

buildy supports a chaining syntax which is pretty similar looking to jQuery.

Example 1. Compress all the things
----------------------------------

This is the most generic scenario I can think of: you have your code in multiple files, and you want to 
join them together, minify them, and then write the result out to another file that you serve up.

```javascript
var Buildy = require('buildy').Buildy,
    buildy = new Buildy();

buildy.files('*.js').concat().minify().write('javascript.js');
```

Example 2. When all you need is a fork
--------------------------------------

Wait a second, thats all sequential.. what if you need to do a lot of things in parallel...

```javascript
var Buildy = require('buildy').Buildy,
    buildy = new Buildy();

buildy.files('*.js').concat().fork([
    function(buildy, callback) {
	buildy.write('javascript-concat.js');
	callback();
    },
    function(buildy, callback) {
	buildy.jslint();
	callback();
    },
    function(buildy, callback) {
	buildy.minify().write('javascript-min.js');
    }
]);
```

And now you have 2 files, one concatenated for debugging, and one minified version, and jslint output from your original source.

Task Reference
==============

The built in tasks are as follows:

`concat()`

* inputs: files | strings
* outputs: string

Take the output of the previous task and concatenate it.

***

`csslint(lintOptions)`

* inputs: file | string
* outputs: same result as the input, does not modify

Run CSSLint on the output of the previous task

***

`cssminify(options)`

* inputs: file | string
* outputs: string

Minify the input string using Less.

***

`files(string|array of strings)`

* inputs: nothing
* outputs: files

Generate a list of filenames which will act as the input for the next task in the chain.
At the moment (in alpha stage) this does not support globbing.

***

`fork([functions])`

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

`jslint(lintOptions)`

* inputs: file | string
* outputs: same result as the input, does not modify

Run JSLint on the output of the previous task, the output of this task
is a repeat of what was fed into it. It takes one object parameter which
is passed to JSLint as the lint options.

***

`log()`

* inputs: string | strings | files
* outputs: same result as the input, does not modify

Log the output of the previous task to the console, to inspect its current state.

***

`minify(options)`

* inputs: file | string
* outputs: string

Minify the input string using uglify-js.

***

`replace(regex, replace, flags)`

* inputs: string
* outputs: string

Apply a regular expression to replace strings from the input.

***

`template(template, model)`

* inputs: file | string
* outputs: string

Apply the input to a mustache template, with additional variables specified in *model*.
At the moment the input of the task is assigned to the template variable 'code' although
this will be configurable in the near future.

***

`write(filename)`

* inputs: string
* outputs: file

Write the output of the previous task to the specified filename, the output
is the filename of the written file which can be chained to further tasks.
