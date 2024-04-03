"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var d3 = require("../js/d3.v7.min.js");
var playing = false;
var i = 0;
var endIndex = 0;
var startIndex = 0;
var draw;
var indexToSliderScale;
var sliderToIndexScale;
function initialize(data) {
    // Constants and helpers
    var canvas = document.getElementById("canvas");
    var ctx = canvas.getContext("2d");
    var ROBOT_SIDE = 0.71;
    var FIELD_WIDTH = 16.54;
    var FIELD_HEIGHT = 8.21;
    var FIELD_CANVAS_WIDTH = 645;
    var FIELD_CANVAS_HEIGHT = 324;
    i = 0;
    playing = false;
    // Find start of match
    while (data[i]["Match State"] !== "AUTONOMOUS") {
        ++i;
    }
    startIndex = i;
    // Find end of match
    endIndex = 0;
    var startTime = Number(data[startIndex]["time"]);
    while (endIndex < data.length && Number(data[endIndex]["time"]) - startTime < 154) {
        ++endIndex;
    }
    // Create scaling for Field2D viz
    sliderToIndexScale = d3.scaleLinear()
        .domain([0, 100])
        .range([startIndex, endIndex]);
    indexToSliderScale = d3.scaleLinear()
        .domain([startIndex, endIndex])
        .range([0, 100]);
    var fieldWidthScale = d3.scaleLinear()
        .domain([0, FIELD_WIDTH])
        .range([0, FIELD_CANVAS_WIDTH]);
    var fieldHeightScale = d3.scaleLinear()
        .domain([0, FIELD_HEIGHT])
        .range([FIELD_CANVAS_HEIGHT, 0]);
    var FIELD_ROBOT_SIDE = fieldWidthScale(ROBOT_SIDE);
    // Drawing function for Field2D
    draw = function () {
        var item = data[i];
        var robotX = Number(item["Robot X"]);
        var robotY = Number(item["Robot Y"]);
        var robotRotation = degreesToRadians(Number(item["Robot Theta (deg)"]));
        var fieldX = fieldWidthScale(robotX);
        var fieldY = fieldHeightScale(robotY);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.drawImage(img, 0, 0, FIELD_CANVAS_WIDTH, FIELD_CANVAS_HEIGHT);
        ctx.translate(fieldX, fieldY);
        ctx.rotate(robotRotation);
        ctx.translate(-fieldX, -fieldY);
        ctx.strokeStyle = "white";
        ctx.strokeRect(fieldX - (FIELD_ROBOT_SIDE / 2), fieldY - (FIELD_ROBOT_SIDE / 2), FIELD_ROBOT_SIDE, FIELD_ROBOT_SIDE);
        var matchState = data[i]["Match State"];
        if (matchState === "AUTONOMOUS") {
            matchState += " (running: ".concat(data[i]["Currently selected autonomous"], ")");
        }
        document.getElementById("matchState").innerHTML = "Match State: ".concat(matchState);
        document.getElementById("matchTime").innerHTML = "Match Time: ".concat(String((Number(data[i]["time"]) - startTime).toFixed(2)), " sec");
        document.getElementById("managerState").innerHTML = "Manager State ".concat(data[i]["Manager State"]);
        document.getElementById("robotX").innerHTML = "Robot X: ".concat(data[i]["Robot X"]);
        document.getElementById("robotY").innerHTML = "Robot Y: ".concat(data[i]["Robot Y"]);
        document.getElementById("robotRotation").innerHTML = "Robot Rotation: ".concat(degreesToRadians(Number(item["Robot Theta (deg)"])));
    };
    // Match slider
    var onSliderChange = function (e) {
        var slider = document.getElementById("timeSlider");
        i = Math.round(sliderToIndexScale(slider.value));
        draw();
    };
    // Field drawing
    var img = new Image();
    img.onload = function () {
        draw();
    };
    img.src = "images/field.png";
    // Event loop for playing (inefficient, but that's okay)
    setInterval(function () {
        if (playing) {
            draw();
            var slider = document.getElementById("timeSlider");
            slider.value = indexToSliderScale(i);
            ++i;
        }
    }, 90); // Adjust this value for playback speed
    // Create shot cycle analysis
    var cycleIndex = startIndex;
    var managerState = "";
    var firstShots = [];
    var teleopStart = undefined;
    while (cycleIndex < endIndex) {
        if (data[cycleIndex]["Match State"] !== "TELEOP") {
            ++cycleIndex;
            continue;
        }
        if (!teleopStart && data[cycleIndex]["Match State"] === "TELEOP")
            teleopStart = cycleIndex;
        if (data[cycleIndex]["Manager State"] === "Shooting" && managerState !== "Shooting") {
            firstShots.push(cycleIndex);
        }
        if (data[cycleIndex]["Manager State"] === "Amp Scoring" && managerState !== "Amp Scoring") {
            firstShots.push(cycleIndex);
        }
        managerState = data[cycleIndex]["Manager State"];
        ++cycleIndex;
    }
    // Add cycle analysis to table
    var table = "";
    document.getElementById("cycleTime").innerHTML = "\n    <tr>\n      <th scope=\"col\">Teleop Time</th>\n      <th scope=\"col\">Manager State</th>\n      <th scope=\"col\">Diff Time</th>\n    </tr>\n  ";
    var lastTime = Number(data[teleopStart]["time"]);
    var teleopTimeOffset = lastTime;
    table += "\n    <h3>Teleop Cycle Time Analysis</h3>\n    <tr>\n        <th scope=\"col\">Teleop Time</th>\n        <th scope=\"col\">Manager State</th>\n        <th scope=\"col\">Diff Time</th>\n    </tr>\n    <tr>\n        <td>0</td>\n        <td>START</td>\n        <td>-</td>\n    </tr>\n";
    for (var _i = 0, firstShots_1 = firstShots; _i < firstShots_1.length; _i++) {
        var cycleIndex_1 = firstShots_1[_i];
        var matchTime = Number(data[cycleIndex_1]["time"]);
        table += "\n        <tr>\n            <td>".concat((matchTime - teleopTimeOffset).toFixed(2), "</td>\n            <td>").concat(data[cycleIndex_1]["Manager State"], "</td>\n            <td>").concat((matchTime - lastTime).toFixed(2), "</td>\n        </tr>\n    ");
        lastTime = matchTime;
    }
    document.getElementById("cycleTime").innerHTML += table;
}
var stepLogging = function (backwards) {
    if (backwards) {
        i--;
    }
    else {
        i++;
    }
    i = clamp(i, startIndex, endIndex);
    var slider = document.getElementById("timeSlider");
    slider.value = indexToSliderScale(i);
    draw();
};
function changedFile(event) {
    return __awaiter(this, void 0, void 0, function () {
        var file, text;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    file = event.target.files.item(0);
                    return [4 /*yield*/, file.text()];
                case 1:
                    text = _a.sent();
                    console.log(typeof csvJSON(text));
                    initialize(csvJSON(text));
                    return [2 /*return*/];
            }
        });
    });
}
