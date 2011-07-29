// This is an example build file for buildy which showcases a few of its built in features.
var Buildy = require('buildy').Buildy,
    buildy = new Buildy();
    
buildy.files(['./js/test1.js', './js/test2.js']).concat().fork([
   function(buildy, callback) {
       buildy.write('./js/test-concat.js');
       callback();
   },
   function(buildy, callback) {
       buildy.minify().write('./js/test-concat-min.js');
       callback();
   },
   function(buildy, callback) {
       buildy.jslint();
       callback();
   }
]);

buildy.aMinify({
   'complete' : function(b) {
       b.doSomething
   },
   'fail' : function(b) {
       
   }
});

buildy.aMinify({ 'complete' : ['jslint', 'arg1', 'arg2'] })

buildy.aMinify.on('complete', function(b) {
   
});

var taskB = function(input) {
    input.a
}

// sugar:
buildy.aMinify().then(taskB)