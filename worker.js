var ThreeDTexter = require('./animator.js');
var Canvas = require('canvas');
var texter = ThreeDTexter(new Canvas(400, 150), process.argv[2]);

process.on('message', function(message) {
	texter.api.setColor(message.options.color.front, message.options.color.side, message.options.color.background, message.options.color.opaque);
	texter.api.setAxis(message.options.axis);
	texter.api.setText(message.options.text);

	texter.api.serve(message.options.width, message.options.height, message.frame, process.stdout, function() {
		process.send(message.frame);
	});
});