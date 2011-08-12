// Test the Cprf module
var cprf = require('buildy/lib/cprf').cprf;

cprf(['../examples/*'], '../examples_copy', function(err, results) {
    console.log('Finished copying');
}, {
   recursive : true,
   excludes : []
});