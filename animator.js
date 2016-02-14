/// <reference path="typings/node/node.d.ts"/>
'use strict';

var vm = require('vm');
var fs = require('fs');
global.THREE = require('three');
var child_process = require('child_process');

vm.runInThisContext(fs.readFileSync('./three/examples/js/renderers/Projector.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/examples/js/renderers/CanvasRenderer.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/core/Curve.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/core/CurvePath.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/core/Font.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/core/Path.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/core/Shape.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/ArcCurve.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/CatmullRomCurve3.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/ClosedSplineCurve3.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/CubicBezierCurve.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/CubicBezierCurve3.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/EllipseCurve.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/LineCurve.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/LineCurve3.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/QuadraticBezierCurve.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/QuadraticBezierCurve3.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/SplineCurve.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/curves/SplineCurve3.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/ShapeUtils.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/geometries/ExtrudeGeometry.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/geometries/TubeGeometry.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/src/extras/geometries/TextGeometry.js', 'utf-8'));
vm.runInThisContext(fs.readFileSync('./three/examples/js/utils/GeometryUtils.js', 'utf-8'));

// this is a modified helvetiker
var fontFile = fs.readFileSync('./three/examples/fonts/helvetiker_regular.typeface.js', 'utf-8')
var font = new THREE.Font(JSON.parse(fontFile.substring(65, fontFile.length - 2)));

