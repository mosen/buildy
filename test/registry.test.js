var assert = require('assert'),
    Registry = require('../lib/buildy/registry'),
    util = require('util');

module.exports = {

    // Registry.add

    'test adding a task directly with no spec fails with an exception' : function(beforeExit, assert) {
        var r = new Registry();
        assert.throws(function() {
            r.add('nospectask');
        }, Error, 'exception thrown when not providing a spec');
    },

    'test adding a task directly with invalid spec fails with a warning' : function(beforeExit, assert) {
        var r = new Registry();
        assert.throws(function() {
            r.add('task', {});
        }, TypeError, 'exception thrown when attempting to add an invalid task specification');
    },

    // Registry.load

    'test load with single directory' : function(beforeExit, assert) {
        var r = new Registry();
        r.load(__dirname + '/../lib/buildy/tasks');

        assert.notEqual(r._tasks.concat, undefined, "tasks list contains the concat task.");
    },

    'test load with single filename' : function(beforeExit, assert) {
        var r = new Registry();
        r.load(__dirname + '/../lib/buildy/tasks/concat.js');
    },

    'test loading non-existent directory of tasks fails with warning' : function(beforeExit, assert) {
        var r = new Registry();

        try {
            r.load('./directory/that/does/not/exist');
        } catch (e) {
            util.log('failed with exception');
        }
    },

    // Registry.task

    'test retrieving concat task' : function(beforeExit, assert) {
        var r = new Registry();
        r.load(__dirname + '/../lib/buildy/tasks');

        var c = r.task('concat');
        assert.equal(typeof c, "function");
    }
}