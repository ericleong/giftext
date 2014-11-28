'use strict';

var GIFEncoder = require('gifencoder');
var Canvas = require('canvas');

var Color = require('color')
var ThreeDTexter = require('./animator.js');

var streamBuffers = require('stream-buffers');
var lru = require('lru-cache');
var cache = lru(10);

var generating = {}; // pub/sub exposing pub existence

var express = require('express');
var app = express();

app.get('/', function (req, res) {
	res.redirect('/3dtexter.gif');
});

app.get('/:text.gif', function (req, res) {
	gif(res, req.params.text);
});

app.get('/:text', function (req, res) {
	res.redirect('/' + req.params.text + '.gif');
});

var server = app.listen(process.env.PORT || 8080);

function gif(res, text) {
	if (cache.has(text)) {
		res.setHeader('content-type', 'image/gif');
		res.end(cache.get(text));
	} else if (generating[text]) {
		generating[text].push(function() {
			res.setHeader('content-type', 'image/gif');
			res.end(cache.get(text));
		});
	} else {
		render(res, text, 400, 150);
	}
}

function render(res, text, width, height) {

	generating[text] = [];
	
	var texter = ThreeDTexter(new Canvas(width, height));
	var encoder = new GIFEncoder(width, height);
	var buffer = new streamBuffers.WritableStreamBuffer({
		initialSize: 200 * 1024
	});

	// hue
	var hue = Math.random() * 360;

	// colors
	var front = Color().hsv(hue, 100, 95);
	var side = Color().hsv((hue + 30 * Math.random() + 165) % 360, 80, 80);
	texter.api.setColor(front.rgbNumber(), side.rgbNumber(), 0xffffff, true);

	// axis
	texter.api.setAxis(Math.random() > 0.5 ? 'y' : 'wave');

	// text
	texter.api.setText(text);

	// stream the results as they are available
	res.setHeader('content-type', 'image/gif');
	res.setHeader('transfer-encoding', 'chunked');
	var stream = encoder.createReadStream();
	stream.pipe(res);
	stream.pipe(buffer);

	stream.on('end', function() {
		// cache the result
		cache.set(text, buffer.getContents());

		// notify subscribers
		if (generating[text] && generating[text].length > 0) {
			for (var listener in generating[text]) {
				generating[text][listener]();
			}
		}

		// remove publisher
		generating[text] = null;
	});

	// generate gif
	encoder.start();
	encoder.setRepeat(0);
	encoder.setDelay(84); // frame delay in ms
	encoder.setQuality(8); // image quality. 10 is default.

	texter.api.serve(encoder, texter);
}