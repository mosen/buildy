/**
 * This is a basic example of how you could process files in your web application for deployment.
 *
 */
var Queue = require('buildy/lib/queue').Queue;


/**
 * Build a javascript component.
 *
 * In this queue there are three different versions of the script:
 *
 * - test-debug.js, which includes the original source.
 * - test.js, which includes the source stripped of logger statements.
 * - test-min.js, which has been compressed and obfuscated.
 */
new Queue('build my component').task('files', ['js/*']) // all of these synchronous
//    .task('jslint')
    .task('concat')
    .task('fork', {
        'debug version' : function() {
             this.task('write', { name: './build/test-debug.js' })
             .run();
        },
        'raw version' : function() {
             this.task('replace', { regex: "^.*?(?:logger|Y.log).*?(?:;|\\).*;|(?:\r?\n.*?)*?\\).*;).*;?.*?\r?\n", replace: '', flags: 'mg' })
                 .task('fork', {
                     'write raw version' : function() {
                        this.task('write', { name: './build/test.js' })
                            .run();
                     },
                     'minified version' : function() {
                        this.task('jsminify')
                            .task('inspect')
                            .task('write', { name: './build/test-min.js' })
                            .run();
                     }
                 }).run();
        }          
    })
    .run();

//var nq = new Queue('build my skins');
//nq._queue = [];
//// build a skin component
//nq.task('files', ['./css/test1.css', './css/test2.css'])
//    .task('concat')
//    .task('csslint')
//    .task('fork', {
//        'raw css version' : function(b) {
//            this.task('write', { name: './build/test.css' }).run(b);
//        },
//        'minified css version' : function(b) {
//            this.task('cssminify').task('write', { name: './build/test-min.css' }).run(b);
//        }
//    }).run(new Buildy());

//new Queue('copy test').task('copy', {
//    src : ['css/*'],
//    dest : 'build/copytest',
//    excludes : ['js/'],
//    recursive : true
//}).run(new Buildy());