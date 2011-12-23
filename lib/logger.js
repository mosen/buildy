/**
 * Make a preconfigured logger available for use.
 */

var winston = require('winston');

var defaultLoggerCfg = {
    levels : {
        failure: 0,
        warning: 1,
        task: 2,
        info: 3,
        debug: 4
    },
    colors : {
        task: 'cyan',
        failure: 'red',
        warning: 'yellow',
        info: 'italic',
        debug: 'grey'
    }
};

var defaultLogger = new (winston.Logger)({ levels: defaultLoggerCfg.levels });
//defaultLogger.addColors( defaultLoggerCfg.colors );
defaultLogger.add(winston.transports.Console, { colorize: false, level: 0 });

exports.defaultLogger = defaultLogger;

exports.attachQueue = function(logger, queue) {
    queue.on('queueStarted', function(details) {
        logger.log('task', 'Queue started', details);
    });

    queue.on('queueComplete', function(details) {
        logger.log('task', 'Queue complete', details);
    });

    queue.on('queueFailed', function(details) {
        logger.log('failure', 'Queue failed', details);
    });

    queue.on('taskStarted', function(details) {
        logger.log('task', 'Task started', details);
    });

    queue.on('taskComplete', function(details) {
        logger.log('task', 'Task complete', details);
    });

    queue.on('taskFailed', function(details) {
        logger.log('failure', 'Task failed', details);
    });

};