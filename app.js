/// <reference path="typings/node/node.d.ts"/>
'use strict';

var child_process = require('child_process');

var Color = require('color');
var async = require('async');

var streamBuffers = require('stream-buffers');

var memjs = require('memjs');
var client = memjs.Client.create();

var generating = {}; // pub/sub exposing pub existence

var express = require('express');
var app = express();

// set up config
var config = {};
try {
	config = require('./config.json');
} catch (err) {
	// do nothing
}
config['rgb2gif'] = config['rgb2gif'] === undefined ? 'rgb2gif' : config['rgb2gif'];
config['gifsicle'] = config['gifsicle'] === undefined ? 'gifsicle' : config['gifsicle'];

var numCPUs = require('os').cpus().length;
var workerPool = [];

// server routes

app.get('/', function (req, res) {
	res.redirect('/giftext.gif');
});

app.get('/:text.gif', function (req, res) {
	gif(res, req.params.text.replace('+', ' '));
});

app.get('/:text', function (req, res) {
	res.redirect('/' + req.params.text + '.gif');
});

var server = app.listen(process.env.PORT || 8080);

function gif(res, text) {
	client.get(text, function(err, val) {
		if (val) {
			res.setHeader('content-type', 'image/gif');
			res.end(val);
		} else if (generating[text]) {
			generating[text].push(function(result) {
				res.setHeader('content-type', 'image/gif');
				res.end(result);
			});
		} else {
			render(res, text, 400, 150);
		}
	});
}

function render(res, text, width, height) {

	generating[text] = [];

	var buffer = new streamBuffers.WritableStreamBuffer({
		initialSize: 200 * 1024
	});

	// hue
	var hue = Math.random() * 360;

	// colors
	var front = Color().hsv(hue, 100, 95);
	var side = Color().hsv((hue + 30 * Math.random() + 165) % 360, 80, 80);

	// stream the results as they are available
	res.setHeader('content-type', 'image/gif');
	res.setHeader('transfer-encoding', 'chunked');

	var gifsicle = child_process.spawn(config.gifsicle, 
		['--multifile', '-d', '8', '--loopcount', '--colors', '256'], {
		stdio: ['pipe', 'pipe', process.stderr]});
	gifsicle.stdout.pipe(res);
	gifsicle.stdout.pipe(buffer);

	gifsicle.stdout.on('end', function() {
		var contents;

		if (buffer && buffer.size() > 0) {
			contents = buffer.getContents();

			// cache the result
			client.set(text, contents, null, 600);
		}

		// notify subscribers
		if (generating[text] && generating[text].length > 0) {
			for (var listener in generating[text]) {
				generating[text][listener](contents);
			}
		}

		// remove publisher
		generating[text] = null;
	});

	var options = {
		color: {
			front: front.rgbNumber(),
			side: side.rgbNumber(), 
			background: 0xffffff, 
			opaque: true
		},
		text: text,
		axis: Math.random() > 0.5 ? 'y' : 'wave',
		width: width,
		height: height
	};

	var frames = [];

	for (var frame = 0; frame <= 23; frame++) {
		frames.push(frame);
	}

	async.mapLimit(frames, numCPUs, function(frame, callback) {
		var worker = workerPool.shift();
		var buffer = new streamBuffers.WritableStreamBuffer({
			initialSize: 200 * 1024
		});

		if (!worker) {
			worker = child_process.spawn(
				'node',
				['./worker.js', config['rgb2gif']],
				{
					stdio: ['ipc', 'pipe', process.stderr]
				}
			);
		}

		worker.stdout.pipe(buffer);

		var listener = function(response) {
			worker.removeListener('message', listener);
			workerPool.push(worker);
			callback(null, buffer.getContents());
		};

		worker.on('message', listener);

		worker.send({
			options: options,
			frame: frame
		});
	}, function(err, results) {

		for (var r = 0; r < results.length; r++) {
			gifsicle.stdin.write(results[r]);
		}

		gifsicle.stdin.end();
	});
}