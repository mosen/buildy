/**
 * Built in task test case - template
 */
var assert = require('assert'),
    Queue = require('../lib/buildy/queue'),
    State = require('../lib/buildy/state'),
    testmethods = require('../lib/buildy/tasks/handlebars').testing,
    fixtures = {
        files : ['./test/fixtures/test_concat_a.js'],
        string : 'foo',
        strings : ['foo', 'bar'],
        template_file : './test/fixtures/test.handlebars',
        template_file_array : './test/fixtures/testarray.handlebars',
        template : '{{content}}'
    },
    handleTaskFailure = function(result, assert) {
        assert.fail('A task has failed in the test queue: ' + result.queue + ', result: ' + result.result);
    };

module.exports = {

    // Smoke test

    'test template (smoke test)' : function(beforeExit, assert) {
        var q = new Queue('test-template');

        q.task('files', fixtures.files).task('template', { template: fixtures.template })
         .task('inspect');
        q.run();
    },

    // Test all input types

    'test template input files' : function(beforeExit, assert) {
        var q = new Queue('test-template-input-files');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.FILES, fixtures.files);

        q.task('template', { template_file: fixtures.template_file_array }).task('inspect').run();

        beforeExit(function() {
            assert.equal(q._state.get().value, 'a', 'assert state is template output ' + q._state.get().value);
            assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string ' + q._state.get().type);
        });
    },

    'test template input strings' : function(beforeExit, assert) {
        var q = new Queue('test-template-input-strings');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRINGS, fixtures.strings);

        q.task('template', { template_file: fixtures.template_file_array }).task('inspect').run();

        beforeExit(function() {
            assert.equal(q._state.get().value, 'foobar', 'assert state is template output ' + q._state.get().value);
            assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string ' + q._state.get().type);
        });
    },

    'test template input string' : function(beforeExit, assert) {
        var q = new Queue('test-template-input-string');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();
        q._state.set(State.TYPES.STRING, fixtures.string);

        q.task('template', { template_file: fixtures.template_file }).task('inspect').run();

        beforeExit(function() {
            assert.equal(q._state.get().value, fixtures.string, 'assert state is template output ' + q._state.get().value);
            assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string ' + q._state.get().type);
        });
    },

    'test template input undefined' : function(beforeExit, assert) {
        var q = new Queue('test-template-input-undefined');

        q.on('taskFailed', function(result) { handleTaskFailure(result, assert); });

        // Mock state
        q._state = new State();

        q.task('template', { template_file: fixtures.template_file, template_vars : { content: fixtures.string } }).task('inspect').run();

        beforeExit(function() {
            assert.equal(q._state.get().value, fixtures.string, 'assert state is template output ' + q._state.get().value);
            assert.equal(q._state.get().type, State.TYPES.STRING, 'assert state is type:string ' + q._state.get().type);
        });
    },

    // Test specific functionality

    'test applyHandlebarsTemplate accepts string template' : function(beforeExit, assert) {
        var templateOutput = '';

        function doneTemplating(err, output) {
            if (!err) {
                templateOutput = output;
            } else {
                assert.fail('Templating failed: ' + err);
            }
        }

        testmethods.applyHandlebarsTemplate({
            template: fixtures.template,
            encoding: 'utf8',
            template_vars: { content: 'replacement content' }
        }, doneTemplating);

        beforeExit(function() {
            assert.notEqual(templateOutput, '', 'Templating output has been produced');
        });
    },

    'test applyHandlebarsTemplate accepts file template' : function(beforeExit, assert) {
        var templateOutput = '';

        function doneTemplating(err, output) {
            if (!err) {
                templateOutput = output;
            } else {
                assert.fail('Templating failed: ' + err);
            }
        }

        testmethods.applyHandlebarsTemplate({
            template_file: fixtures.template_file,
            encoding: 'utf8',
            template_vars: { content: 'replacement content' }
        }, doneTemplating);

        beforeExit(function() {
            assert.notEqual(templateOutput, '', 'Templating output has been produced');
        });
    }

    // Older tests to convert

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
};
