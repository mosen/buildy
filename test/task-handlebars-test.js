// Mocha test suite
var Queue = require('../lib/buildy/queue.js');
var Registry = require('../lib/buildy/registry');
var State = require('../lib/buildy/state');

var path = require('path');
var should = require('should');
var fixtures = require('./fixtures.js');
var temp = require('temp');
var assert = require('assert');
var util = require('util');

describe('task:handlebars ', function() {

    describe('when templating a string using a string template', function() {

        it('should not callback with an error', function(done) {

            var q = new Queue('task:handlebars', {
                state: new State([{ name: 'template-value', string: 'baz' }])
            });

            q.task('handlebars', {
                template: 'foo bar {{content}}'
            }).run(function(err) {
                console.log(err);
                should.not.exist(err);
                done();
            });

        });

        it('should contain a string value with the expected string substitution', function(done) {

            var q = new Queue('task:handlebars', {
                state: new State([{ name: 'template-value', string: 'baz' }])
            });

            q.task('handlebars', {
                template: 'foo bar {{content}}'
            }).run(function(err) {
                should.not.exist(err);
                should.exist(this.state.get('template-value'));

                var v = this.state.get('template-value');
                should.exist(v.string);
                v.string.should.eql('foo bar baz');
                done();
            });

        });
    });

    describe('when templating a string using a template file', function() {

        it('should not callback with an error', function(done) {

            var q = new Queue('task:handlebars', {
                state: new State([{ name: 'template-value', string: 'baz' }])
            });

            q.task('handlebars', {
                template_file: fixtures.template
            }).run(function(err) {
                console.log(err);
                should.not.exist(err);
                done();
            });
        });

    });

});
