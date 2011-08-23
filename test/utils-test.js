var vows = require('vows'),
    assert = require('assert'),
    utils = require('buildy/lib/utils');
    
vows.describe('Asynchronous utility functions').addBatch({
    'A template method' : {
        topic: utils.applyTemplate,
        
        'When applied to a string of code, with only itself as a template variable' : {
            topic: function(applyTemplate) {
                console.log(applyTemplate);
                applyTemplate({ template: '{{code}}', model: { code: 'var x = 1;' }}, this.callback);
            },
            'Returns the same code as the input' : function(topic) {
                assert.equal('var x = 1;', topic);
            }
        }
    }  
}).export(module);