function ThreeDTexter(canvas) {

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
				curveSegments: 4,
				bevelEnabled: false,
				font: font,
				weight: 'normal',
				style: 'normal',
				textColor: 0x3f6375,
				sideColor: 0xb85dd4
			}
		},
		wavePosition: 0,
		waveAngle: Math.PI / 6,
		rotationRate: Math.PI / 60,
		numFrames: 23,
		delay: 84,
		axis: 'wave'
	};

	this.setup = function(){
		opts.camera = new THREE.PerspectiveCamera( 60, 2, 50, 2000 );
		opts.camera.position.set( 0, 0, 500 );
		opts.scene = new THREE.Scene();

		var ambientLight = new THREE.AmbientLight(0xffffff);
		opts.scene.add(ambientLight);

		var dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
		dirLight.position.set(0.25, 1, 0).normalize();
		opts.scene.add(dirLight);
		
		// material
		opts.text.options.textMaterial = new THREE.MeshPhongMaterial({
			color: opts.text.options.textColor,
			shading: THREE.FlatShading,
			specular: 0x222222,
			shininess: 50,
			// ambient: opts.text.options.textColor,
			overdraw: 0.4
		});
		opts.text.options.sideMaterial = new THREE.MeshPhongMaterial({
			color: opts.text.options.sideColor,
			shading: THREE.SmoothShading,
			specular: 0x222222,
			shininess: 50,
			// ambient: opts.text.options.sideColor,
			overdraw: 0.4
		});

		var materials = [opts.text.options.sideMaterial, opts.text.options.textMaterial];
		opts.text.options.material = new THREE.MeshFaceMaterial(materials);
		
		// cache alphanumeric characters
		opts.text.alphanumeric = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		opts.text.cache = {};
		
		for (var i = 0; i < opts.text.alphanumeric.length; i++) {
			var letter = opts.text.alphanumeric[i];
			opts.text.cache[letter] = new THREE.TextGeometry(letter, opts.text.options);
			opts.text.cache[letter].computeBoundingBox();
		}
	};

	this.drawTextInternal = function(text, text_options){

		if (text_options != null){
			for (var opt in text_options){
				opts.text.options[opt] = text_options[opt];
			}
		}

		// text
		if (opts.axis == 'wave' || opts.axis == 'spin') {
			var width = 0;
			var text3d = new THREE.Object3D();

			// THREE.Font.size = opts.text.options.size;
			// THREE.Font.divisions = opts.text.options.curveSegments;

			// THREE.Font.face = opts.text.options.font;
			// THREE.Font.weight = opts.text.options.weight;
			// THREE.Font.style = opts.text.options.style;

			for (var i = 0; i < text.length; i++) {

				// var offset = THREE.Font.drawText(text[i]).offset;
				var offset = 0;

				if (text[i] == ' ') {
					width += offset * 2;

					continue;
				}

				var letter3d;
				var index = opts.text.alphanumeric.indexOf(text[i]);
				if (index >= 0) {
					letter3d = opts.text.cache[text[i]].clone();
				} else {
					letter3d = new THREE.TextGeometry(text[i], opts.text.options);
				}
				letter3d.computeBoundingBox();

				opts.verticalOffset = -0.5 * (letter3d.boundingBox.max.y - letter3d.boundingBox.min.y);

				var mesh = new THREE.Mesh(letter3d, opts.text.options.material);
				mesh.position.x = width;
				mesh.position.z = -opts.text.options.height / 2;

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

			this.setAnimation(opts.axis);
			
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

			// var centerOffset = -THREE.Font.drawText(text).offset;
			var centerOffset = 0;

			opts.width = Math.min(Math.max(0.5 * (text3d.boundingBox.max.x - text3d.boundingBox.min.x), 500), 1000);

			opts.mesh = new THREE.Mesh(text3d,  opts.text.options.material);

			opts.mesh.position.x = centerOffset;

			for (var face in opts.mesh.geometry.faces) {
				if (opts.mesh.geometry.faces[face].normal.z != 0) {
					opts.mesh.geometry.faces[face].materialIndex = 1;
				}
			}

			this.setAnimation(opts.axis);

			opts.text.canvas = opts.mesh;
		}
		
		return text;
	};

	this.setAnimation = function(axis) {
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
	};

	var self = this;

	this.setupCanvas = function(){

		opts.group = new THREE.Object3D();
		opts.scene.add(opts.group);

		opts.canvas = canvas;

		opts.renderer = new THREE.CanvasRenderer({
			canvas: canvas,
			alpha: true
		});
	};
	
	this.serve = function(width, height, frame, out, callback){

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

		var startValue = 0;

		if (opts.axis == 'x') {
			startValue = opts.group.rotation.x;
		} else if (opts.axis == 'y') {
			startValue = opts.group.rotation.y;
		} else if (opts.axis == 'wave') {
			startValue = opts.wavePosition;
		} else if (opts.axis == 'spin') {
			for (var i = 0; i < opts.mesh.children.length; i++) {
				startValue = opts.mesh.children[i].rotation.y;
				break;
			}
		}

		var value = startValue + frame * dAngle;

		if (opts.axis == 'x') {
			opts.group.rotation.x = value;
		} else if (opts.axis == 'y') {
			opts.group.rotation.y = value;
		} else if (opts.axis == 'wave') {
			opts.wavePosition = value;

			for (var i = 0; i < opts.mesh.children.length; i++) {
				opts.mesh.children[i].position.y = opts.text.options.size * Math.sin(opts.wavePosition + opts.waveAngle * i);
			}
		} else if (opts.axis == 'spin') {
			for (var i = 0; i < opts.mesh.children.length; i++) {
				opts.mesh.children[i].rotation.y = value;
			}
		}

		opts.renderer.render(opts.scene, opts.camera);

		out.write(new Buffer(opts.canvas.getContext('2d').getImageData(0, 0, width, height).data));
		
		callback();
	};

	this.reset = function() {
		opts.group.rotation.x = 0;
		opts.group.rotation.y = 0;
	};
   
	// actually init
	this.setup();
	this.setupCanvas();

	this.setText = function(text, options){
		if (opts.text.text != text) {
			opts.text.text = text;

			opts.group.remove(opts.text.canvas);
			if (text != null && text.length > 0) {
				self.drawTextInternal(text, options);
				opts.group.add(opts.text.canvas);
			}
		}
	};
	this.setColor = function(front, side, background, opaque) {
		opts.text.options.textColor = front;
		opts.text.options.sideColor = side;

		opts.text.options.textMaterial.color = new THREE.Color(front);
		opts.text.options.textMaterial.ambient = new THREE.Color(front);
		opts.text.options.sideMaterial.color = new THREE.Color(side);
		opts.text.options.sideMaterial.ambient = new THREE.Color(side);

		if (opaque) {
			opts.renderer.setClearColor(background, 1);
		} else {
			opts.renderer.setClearColor(0xffffff, 0);
		}
	};
	this.setAxis = function(axis) {
		if (axis != opts.axis) {
			self.reset();

			opts.axis = axis;
		}
	};
};

var create = function(canvas) {
	return new ThreeDTexter(canvas);
};

module.exports = create;