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
