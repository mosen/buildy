// This is an example build file for buildy which showcases a few of its built in features.
var Queue = require('buildy/lib/queue').Queue,
    Buildy = require('buildy').Buildy,
//    Reporter = require('buildy/lib/reporter').Reporter,
    Logger = require('winston'),
    b = new Buildy();



    
// build a javascript component
new Queue('build my component').task('files', ['./js/*', './js/test2.js']) // all of these synchronous
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

var nq = new Queue('build my skins');
nq._queue = [];
// build a skin component
nq.task('files', ['./css/test1.css', './css/test2.css'])
    .task('concat')
    .task('csslint')
    .task('fork', {
        'raw css version' : function(b) {
            this.task('write', { name: './build/test.css' }).run(b);
        },
        'minified css version' : function(b) {
            this.task('cssminify').task('write', { name: './build/test-min.css' }).run(b);
        }
    }).run(new Buildy());

new Queue('copy test').task('copy', {
    src : ['*'],
    dest : '../copytest',
    excludes : ['css/'],
    recursive : true
}).run(new Buildy());