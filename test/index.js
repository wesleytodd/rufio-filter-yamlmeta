/* global describe, it, beforeEach */
var filterFactory = require('../');
var assert = require('assert');
var rufio = require('rufio');
var Site = rufio.Site;
var Type = rufio.Type;
var Item = rufio.Item;

describe('yamlMetaFilter', function () {
	var site;
	var type;
	var item;
	beforeEach(function () {
		site = new Site({
			baseDir: __dirname
		});
		type = new Type('post', {
			site: site,
			directory: 'fixtures'
		});
		site.addType(type);
		item = new Item({
			site: site,
			type: type,
			filename: 'test.md'
		});
		type.addItem(item);
	});

	it('should parse some basic meta', function (done) {
		item.addFilter(filterFactory());
		var s = item.load();
		s.resume();
		s.on('end', function () {
			assert.equal(item.year, 2013);
			assert.equal(item.month, 10);
			assert.equal(item.day, 29);
			assert.equal(item.status, 'Draft');
			assert.equal(item.title, 'Something');
			assert.equal(item.slug, 'test');
			assert.equal(item.pathname, '/post/test');
			assert.equal(item.mime, 'text/x-markdown');
			done();
		});
	});

	it('should use custom mime string', function (done) {
		item.addFilter(filterFactory({
			parseMime: 'text/html'
		}));
		var s = item.load();
		s.resume();
		s.on('end', function () {
			assert.equal(item.mime, 'text/html');
			done();
		});
	});
});
