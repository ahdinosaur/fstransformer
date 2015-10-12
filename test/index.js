var test = require('ava')
var Path = require('path')

var fsTransformer = require('../')

test('single transform', function (t) {
  fsTransformer({
    root: Path.join(__dirname, 'fixtures'),
    transformers: {
      '*.md': [
        ['markdown-it', {}]
      ]
    }
  })
  .on('error', function (err) {
    t.ifError(err)
  })
  .on('end', function () {
    t.end()
  })
  .on('data', function (file) {
    console.log("file", file)
  })
})
