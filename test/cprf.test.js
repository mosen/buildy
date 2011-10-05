// Test the Cprf module
var cprf = require('buildy/lib/cprf').cprf;


module.exports = {
    'test cprf copy source to destination file' : function(beforeExit, assert) {

    },
    'test cprf exclusions list' : function(beforeExit, assert) {

    },
    'test cprf recursive flag' : function(beforeExit, assert) {

    }
}

//var operation = cprf(['../examples/*'], '../examples_copy', function(err, results) {
//    console.log('Finished copying');
//}, {
//   recursive : true,
//   excludes : []
//});
//
//operation.on('warning', function(err) {
//    console.log('warning: ' + err);
//});
//
//operation.on('globMatched', function(item, matches) {
//   console.log('expanded glob: ' + item + ' matches: ' + matches);
//});
//
//operation.on('parseDone', function() {
//   console.log('parsing complete');
//});
//
//operation.on('traversed', function(dir) {
//   console.log('traversed into: ' + dir);
//});
//
//operation.on('excluded', function(item) {
//   console.log('excluded: ' + item);
//});
//
//operation.on('fileStart', function(src, dest) {
//   console.log('started: ' + src + ' ' + dest);
//});
//
//operation.on('fileComplete', function(src, dest) {
//   console.log('completed: ' + src + ' ' + dest);
//});
//
//operation.on('operationCount', function(n) {
//   console.log(n + ' operation(s) pending');
//});
//
//operation.on('complete', function(){
//   console.log('batch done!');
//});