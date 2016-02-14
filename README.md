giftext
=======

Renders an animated 3d text [gif](http://en.wikipedia.org/wiki/Graphics_Interchange_Format) in [node.js](http://nodejs.org).

prepare
-------

### Requirements

* [Cairo](http://cairographics.org/)
* [canvas](https://github.com/Automattic/node-canvas)
* [ImageMagick](http://www.imagemagick.org/script/index.php)

ImageMagick's `convert` is assumed to be in the default `PATH`.

Install node.js dependencies with
```
$ npm install
```
If necessary, the port can be set with the `PORT` environment variable, otherwise, it defaults to `8080`.

### Optional

[memjs](https://github.com/alevy/memjs) is used to interface with [memcached](http://memcached.org/) for caching.

run
---

### Local

Start the server with 
```
$ node app.js
```
and visit `localhost:8080` in your browser.

### Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy)

inspiration
-----------
Based off of [3dtexter](https://github.com/ericleong/3dtexter), a browser-based 3d text generator originally built at PennApps Fall 2013.
