// This is an example build file for buildy which showcases a few of its built in features.
var Queue = require('buildy/lib/queue').Queue,
    q = new Queue('build my stuff'),
    Buildy = require('buildy').Buildy,
    b = new Buildy();
    
    
// build queue
q.task('files', ['./js/test1.js', './js/test2.js']) // all of these synchronous
    .task('concat')
    .task('jslint')
    .task('fork', {
        'debug version' : function(b) {
             this.task('write', { name: './build/test-debug.js' })
             .run(b);
        },
        'raw version' : function(b) {
             this.task('replace', { regex: '^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n', replace: '', flags: 'mg' })
                 .task('fork', {
                     'write raw version' : function(b) {
                        this.task('write', { name: './build/test.js' })
                            .run(b);
                     },
                     'minified version' : function(b) { 
                        this.task('minify')
                            .task('write', { name: './build/test-min.js' })
                            .run(b);
                     }
                 }).run(b);
        }          
    })
    .run(b);


