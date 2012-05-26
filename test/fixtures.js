/**
 * Shared test suite fixtures.
 */

var path = require('path');

var fixtures = module.exports = {
    nonexistent        : './fixtures/non-existent-dir/non-existent-file',
    file               : path.join(__dirname, 'fixtures', 'test1.js'),
    fileregex          : /test1.js/,
    directory          : path.join(__dirname, 'fixtures', 'dir'),
    directory_relative : path.join('.', 'fixtures', 'dir'),
    glob               : path.join(__dirname, 'fixtures', 'test*.js')
};