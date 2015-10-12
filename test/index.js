var test = require('ava')
var Path = require('path')

var fsTransformer = require('../')

test('transform fs', function (t) {
  fsTransformer({
    input: {
      root: Path.join(__dirname, 'fixtures')
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
