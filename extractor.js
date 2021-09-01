var retext = require('retext');
var pos = require('retext-pos');
var keywords = require('retext-keywords');
var toString = require('nlcst-to-string');

exports.extract = async function(doc){
  return new Promise(async(resolve) => {
    retext()
    .use(pos) // Make sure to use `retext-pos` before `retext-keywords`.
    .use(keywords)
    .process(doc) // works on text block too
    .then((file) => {
      console.log('Keywords:')
      let words = ""
      file.data.keywords.forEach(function(keyword) {
        console.log("\t" + toString(keyword.matches[0].node))
        words += (toString(keyword.matches[0].node).toLowerCase() + '|')
      })

      console.log()
      console.log('Key-phrases:')
      file.data.keyphrases.forEach(function(phrase) {
        let p = phrase.matches[0].nodes.map(stringify).join('')
        if(p.indexOf(' ') > 0) {
           console.log("\t" + p)
           words += (p.toLowerCase() + '|')
        }
        function stringify(value) {
          return toString(value)
        }
      })
      resolve(words)
    })
  })
}


