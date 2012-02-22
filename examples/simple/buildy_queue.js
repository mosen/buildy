/**
 * This is a basic example of how you could process files in your web application for deployment.
 *
 * It creates and runs 3 different queues to show you some of the tasks you COULD use in a build process.
 *
 * Each queue is an independent process, and as such will run asynchronously to every other queue.
 * The same principal applies to children of fork tasks, because when you execute the fork it's essentially 2 new queues.
 */

var Queue = require('../../../buildy').Queue; // At a minimum you need to include Queue

/**
 * Build a javascript component.
 *
 * In this queue there are three different versions of the script:
 *
 * - test-debug.js, which includes the original source.
 * - test.js, which includes the source stripped of logger statements.
 * - test-min.js, which has been compressed and obfuscated.
 *
 * The jslint task happens asynchronously because it doesn't produce any output, so the concat task may take over
 * before jslint is finished.
 */
new Queue('build my component').task('files', ['js/*']) // all of these synchronous
    .task('jslint')
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

/**
 * Build a skin component.
 *
 * This queue is very similar to the one above for processing javascript, but simply uses the css equivalents of most
 * of those tasks.
 */
new Queue('build my skins').task('files', ['./css/test1.css', './css/test2.css'])
    .task('concat')
    .task('csslint')
    .task('fork', {
        'raw css version' : function() {
            this.task('write', { name: './build/test.css' }).run();
        },
        'minified css version' : function() {
            this.task('cssminify').task('write', { name: './build/test-min.css' }).run();
        }
    }).run();

/**
 * If you just need to deploy certain files into the destination folder you can use the copy task.
 * It can take an array of sources, with globs mixed in.
 */
new Queue('copy raw css').task('copy', {
    src : ['css/*'],
    dest : 'build/copytest',
    excludes : ['js/'],
    recursive : true
}).run();