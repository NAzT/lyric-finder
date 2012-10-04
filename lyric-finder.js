var google = require('google')
var jsdom = require('jsdom')
var _ = require('lodash')
var url = require('url')
var path = require('path')
  , fs = require('fs')
  , lib  = path.join(path.dirname(fs.realpathSync(__filename)), '/lib')
  , jquery = fs.readFileSync(lib + "/jquery-1.7.2.min.js").toString()
var args = process.argv.slice(2)
  , argc = args.length
var Processor

Processor = function() {
  var urlList
  var processor = {}
  var processorList
  var process
  var mapped
  var $

  processor['metrolyrics.com'] = function () {
    var content
      , hasLink
      , forPrint = ''
    $('#lyrics-body p br').parent().contents().each(function (k, obj) {
        content = obj.textContent
        hasLink = content.indexOf("From:") !== -1
        if (obj._nodeName === 'br') {
          forPrint += "\n\n"
        }
        else if (obj._nodeName === 'span' && !hasLink) {
          forPrint += content
          forPrint += "\n"
        }
    })
    return forPrint
  }

  processorList = _.keys(processor)

  process = function() {
    mapped = urlList.filter(function(obj) {
      if (!obj.link) { return false }
      var hostname = url.parse(obj.link).hostname
        , startWithPrefix = /^www.(.*)/g
        , match = startWithPrefix.exec(hostname)
      obj.processor = match && match[1]
      return match && _.contains(processorList, match[1])
    })
  }

  this.setLinks = function(urls) {
    urlList = urls
    process()
  }

  this.getReqObj = function () {
    return mapped[0]
  }

  this.getLyric = function (jQuery) {
    // bind jQuery
    $ = jQuery

    var processorName = mapped[0].processor
      , processed = processor[processorName]()

    return processed
  }
}

function findLyric (keyword, callback) {
    google(keyword, function (err, next, links) {
        var reqObj
          , processor = new Processor
          , error = true

        if (err) {
          console.error(err)
        }
        else {
            processor.setLinks(links)
            reqObj = processor.getReqObj()
            if (!reqObj) {
              callback && callback(error, "Not Found")
            }
            jsdom.env({
              html: reqObj.link,
              src: [ jquery ],
              done: function(errors, window) {
                var $ = window.$
                  , content
                  , hasLink
                var lyric = processor.getLyric($)
                callback && callback(!error, lyric)
              }
            })
        }
    })
}

exports.findLyric = findLyric