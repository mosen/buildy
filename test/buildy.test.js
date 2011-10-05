var Buildy = require('buildy').Buildy,
    path   = require('path'),
    events = require('events');

module.exports = {
    'smoke test files' : function(beforeExit, assert) {
        var b = new Buildy(),
            promise = new events.EventEmitter();

        promise.on('complete', function(result) {
            assert.ok(true);
        });

        promise.on('failed', function() {
            assert.ok(false);
        });

        b.files(['./test/fixtures/test1.js', './test/fixtures/test2.js'], promise);
    },

    'smoke test write' : function(beforeExit, assert) {
        var b = new Buildy(),
            promise = new events.EventEmitter(),
            outputFile = "./test/temp/test.js";

        promise.on('complete', function() {
           assert.ok(path.existsSync(outputFile));
        });

        promise.on('failed', function() {
           assert.ok(false);
        });

        b._type = Buildy.TYPES.STRING;
        b._state = "Test file output string";
        b.write({ name: outputFile }, promise);

    },

    'smoke test replace' : function(beforeExit, assert) {
        var b = new Buildy(),
            promise = new events.EventEmitter();

        promise.on('complete', function() {
           assert.equal(b._state, "a");
        });

        promise.on('failed', function() {
           assert.ok(false);
        });

        b._type = Buildy.TYPES.STRING;
        b._state = "console.log";
        b.replace({
            replace : "a",
            regex : "console.log"
        }, promise);
    },

    'smoke test log' : function(beforeExit, assert) {
        var b = new Buildy(),
            promise = new events.EventEmitter();

        promise.on('complete', function() {
            assert.ok(true);
        });

        promise.on('failed', function() {
            assert.ok(false);
        });

        b._type = Buildy.TYPES.STRING;
        b._state = "log this";
        b.log(null, promise);
    },

    'test exec' : function(beforeExit, assert) {

    }
};