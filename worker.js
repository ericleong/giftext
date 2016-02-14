'use strict';

var ThreeDTexter = require('./animator.js');
var Canvas = require('canvas');
var texter = ThreeDTexter(new Canvas(400, 150));

process.on('message', function(message) {
	texter.setColor(message.options.color.front, message.options.color.side, message.options.color.background, message.options.color.opaque);
	texter.setAxis(message.options.axis);
	texter.setText(message.options.text);

	texter.serve(message.options.width, message.options.height, message.frame, process.stdout, function() {
		process.send(message.frame);
	});
});