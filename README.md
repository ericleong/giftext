giftext
=======

Renders an animated 3d text [gif](http://en.wikipedia.org/wiki/Graphics_Interchange_Format) in [node.js](http://nodejs.org).

prepare
-------

### Requirements

* [Cairo](http://cairographics.org/)
* [rgb2gif](http://wwwcdf.pd.infn.it/libgif/rgb2gif.html) (or [gif2rgb](http://giflib.sourceforge.net/gif2rgb.html)) found in [giflib](http://giflib.sourceforge.net/)
* [canvas](https://github.com/Automattic/node-canvas)
* [gifsicle](http://www.lcdf.org/gifsicle/)

The locations of `rgb2gif` and `gifsicle` can be set with a local `config.json`, in this format

```
{
	"rgb2gif": "<path-to-rgb2gif>",
	"gifsicle": "<path-to-gifsicle>"
}
```

Otherwise they are assumed to be in the default `PATH`.

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
