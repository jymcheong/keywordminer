import { createRequire } from 'module'
const require = createRequire(import.meta.url)
//import {toVFile} from 'to-vfile'

var retext = require('retext');
var pos = require('retext-pos');
var keywords = require('retext-keywords');
var toString = require('nlcst-to-string');
var doc = 'Node.js and MySQL is one of the necessary binding needed for any web application. MySQL is one of the most popular open source database in world and efficient as well. Almost every popular programming language like Java or PHP provides driver to access and perform operations with MySQL. In this tutorial i am trying to cover code for learning and code for production. So if you know this already and looking for ready made code for production. Click here to jump there directly. Introduction: Node.js is rich with number of popular packages registered at package registry called NPM. Most of them are not so reliable to use for production but there are some on which we can rely upon. For MySQL there is one popular driver called node-mysql. In this tutorial i am going to cover following points related to Node.js and MySQL.'

retext()
  .use(pos) // Make sure to use `retext-pos` before `retext-keywords`.
  .use(keywords)
  //.process(toVFile.readSync('example.txt'), done)
  .process(doc) // works on text block too
  .then((file) => {
    console.log('Keywords:')
    file.data.keywords.forEach(function(keyword) {
      console.log("\t" + toString(keyword.matches[0].node))
    })

    console.log()
    console.log('Key-phrases:')
    file.data.keyphrases.forEach(function(phrase) {
      let p = phrase.matches[0].nodes.map(stringify).join('')
      if(p.indexOf(' ') > 0) console.log("\t" + p)
      function stringify(value) {
        return toString(value)
      }
    })
  })
  

function done(err, file) {
  if (err) throw err
  console.log('Keywords:')
  file.data.keywords.forEach(function(keyword) {
    console.log("\t" + toString(keyword.matches[0].node))
  })

  console.log()
  console.log('Key-phrases:')
  file.data.keyphrases.forEach(function(phrase) {
    let p = phrase.matches[0].nodes.map(stringify).join('')
    if(p.indexOf(' ') > 0) console.log("\t" + p)
    function stringify(value) {
      return toString(value)
    }
  })
}

async function start(inFilePath, odbSession){
  return new Promise(async(resolve, reject) => {
    try { 
      let total = await computeUniqueness(inFilePath);
      updateCapturedFile(odbSession,inFilePath,total)
      resolve(total)
    }
    catch(err){
      reject(err)
    }
  })
}