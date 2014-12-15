.pragma library

/*!
  \brief Compares two versions presented as string with given precision

  Versions need to be strings with numbers delimited by dots.
  Precisions specifies how many parts of version you want to compare.
  This is handy for example if you only want to compare major versions.

  */
function compareVersions(one, two, precision) {
    if(!precision) {
        precision = 3;
    }

    var parser = function(value) { return parseInt(value, 10); };

    one = one.split('.').slice(0, precision).map(parser);
    two = two.split('.').slice(0, precision).map(parser);

    var result = 0;
    for(var i = 0; i < one.length && result === 0; ++i) {
        // if new version has some suffix not present in current app version
        // than it's a new version, so 0.5.0.43 is higher than 0.5.0
        if(two.length <= i) {
            result = 1;
            break;
        }

        if(one[i] > two[i]) {
            result = 1;
        } else if(one[i] < two[i]) {
            result = -1;
        }
    }

    return result;
}
