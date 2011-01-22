function array_diff () {
    // Returns the entries of arr1 that have values which are not present in any of the others arguments.  
    // 
    // version: 1009.2513, modified by Ravicious
    // discuss at: http://phpjs.org/functions/array_diff
    // license: http://phpjs.org/pages/license/#MIT
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +   improved by: Sanjoy Roy
    // +    revised by: Brett Zamir (http://brett-zamir.me)
    // *     example 1: array_diff(['Kevin', 'van', 'Zonneveld'], ['van', 'Zonneveld']);
    // *     returns 1: ['Kevin'] 
    var arr1 = arguments[0], retArr = [];
    var k1 = '', i = 1, k = '', arr = {};
 
    arr1keys:
    for (k1 in arr1) {
        for (i = 1; i < arguments.length; i++) {
            arr = arguments[i];
            for (k in arr) {
                if (arr[k] === arr1[k1]) {
                    // If it reaches here, it was found in at least one array, so try next value
                    continue arr1keys; 
                }
            }
            retArr.push(arr1[k1]);
        }
    }
 
    return retArr;
}

// BodyParser
// by Łukasz Korecki
// http://coffeesounds.com/
// https://gist.github.com/lukaszkorecki
var BodyParser = (function() {
  var findLinks = /http(s)*:\/\/[0-9a-z\,\;\_\/\.\-\&\=\?\%]+/gi;

  var findUsers = /\^\w{1,}/g;

  var findTags = /#[a-zA-Z0-9ęóąśłżźćń_\-]{2,}/gi;

  function userLink(body, url) {
    return process(body, findUsers, function(user){
      var clean = user.replace(/\^/,'');
      return '<a data-action="user" data-username="'+clean+'" href="'+url+clean+'">'+user+'</a>';
    });
  }
  function tagLink(body,  url) {
    return process(body, findTags, function(tag){
      var clean = tag.replace(/^#/,'');
      return '<a data-action="tag" data-tag="'+clean+'" href="'+url+clean+'">'+tag+'</a>';
    });
  }

  function justLink(body) {
    return process(body, findLinks, function(link){
        var content = link;
        var action = "link";
        var href = link;
      if (link.match(/blip.pl\/[s|dm|pm]/)) {
        content = "[blip]";
        action = "bliplink";
        href= "#";

      }
      return '<a data-action="'+action+'" href="'+href+'" data-url="'+link+'">'+content+'</a>';
    });
  }

  function process(body, regex, processing_callback) {

   return body.replace(regex,processing_callback);
  }

  // helper function
  function merge(words, processed) {
    var new_body = [];
    for(var i=0, l = words.length;i<l;i++) {
      if(words[i]) {
        new_body.push(words[i]);
      }
      if(processed[i]) {
        new_body.push(processed[i]);
      }
    }
   return new_body.join('');
  }
  return {
   userLink : userLink,
   justLink : justLink,
   tagLink : tagLink
  };
})();
