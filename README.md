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
