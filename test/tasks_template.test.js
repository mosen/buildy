/**
 * Built in task test case - template
 */
var assert = require('assert'),
    queue = require('../lib/queue'),
    path = require('path');

module.exports = {
    'test template' : function(beforeExit, assert) {
        var q = new queue.Queue('test-template');

        q.task('files', ['./test/fixtures/test1.js']).task('template', {  });
        q.run();
    }
};

//    'test applyTemplateSync with string' : function(beforeExit, assert) {
//        var templateVars = {
//                content : "template test content"
//            },
//            output = utils.applyTemplateSync(null, './test/fixtures/test.handlebars', templateVars);
//
//        assert.equal(output, templateVars.content);
//    },
//
//    'test applyTemplateSync with file output' : function(beforeExit, assert) {
//        var testfile = './test/temp/testtemplate1.js';
//
//        utils.applyTemplateSync(testfile,
//            './test/fixtures/test.handlebars',
//            { content: "template test content" });
//
//        assert.ok(path.existsSync('./test/temp/testtemplate1.js'));
//
//        beforeExit(function() {
//            fs.unlinkSync(testfile);
//        });
//    },
//
//    // utils.applyTemplate (ASYNC)
//
//    'smoke test applyTemplate' : function(beforeExit, assert) {
//        utils.applyTemplate({
//            template : "{{test}}",
//            model : { "test" : "template test content" }
//        }, function(err, data) {
//           assert.equal(data, "template test content");
//        });
//    },
//
//    'test applyTemplate without correct parameters returns error' : function(beforeExit, assert) {
//        utils.applyTemplate({
//        }, function(err, data) {
//           assert.ok(err); // Err is a truthy value
//        });
//    },
//
//    'test applyTemplate without valid file returns error' : function(beforeExit, assert) {
//        utils.applyTemplate({
//            templateFile : "./test/fixtures/xyzabc.handlebars",
//            model : { "test" : "template test content" }
//        }, function(err, data) {
//           assert.ok(err);
//        });
//    },
//
//    'test applyTemplate with template file input' : function(beforeExit, assert) {
//        var testString = "template test content";
//
//        utils.applyTemplate({
//            templateFile : "./test/fixtures/test.handlebars",
//            model : { "content" : testString }
//        }, function(err, data) {
//            assert.ok(!err);
//            assert.equal(data, testString);
//        });
//    },