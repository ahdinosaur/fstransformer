var fs = require('fs')
var readdirp = require('readdirp')
var through = require('through2')
var jstransformer = require('jstransformer')
var Path = require('path')
var defined = require('defined')
var globToRegex = require('minimatch').makeRe
var waterfall = require('run-waterfall')

module.exports = fsTransformer

function fsTransformer (options) {
  var transformers = getTransformers(options.transformers)
  return readdirp({
    root: options.root
  })
  .pipe(through.obj(function (file, enc, cb) {
    var fileTransformers = getFileTransformers(transformers, file)
    if (fileTransformers == null) { return cb() }
    transformFile(file, fileTransformers, cb)
  }))
}

function transformFile (file, transformers, cb) {

  var pipeline = transformers.map(function (transformer) {
    return function transformStep (contents, callback) {
      var tr = transformer[0]
      var trArgs = transformer.splice(1)
      var retBody = function (err, result) {
        if (err) { return callback(err) }
        callback(null, result.body)
      }
      tr.renderAsync.apply(tr,
        [contents].concat(trArgs).concat([retBody])
      )
    }
  })

  pipeline.unshift(function (callback) {
    fs.readFile(file.fullPath, 'utf8', callback)
  })
  
  pipeline.push(function (contents, callback) {
    var outFormat = transformers[transformers.length - 1][0].outputFormat
    var outPath = renameExtname(file.fullPath, outFormat)
    fs.writeFile(outPath, contents, 'utf8', callback)
  })

  waterfall(pipeline, cb)
}

function getFileTransformers (transformers, file) {
  var transformer
  for (var i = 0; i < transformers.length; i++) {
    transformer = transformers[i]
    if (transformer.pattern.test(file.path)) {
      return transformer.transformers
    }
  }
}

function getFileExtension (file) {
  return Path.extname(file.path).slice(1)
}

function getTransformers (optionsTransformers) {
  optionsTransformers = defined(optionsTransformers, {})
  
  return Object.keys(optionsTransformers).map(function (key) {
    var transformers = optionsTransformers[key]

    transformers = transformers.map(function (transformer) {
      if (!Array.isArray(transformer)) {
        throw new Error(
          'fstransformer: expected Array. ' +
          'got ' + JSON.stringify(transformer) + '.'
        )
      }

      if (typeof transformer[0] === 'string') {
        transformer[0] = require('jstransformer-' + transformer[0])
      }

      transformer[0] = jstransformer(transformer[0])

      return transformer
    })

    return {
      pattern: globToRegex(key),
      transformers: transformers
    }
  }) 
}

function renameExtname (path, extname) {
  return Path.join(Path.dirname(path), Path.basename(
    path, Path.extname(path)
  ) + '.' + extname)
}
