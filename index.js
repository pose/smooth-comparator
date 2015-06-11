function createDiff(key, diff) {
  return diff.map(function (value) {
    value.key = key + ( value.key ? '.' + value.key : '');
    return value;
  });
}

function areMajorAndMinorEqual(a, b) {
  return a.slice(0,2).join('.') === b.slice(0,2).join('.');
}

function shrinkwrapEqual(a, b) {
  var i, diff;

  // Case it's not an object
  if (typeof a !== 'object') {
    return {
      result: a === b,
      diff: [
        {value: a, key: '', side: 'left'},
        {value: b, key: '', side: 'right'}
      ]
    };
  }

  // Object case
  var aKeys = Object.keys(a);
  var bKeys = Object.keys(b);

  aKeys.sort();
  bKeys.sort();

  // Ignore "from" fields
  var keysToIgnore = {'from': true};

  aKeys = aKeys.filter(function (key) {
    return !keysToIgnore[key];
  });

  bKeys = bKeys.filter(function (key) {
    return !keysToIgnore[key];
  });

  // Case: keys array length mismatches
  if (aKeys.length !== bKeys.length) {
    var arrays = aKeys.length > bKeys.length ?
      [aKeys, bKeys, 'left'] : [bKeys, aKeys, 'right'];

    var longerArray = arrays[0];
    var shorterArray = arrays[1];
    var longerSide = arrays[2];

    diff = [];

    for (i = 0; i < longerArray.length; i++) {
      if (shorterArray.indexOf(longerArray[i]) === -1) {
        diff.push({key: longerArray[i], side: longerSide});
      }
    }
    return {result: false, diff: diff};
  }

  for (i = 0; i < aKeys.length; i++) {
    // Case: Key mismatch between between the two trees
    if (aKeys[i] !== bKeys[i]) {
      return {
        result: false,
        diff: [
          {key: aKeys[i], side: 'left'},
          {key: bKeys[i], side: 'right'}
        ]
      };
    }

    var key = aKeys[i];

    // For the root "node-version" field compare only
    // major and minor version parts (patch component may differ).
    if ('node-version' === key) {
      if (typeof a[key] !== 'string' ||
          typeof b[key] !== 'string') {
          return {
            result: false,
            diff: [
              {key: key, value: a[key], side: 'left'},
              {key: key, value: b[key], side: 'right'}
            ]
          };
      }


      var nodeVersionA = a[key].split('.');
      var nodeVersionB = b[key].split('.');

      if (nodeVersionA.length !== 3 || nodeVersionB.length !== 3) {
          return {
            result: false,
            diff: [
              {key: key, value: a[key], side: 'left'},
              {key: key, value: b[key], side: 'right'}
            ]
          };
      }


      if(!areMajorAndMinorEqual(nodeVersionA, nodeVersionB)) {
        return {
          result: false,
          diff: [
            {key: key, value: a[key], side: 'left'},
            {key: key, value: b[key], side: 'right'}
          ]
        };
      }

      // If major and minor an equal skip comparing this key
      continue;
    }

    var childResult = shrinkwrapEqual(a[key], b[key]);
    // Case: Children are not equal
    if (!childResult.result) {
      diff = childResult.diff;
      diff = createDiff(key, diff);
      return {result: false, diff: diff};
    }
  }

  return {result: true};
}

function main(a, b) {
  a = JSON.parse(a);
  b = JSON.parse(b);

  return shrinkwrapEqual(a, b);
}

module.exports = main;
