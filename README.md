giftext
=======

Renders an animated 3d text [gif](http://en.wikipedia.org/wiki/Graphics_Interchange_Format) in [node.js](http://nodejs.org).

prepare
-------
Get [canvas](https://github.com/Automattic/node-canvas) working first, it depends on [Cairo](http://cairographics.org/).

Install dependencies with
```
$ npm install
```
If necessary, the port can be set with the `PORT` environment variable, otherwise, it defaults to `8080`. 

run
---
Start the server with 
```
$ node app.js
```
and visit `localhost:8080` in your browser.

inspiration
-----------
Based off of [3dtexter](https://github.com/ericleong/3dtexter), a browser-based 3d text generator.