// helper functions
var degreesToRadians = function (x) { return (x * Math.PI) / 180; };
var clamp = function (num, min, max) { return Math.min(Math.max(num, min), max); };
var csvJSON = function (csv) {
    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(",");
    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        var currentLine = lines[i].split(",");
        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentLine[j];
        }
        result.push(obj);
    }
    return result;
};
