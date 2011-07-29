What?!
======

buildy is a node.js based build system.

ITS STILL IN DEVELOPMENT ALPHA STAGE

Why?!
=====

because other build systems assume sequential, synchronous tasks. or make it really hard to do asynchronous build tasks.
I love the idea of event driven I/O, so why not apply that to a build system.

Examples
========

buildy supports a chaining syntax which is pretty similar to jQuery, even though I've never used jQuery.

This is the most generic scenario I can think of: you have your code in multiple files, and you want to 
join them together, minify them, and then write the result out to another file that you serve up.

```javascript
var Buildy = require('buildy').Buildy,
    buildy = new Buildy();

buildy.files('*.js').concat().minify().write('javascript.js');
```

Wait a second, thats all sequential.. what if you need to do a lot of things in one go...

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

**.fork([functions])**

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

**.files(string|array of strings)**

* inputs: nothing
* outputs: files

Generate a list of filenames which will act as the input for the next task in the chain.
At the moment (in alpha stage) this does not support globbing.

***

**.concat()**

* inputs: files | strings
* outputs: string

Take the output of the previous task and concatenate it.

***

**.jslint(lintOptions)**

* inputs: file | string
* outputs: same result as the input, does not modify

Run JSLint on the output of the previous task, the output of this task
is a repeat of what was fed into it. It takes one object parameter which
is passed to JSLint as the lint options.

***

**.csslint(lintOptions)**

* inputs: file | string
* outputs: same result as the input, does not modify

Run CSSLint on the output of the previous task

***

**.write(filename)**

* inputs: string
* outputs: file

Write the output of the previous task to the specified filename, the output
is the filename of the written file which can be chained to further tasks.

***

**.replace(regex, replace, flags)**

* inputs: string
* outputs: string

Apply a regular expression to replace strings from the input.

***

**.minify(options)**

* inputs: file | string
* outputs: string

Minify the input string using uglify-js.

***

**.cssminify(options)**

* inputs: file | string
* outputs: string

Minify the input string using Less.

***

**.template(template, model)**

* inputs: file | string
* outputs: string

Apply the input to a mustache template, with additional variables specified in *model*.
At the moment the input of the task is assigned to the template variable 'code' although
this will be configurable in the near future.

***

**.log()**

* inputs: string | strings | files
* outputs: same result as the input, does not modify

Log the output of the previous task to the console, to inspect its current state.




