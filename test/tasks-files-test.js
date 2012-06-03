"use strict";

/**
 * vows js test suite
 */

var vows     = require('vows');
var assert   = require('assert');
var temp     = require('temp');
var path     = require('path');
var fixtures = require('./fixtures.js');

var buildy = require('../lib/buildy.js');

vows.describe('Generating a list of files using the "files" task').addBatch({
    'when run in a queue with a single filename' : {
        topic: function() {
            var q = new buildy.Queue('test');

            q.task('files', [fixtures.file]).run();
            return q;
        },
        'the state contains' : {
            'a state type of FILES': function(topic) {
                assert.equal(buildy.State.TYPES.FILES, topic._state.get().type);
            },
            'a state value containing the filename we supplied' : function(topic) {
                assert.equal([fixtures.file], topic._state.get().value);
            }
        }
    }
}).export(module);