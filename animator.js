'use strict';

if (typeof THREE === 'undefined') {
	var THREE = require('./three/CanvasRenderer.js');
	// this is a modified helvetiker
	THREE.FontUtils.loadFace(require('./three/font/helvetiker_regular.typeface.js'));
}

function ThreeDTexter(canvas){

	this.api = {version: 0.1};

	var opts = this.opts = {
		camera: null,
		group: null,
		scene:  null,
		renderer: null,
		text: {
			canvas: null,
			options: {
				size: 100,
				height: 50,
				hover: 10,
				curveSegments: 5,
				bevelThickness: 4,
				bevelSize: 2,
				bevelEnabled: false,
				font: 'helvetiker',
				weight: 'normal',
				style: 'normal',
				textColor: 0x3f6375,
				sideColor: 0xb85dd4
			}
		},
		wavePosition: 0,
		waveAngle: Math.PI / 6,
		rotationRate: Math.PI / 60,
		rotating: false,
		numFrames: 23,
		delay: 84,
		axis: 'wave'
	};

	var exports = {};

	this.setup = function(){
		opts.camera = new THREE.PerspectiveCamera( 60, 2, 50, 2000 );
		opts.camera.position.set( 0, 0, 500 );
		opts.scene = new THREE.Scene();

		var ambientLight = new THREE.AmbientLight(0xffffff);
		opts.scene.add(ambientLight);

		var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
		dirLight.position.set(0.25, 1, 0).normalize();
		opts.scene.add(dirLight);
	}

	this.drawTextInternal = function(text, text_options){

		if (text_options != null){
			for (var opt in text_options){
				opts.text.options[opt] = text_options[opt];
			}
		}

		// material
		this.makeMaterial();

		var materials = [opts.text.options.sideMaterial, opts.text.options.textMaterial];
		var material = new THREE.MeshFaceMaterial(materials);

		// text
		if (opts.axis == 'wave' || opts.axis == 'spin') {
			var width = 0;
			var text3d = new THREE.Object3D();

			THREE.FontUtils.size = opts.text.options.size;
			THREE.FontUtils.divisions = opts.text.options.curveSegments;

			THREE.FontUtils.face = opts.text.options.font;
			THREE.FontUtils.weight = opts.text.options.weight;
			THREE.FontUtils.style = opts.text.options.style;

			for (var i = 0; i < text.length; i++) {

				var offset = THREE.FontUtils.drawText(text[i]).offset;

				if (text[i] == ' ') {
					width += offset * 2;

					continue;
				}

				var letter3d = new THREE.TextGeometry(text[i], opts.text.options);
				letter3d.computeBoundingBox();

				letter3d.applyMatrix(new THREE.Matrix4().makeTranslation(
					-0.5 * (letter3d.boundingBox.max.x - letter3d.boundingBox.min.x), 0, 
					-opts.text.options.height / 2) );

				opts.verticalOffset = -0.5 * (letter3d.boundingBox.max.y - letter3d.boundingBox.min.y);

				var mesh = new THREE.Mesh(letter3d,  material);
				mesh.position.x = width + 0.5 * (letter3d.boundingBox.max.x - letter3d.boundingBox.min.x);

				width += offset * 2;

				for (var face in mesh.geometry.faces) {
					if (mesh.geometry.faces[face].normal.z != 0) {
						mesh.geometry.faces[face].materialIndex = 1;
					}
				}

				text3d.add(mesh);
			}

			opts.width = Math.min(Math.max(0.5 * width, 500), 1000);

			text3d.translateX(-0.5 * width);
			opts.mesh = text3d;

			this.setAxis(opts.axis);
			
			opts.text.canvas = text3d;
		} else {
			var text3d = new THREE.TextGeometry(text, opts.text.options);
			text3d.computeBoundingBox();
			text3d.computeVertexNormals();

			var triangleAreaHeuristics = 0.1 * ( opts.text.options.height * opts.text.options.size );

			for ( var i = 0; i < text3d.faces.length; i ++ ) {

				var face = text3d.faces[ i ];

				if ( face.materialIndex == 1 ) {

					for ( var j = 0; j < face.vertexNormals.length; j ++ ) {
						face.vertexNormals[ j ].z = 0;
						face.vertexNormals[ j ].normalize();
					}

					var va = text3d.vertices[ face.a ];
					var vb = text3d.vertices[ face.b ];
					var vc = text3d.vertices[ face.c ];

					var s = THREE.GeometryUtils.triangleArea( va, vb, vc );

					if ( s > triangleAreaHeuristics ) {
						for ( var j = 0; j < face.vertexNormals.length; j ++ ) {
							face.vertexNormals[ j ].copy( face.normal );
						}
					}
				}
			}

			var centerOffset = -THREE.FontUtils.drawText(text).offset;

			opts.width = Math.min(Math.max(0.5 * (text3d.boundingBox.max.x - text3d.boundingBox.min.x), 500), 1000);

			opts.mesh = new THREE.Mesh(text3d,  material);

			opts.mesh.position.x = centerOffset;

			for (var face in opts.mesh.geometry.faces) {
				if (opts.mesh.geometry.faces[face].normal.z != 0) {
					opts.mesh.geometry.faces[face].materialIndex = 1;
				}
			}

			this.setAxis(opts.axis);

			opts.text.canvas = opts.mesh;
		}
		
		return text;
	};

	this.makeMaterial = function(){
		opts.text.options.textMaterial = new THREE.MeshPhongMaterial({
			color: opts.text.options.textColor,
			shading: THREE.FlatShading,
			specular: 0x222222,
			shininess: 50,
			ambient: opts.text.options.textColor,
			overdraw: 0.4
		});
		opts.text.options.sideMaterial = new THREE.MeshPhongMaterial({
			color: opts.text.options.sideColor,
			shading: THREE.SmoothShading,
			specular: 0x222222,
			shininess: 50,
			ambient: opts.text.options.sideColor,
			overdraw: 0.4
		});
	};

	this.setAxis = function(axis) {
		if (axis == 'x') {
			opts.camera.position.set(0, 0, opts.width);

			opts.mesh.position.y = -opts.text.options.size / 2;
			opts.mesh.position.z = -opts.text.options.height / 2;
		} else if (axis == 'y') {
			opts.camera.position.set(0, opts.text.options.size / 2, opts.width);

			opts.mesh.position.y = 0;
			opts.mesh.position.z = -opts.text.options.height / 2;

		} else if (axis == 'wave') {
			opts.camera.position.set(0, opts.text.options.size / 2, opts.width);

			for (var i = 0; i < opts.mesh.children.length; i++) {
				opts.mesh.children[i].position.y = opts.text.options.size * Math.sin(opts.wavePosition + opts.waveAngle * i);
			}
		} else if (axis == 'spin') {
			opts.camera.position.set(0, opts.text.options.size / 2, opts.width);

			for (var i = 0; i < opts.mesh.children.length; i++) {
				opts.mesh.children[i].rotation.y = 0;
			}
		}
	}

	var self = this;

	this.setupCanvas = function(){

		opts.group = new THREE.Object3D();

		opts.group.add(opts.text.canvas);
		opts.scene.add(opts.group);

		opts.canvas = canvas;

		opts.renderer = new THREE.CanvasRenderer({
			canvas: canvas,
			alpha: true
		});
	};
	
	var render = this.render = function(){
		opts.renderer.render( opts.scene, opts.camera );
	};

	var animate = this.animate = function(){

		if (opts.rotating) {
			requestAnimationFrame(animate);
			if (opts.axis == 'x') {
				opts.group.rotation.x += opts.rotationRate;
			} else if (opts.axis == 'y') {
				opts.group.rotation.y += opts.rotationRate;
			} else if (opts.axis == 'wave') {
				opts.wavePosition += opts.rotationRate;

				for (var i = 0; i < opts.mesh.children.length; i++) {
					opts.mesh.children[i].position.y = opts.text.options.size * Math.sin(opts.wavePosition + opts.waveAngle * i);
				}
			} else if (opts.axis == 'spin') {
				for (var i = 0; i < opts.mesh.children.length; i++) {
					opts.mesh.children[i].rotation.y += opts.rotationRate;
				}
			}
		}

		render();
	};

	this.api.capture = function(gif, progress){
		var wasAnimating = opts.rotating;

		self.stop();

		opts.mesh.rotation.x = 0;
		opts.mesh.rotation.y = 0;

		opts.wavePosition = 0;
		if (opts.axis == 'wave') {
			for (var i = 0; i < opts.mesh.children.length; i++) {
				opts.mesh.children[i].position.y = opts.text.options.size * Math.sin(opts.wavePosition + opts.waveAngle * i);
			}
		} else if (opts.axis == 'spin') {
			for (var i = 0; i < opts.mesh.children.length; i++) {
				opts.mesh.children[i].rotation.y = 0;
			}
		}

		render();

		var numFrames = opts.numFrames;
		var dAngle = 2 * Math.PI / (numFrames + 1);

		function run_capture(){
			console.log('capturing frame: ' + (opts.numFrames - numFrames));
			gif.addFrame(opts.canvas, {copy: true, delay: opts.delay});
		
			if (opts.axis == 'x') {
				opts.group.rotation.x += dAngle;
			} else if (opts.axis == 'y') {
				opts.group.rotation.y += dAngle;
			} else if (opts.axis == 'wave') {
				opts.wavePosition += dAngle;

				for (var i = 0; i < opts.mesh.children.length; i++) {
					opts.mesh.children[i].position.y = opts.text.options.size * Math.sin(opts.wavePosition + opts.waveAngle * i);
				}
			} else if (opts.axis == 'spin') {
				for (var i = 0; i < opts.mesh.children.length; i++) {
					opts.mesh.children[i].rotation.y += dAngle;
				}
			}

			render();
			if (progress) {
				progress((opts.numFrames - numFrames + 1) / (opts.numFrames + 1));
			}

			setTimeout(function(){
				if (numFrames-- > 0){
					run_capture();
				} else {
					if (wasAnimating) {
						opts.rotating = true;
						self.animate();
					}

					gif.render();
				}
			}, opts.delay);
		}

		run_capture();
	}

	this.api.serve = function(encoder){
		var wasAnimating = opts.rotating;

		self.stop();

		opts.mesh.rotation.x = 0;
		opts.mesh.rotation.y = 0;

		opts.wavePosition = 0;
		if (opts.axis == 'wave') {
			for (var i = 0; i < opts.mesh.children.length; i++) {
				opts.mesh.children[i].position.y = opts.text.options.size * Math.sin(opts.wavePosition + opts.waveAngle * i);
			}
		} else if (opts.axis == 'spin') {
			for (var i = 0; i < opts.mesh.children.length; i++) {
				opts.mesh.children[i].rotation.y = 0;
			}
		}

		var numFrames = opts.numFrames;
		var dAngle;

		if (opts.axis == 'x' || opts.axis == 'y' || opts.axis == 'spin') {
			dAngle = Math.PI / (numFrames + 1);
		} else if (opts.axis = 'wave') {
			dAngle = 2 * Math.PI / (numFrames + 1);
		}

		if (opts.axis == 'y') {
			opts.group.rotation.y = -Math.PI / 2;
		}

		render();

		function run_capture(){
			encoder.addFrame(opts.canvas.getContext('2d'));
		
			if (opts.axis == 'x') {
				opts.group.rotation.x += dAngle;
			} else if (opts.axis == 'y') {
				opts.group.rotation.y += dAngle;
			} else if (opts.axis == 'wave') {
				opts.wavePosition += dAngle;

				for (var i = 0; i < opts.mesh.children.length; i++) {
					opts.mesh.children[i].position.y = opts.text.options.size * Math.sin(opts.wavePosition + opts.waveAngle * i);
				}
			} else if (opts.axis == 'spin') {
				for (var i = 0; i < opts.mesh.children.length; i++) {
					opts.mesh.children[i].rotation.y += dAngle;
				}
			}

			render();

			setTimeout(function(){
				if (numFrames-- > 0){
					run_capture();
				} else {
					if (wasAnimating) {
						opts.rotating = true;
						self.animate();
					}

					encoder.finish();
				}
			}, 0);
		}

		run_capture();
	}

	this.reset = function() {
		opts.group.rotation.x = 0;
		opts.group.rotation.y = 0;
	}

	this.stop = function() {
		self.reset();
		opts.rotating = false;

		render();
	}
   
	// actually init
	this.setup();
	this.drawTextInternal('hello world');
	this.setupCanvas();
	this.render();
	this.animate();

	this.api.setText = function(text, options){
		opts.group.remove(opts.text.canvas);
		if (text != null && text.length > 0) {
			self.drawTextInternal(text, options);
			opts.group.add(opts.text.canvas);
		}
		self.render();
	}
	this.api.setTextOption = function(option, value){
		self.opts.text.options[option] = value;
	}
	this.api.getTextOption = function(option){
		return self.opts.text.options[option];
	}
	this.api.getTextOptions = function(){
		return self.opts.text.options;
	}
	this.api.setColor = function(front, side, background, opaque) {
		opts.text.options.textColor = front;
		opts.text.options.sideColor = side;

		if (opts.axis == 'x' || opts.axis == 'y') {
			opts.mesh.material.materials[0].color.setHex(side);
			opts.mesh.material.materials[1].color.setHex(front);
			opts.mesh.material.materials[0].ambient.setHex(side);
			opts.mesh.material.materials[1].ambient.setHex(front);
		} else if (opts.axis == 'wave' || opts.axis == 'spin') {
			for (var i = 0; i < opts.mesh.children.length; i++) {
				opts.mesh.children[i].material.materials[0].color.setHex(side);
				opts.mesh.children[i].material.materials[1].color.setHex(front);
				opts.mesh.children[i].material.materials[0].ambient.setHex(side);
				opts.mesh.children[i].material.materials[1].ambient.setHex(front);
			}
		}

		if (opaque) {
			opts.renderer.setClearColor(background, 1);
		} else {
			opts.renderer.setClearColor(0xffffff, 0);
		}

		self.render();
	}
	this.api.toggleAnimation = function() {
		opts.rotating = !opts.rotating;

		if (!opts.rotating) {
			self.stop();
		} else {
			self.animate();
		}
	}
	this.api.isAnimating = function() {
		return opts.rotating;
	}
	this.api.setAxis = function(axis) {
		self.reset();

		opts.axis = axis;
	}

	return self;
};

var create = function(canvas) {
	return new ThreeDTexter(canvas);
}

module.exports = create;