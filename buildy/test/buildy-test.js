var vows = require('vows'),
    assert = require('assert'),
    Buildy = require('buildy').Buildy,
    buildy = new Buildy();
    
vows.describe('Basic Tasks').addBatch({
    'when calling files with a single string' : {
        topic: function() { return buildy.files('fileA.js'); },
        
        'the buildy type is Buildy.TYPES.FILES' : function(topic) {
            assert.equal(topic._type, Buildy.TYPES.FILES);
        },
        
        'the string gets wrapped into an array' : function(topic) {
            assert.isArray(topic._input);
        }
    }
    
}).run();