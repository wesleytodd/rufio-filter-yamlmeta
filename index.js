var through2 = require('through2');
var path = require('path');
var yaml = require('js-yaml');
var camel = require('camel-case');
var slug = require('slug');
var mime = require('mime');

module.exports = function configureYamlMetaFilter (opts) {
	// Set default options
	opts = opts || {};
	var metaEndTag = opts.metaEndTag || '---';
	var slugifyFnc = opts.slugifyFnc || slug;
	var parseMimeFnc = (function () {
		if (typeof opts.parseMime === 'string') {
			return function () {
				return opts.parseMime;
			};
		}

		if (typeof opts.parseMime === 'function') {
			return opts.parseMime;
		}

		return function (item) {
			if (item.mime) {
				return item.mime;
			}

			return mime.lookup(item.path);
		};
	})();

	return function yamlMetaFilter (item) {
		var _meta = [];
		var meta;

		Object.assign(item, {
			rawMeta: new Buffer(0),
			year: null,
			month: null,
			day: null,
			status: 'Published',
			title: null,
		}, item);

		return through2(function (chunk, enc, done) {
			// If we have already passed the meta, just passthrough
			if (meta) {
				return done(null, chunk);
			}

			// If we have not gotten the meta tag,
			// add to meta and continue
			var metaTagIndex = chunk.indexOf(metaEndTag);
			if (metaTagIndex === -1) {
				_meta.push(chunk);
				return done();
			}

			// We hare reached the meta tag, slice off the part we
			// care about, parse stuff, and pass the rest through
			_meta.push(chunk.slice(0, metaTagIndex + metaEndTag.length));

			// Save the raw meta content
			item.rawMeta = Buffer.concat(_meta);

			try {
				meta = yaml.safeLoad(item.rawMeta.slice(0, item.rawMeta.length - metaEndTag.length));
			} catch (e) {
				return done(e, chunk);
			}

			// camelcase all the meta keys
			for (var i in meta) {
				item.meta[camel(i)] = meta[i];
			}

			// Computed properties
			item.date = new Date(item.meta.date || Date.now());
			item.year = item.date.getFullYear();
			item.month = item.date.getMonth() + 1;
			item.day = item.date.getDate() + 1;
			item.status = item.meta.status || item.status;
			item.title = item.meta.title;
			item.slug = item.meta.slug || slugifyFnc(item.basename);
			item.permalink = item.meta.permalink || item.permalink;
			item.mime = parseMimeFnc(item);

			// Pass through the rest of the data
			done(null, chunk.slice(metaTagIndex + metaEndTag.length));
		});
	};
};
