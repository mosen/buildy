var assert = require('assert'),
    winston = require('../node_modules/winston'),
    Registry = require('../lib/buildy/registry'),
    State = require('../lib/buildy/state'),
    Queue = require('../lib/buildy').Queue,

    fs = require('fs'),
    path = require('path');

module.exports = {
    'smoke test single task queue' : function(beforeExit, assert) {
        var q = new Queue('test1');
        q.task('inspect');
        q.run();
    },

    'test queue accepts a logger option' : function(beforeExit, assert) {
        var testLogger = new winston.Logger();

        var q = new Queue('options-logger', {
            logger: testLogger
        });

        assert.equal(testLogger, q._logger, "Queue is storing our supplied instance of logger");
    },

    'test queue accepts a registry option' : function(beforeExit, assert) {
        var testRegistry = new Registry();

        var q = new Queue('options-registry', {
            registry: testRegistry
        });

        assert.equal(testRegistry, q.registry, "Queue is storing our supplied instance of registry");
    },

    'test queue accepts a supplied initial state' : function(beforeExit, assert) {
        var testState = new State();

        var q = new Queue('options-state', {
            state: testState
        });

        assert.equal(testState, q._state, "Queue is storing our supplied instance of state");
    },

    'test queue accepts one added task' : function(beforeExit, assert) {
        var q = new Queue('task-basic');
        q.task('inspect');
    },

    'test adding a task to queue returns the same queue' : function(beforeExit, assert) {
        var q = new Queue('task-returnself');
        q2 = q.task('inspect');

        assert.equal(q2, q, "Adding a task returns the same instance of Queue");
    },

    'test queue forks are executed' : function(beforeExit, assert) {
        var q = new Queue('parentqueue');
        var forkone_done = false,
            forktwo_done = false;

        q._fork({
            "forkone" : function forkOne() {
                forkone_done = true;
            },
            "forktwo" : function forkTwo() {
                forktwo_done = true;
            }
        });

        beforeExit(function() {
            assert.ok(forkone_done, "Fork number one was executed.");
            assert.ok(forktwo_done, "Fork number two was executed.");
        });
    },

    'test queue forks are executed in the context of a queue' : function(beforeExit, assert) {
        var q = new Queue('parentqueue');
        var forkone_context_queue = false;

        q._fork({
            "forkone" : function forkOne() {
                forkone_context_queue = this instanceof Queue;
            }
        });

        beforeExit(function() {
            assert.ok(forkone_context_queue, "Fork number one was executed in the context of a Queue object.");
        });
    },

    // TODO: test subqueue in fork correctly receives queue stack.

    // TODO: .run() coverage

    // TODO: _exec() coverage

    'test attempting to advance past the end of the queue does not throw an error' : function(beforeExit, assert) {
        var q = new Queue('queueposition-test');
        q.next();
        q.next();
    }

    // TODO: task complete/failed handlers
}