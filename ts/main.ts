import * as d3 from "d3";
import { degreesToRadians, clamp, rotateAroundPoint } from './funcs';
import { parse } from 'csv-parse/browser/esm/sync';

const playPause: HTMLButtonElement = document.getElementById("playPause") as HTMLButtonElement;
const stepLeft: HTMLButtonElement = document.getElementById("stepLeft") as HTMLButtonElement;
const stepRight: HTMLButtonElement = document.getElementById("stepRight") as HTMLButtonElement;
const timeSlider = document.getElementById("timeSlider");
const changeFile = document.getElementById("changedFile");
const buttonsToDisable: HTMLButtonElement[] = [ playPause, stepLeft, stepRight ];

let playing: boolean = false;
let i: number = 0;
let endIndex: number = 0;
let startIndex: number = 0;
let fileLoaded: boolean = false;

let draw;
let indexToSliderScale;
let sliderToIndexScale;
let onSliderChange;
let drawRobotPose;

const robotPoseArrow = new Image();
robotPoseArrow.src = "images/arrow.svg"
const visionPoseArrow = new Image();
visionPoseArrow.src = "images/arrow.svg"

function initialize(data: object[]) {
  // adding function to the buttons
  buttonsToDisable.forEach((button) => {button.disabled = false});
  playPause.addEventListener("click", () => { playing = !playing; });
  stepLeft.addEventListener("click", () => { stepLogging(true) });
  stepRight.addEventListener("click", () => { stepLogging(false) });
  timeSlider.addEventListener("input", () => { onSliderChange() });

  // Constants and helpers
  const canvas = document.getElementById("canvas") as HTMLCanvasElement;
  const ctx = canvas.getContext("2d");

  const ROBOT_SIDE = 0.71;
  const FIELD_WIDTH = 16.54;
  const FIELD_HEIGHT = 8.21;
  const FIELD_CANVAS_WIDTH = 645;
  const FIELD_CANVAS_HEIGHT = 324;

  i = 0;
  playing = false;

  // Find start of match
  try {
    while (data[i]["Match State"] !== "AUTONOMOUS") {
      ++i;
    }

    startIndex = i;
  } catch (TypeError) { // if AUTONOMOUS isn't found...
    i = 0;
    startIndex = 0;
  }

  // Find end of match
  endIndex = 0;
  const startTime = Number(data[startIndex]["time"]);

  while (endIndex < data.length && Number(data[endIndex]["time"]) - startTime < 154) {
    ++endIndex;
  }

  // Create scaling for Field2D viz
  sliderToIndexScale = d3.scaleLinear()
    .domain([0, 100])
    .range([startIndex, endIndex]);

  indexToSliderScale = d3.scaleLinear()
    .domain([startIndex, endIndex])
    .range([0, 100])

  const fieldWidthScale = d3.scaleLinear()
    .domain([0, FIELD_WIDTH])
    .range([0, FIELD_CANVAS_WIDTH]);

  const fieldHeightScale = d3.scaleLinear()
    .domain([0, FIELD_HEIGHT])
    .range([FIELD_CANVAS_HEIGHT, 0]);

  const FIELD_ROBOT_SIDE = fieldWidthScale(ROBOT_SIDE);

  drawRobotPose = (ctx: CanvasRenderingContext2D, robotX: Number, robotY: Number, robotRotationInRadians: number, style: string, arrowImage: any) => {
    const fieldX = fieldWidthScale(robotX);
    const fieldY = fieldHeightScale(robotY);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    rotateAroundPoint(ctx, fieldX, fieldY, robotRotationInRadians);

    ctx.strokeStyle = style;
    rotateAroundPoint(ctx, fieldX, fieldY, 90);

    ctx.drawImage(arrowImage, fieldX - (FIELD_ROBOT_SIDE / 2), fieldY - (FIELD_ROBOT_SIDE / 2), FIELD_ROBOT_SIDE, FIELD_ROBOT_SIDE);

    rotateAroundPoint(ctx, fieldX, fieldY, 90);
    ctx.strokeRect(fieldX - (FIELD_ROBOT_SIDE / 2), fieldY - (FIELD_ROBOT_SIDE / 2), FIELD_ROBOT_SIDE, FIELD_ROBOT_SIDE);
  }

  // Drawing function for Field2D
  draw = () => {
    const item = data[i];

    if (i >= data.length || item == undefined) {
      playing = false;
      return;
    }

    const robotX = Number(item["Robot X"]);
    const robotY = Number(item["Robot Y"]);
    const robotRotation = Number(item["Robot Theta (deg)"])
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, 0, 0, FIELD_CANVAS_WIDTH, FIELD_CANVAS_HEIGHT);

    drawRobotPose(ctx, robotX, robotY, robotRotation, "white", robotPoseArrow);

    let matchState = data[i]["Match State"];
    if (matchState === "AUTONOMOUS") {
      matchState += ` (running: ${data[i]["Currently selected autonomous"]})`;
    }

    const visionPose = JSON.parse(item["Front Pose"]);
    const visionX = visionPose[0];
    const visionY = visionPose[1];
    const visionRot = visionPose[2];

    drawRobotPose(ctx, visionX, visionY, visionRot, "green", visionPoseArrow);

    if (item["Side Pose"] != undefined) {
      const sidePose = JSON.parse(item["Side Pose"]);
      const sideX = sidePose[0];
      const sideY = sidePose[1];
      const sideRot = sidePose[2];

      drawRobotPose(ctx, sideX, sideY, sideRot, "blue");

      document.getElementById("sidePose").innerHTML = `Side Pose: ${sideX.toFixed(2)}, ${sideY.toFixed(2)}`;
    }
    
    document.getElementById("matchState").innerHTML = `Match State: ${matchState}`;
    document.getElementById("matchTime").innerHTML = `Match Time: ${String((Number(data[i]["time"]) - startTime).toFixed(2))} sec`;
    document.getElementById("managerState").innerHTML = `Manager State ${data[i]["Manager State"]}`;
    document.getElementById("robotPosition").innerHTML = `Robot Position: (${Number(data[i]["Robot X"]).toFixed(2)}, ${Number(data[i]["Robot Y"]).toFixed(2)})`;
    document.getElementById("robotRotation").innerHTML = `Robot Rotation: ${degreesToRadians(Number(item["Robot Theta (deg)"])).toFixed(2)}`;
    document.getElementById("frontPose").innerHTML = `Front Pose: (${visionX.toFixed(2)}, ${visionY.toFixed(2)})`
    document.getElementById("visionRotation").innerHTML = `Vision Rotation: ${visionRot.toFixed(2)}`
  };

  // Match slider
  onSliderChange = (e) => {
    const slider = document.getElementById("timeSlider") as HTMLInputElement;
    i = Math.round(sliderToIndexScale(slider.value));
    draw();
  };

  // Field drawing
  const img = new Image();
  img.onload = () => {
    draw();
  }
  img.src = "images/field.png";

  // Event loop for playing (inefficient, but that's okay)
  setInterval(() => {
    if (playing) {
      draw();
      const slider = document.getElementById("timeSlider") as HTMLInputElement;
      slider.value = indexToSliderScale(i);
      ++i;
    }
  }, 90); // Adjust this value for playback speed

  // Create shot cycle analysis
  let cycleIndex = startIndex;
  let managerState = "";
  let firstShots = [];
  let teleopStart = undefined;
  while (cycleIndex < endIndex) {
    if (data[cycleIndex]["Match State"] !== "TELEOP") {
      ++cycleIndex;
      continue;
    }

    if (!teleopStart && data[cycleIndex]["Match State"] === "TELEOP") teleopStart = cycleIndex;

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
  let table = "";
  
  document.getElementById("cycleTime").innerHTML = ``;

  let lastTime = Number(data[teleopStart]["time"]);
  const teleopTimeOffset = lastTime;
  table = `
    <h3>Teleop Cycle Time Analysis</h3>
    <tr>
        <th scope="col">Teleop Time</th>
        <th scope="col">Manager State</th>
        <th scope="col">Diff Time</th>
    </tr>
    <tr>
        <td>0</td>
        <td>START</td>
        <td>-</td>
    </tr>
`;

  for (const cycleIndex of firstShots) {
    const matchTime = Number(data[cycleIndex]["time"]);
    table += `
        <tr>
            <td>${(matchTime - teleopTimeOffset).toFixed(2)}</td>
            <td>${data[cycleIndex]["Manager State"]}</td>
            <td>${(matchTime - lastTime).toFixed(2)}</td>
        </tr>
    `;

    lastTime = matchTime;
  }

  document.getElementById("cycleTime").innerHTML += table;
}

const stepLogging = (backwards) => {
  if (backwards) {
    i--;
  } else {
    i++;
  }

  i = clamp(i, startIndex, endIndex);

  const slider = document.getElementById("timeSlider") as HTMLInputElement;
  slider.value = indexToSliderScale(i);

  draw();
}

async function changedFile(event) {
    const file = event.target.files.item(0);
    const text = await file.text();
    const jsonFromCSV = parse(text, {columns: true, skip_empty_lines: true});
    fileLoaded = true;

    initialize(jsonFromCSV);
}


changeFile.addEventListener("change", () => { changedFile(event) });

buttonsToDisable.forEach((button) => { button.disabled = true; });
