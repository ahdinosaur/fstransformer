var fs = require('fs')
var readdirp = require('readdirp')
var through = require('through2')
var inputFormatToTransformer = require('inputformat-to-jstransformer')
var inputFormats = require('inputformat-to-jstransformer').dictionary
var jstransformer = require('jstransformer')
var Path = require('path')

module.exports = fsTransformer

function fsTransformer (options) {
  return readdirp(options.input)
    .pipe(through.obj(function (file, enc, cb) {
      fileTransform(file, cb)
    }))
}

function fileTransform (file, cb) {
  var transformer = getFileTransformer(file)
  console.log("transformer", transformer, file.fullPath)
  transformer.renderFileAsync(file.fullPath, {}, {}, function (err, contents) {
    console.log("err", err)
    console.log("contents", contents)
    if (err) { return cb(err) }
    cb(null, file)
  })
}

function getFileTransformer (file) {
  var extension = getFileExtension(file)
  if (!inputFormats[extension]) {
    throw new Error(
      'fstransformer: ' + extension + ' not supported by jstransformer.'
    )
  }
  var transformer = inputFormatToTransformer(extension)
  if (!transformer) {
    throw new Error(
      'fstransformer: ' + extension + ' not installed. ' +
      'install one of: ' + inputFormats[extension].join(', ') + '.'
    )
  }
  return jstransformer(transformer)
}

function getFileExtension (file) {
  return Path.extname(file.path).slice(1)
}
