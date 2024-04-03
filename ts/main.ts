import * as d3 from "../js/d3.v7.min.js";

let playing: boolean = false;
let i: number = 0;
let endIndex: number = 0;
let startIndex: number = 0;

let draw;
let indexToSliderScale;
let sliderToIndexScale;

function initialize(data: object[]) {
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
  while (data[i]["Match State"] !== "AUTONOMOUS") {
    ++i;
  }

  startIndex = i;

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

  // Drawing function for Field2D
  draw = () => {
    const item = data[i];
    const robotX = Number(item["Robot X"]);
    const robotY = Number(item["Robot Y"]);
    const robotRotation = degreesToRadians(Number(item["Robot Theta (deg)"]));
    const fieldX = fieldWidthScale(robotX);
    const fieldY = fieldHeightScale(robotY);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(img, 0, 0, FIELD_CANVAS_WIDTH, FIELD_CANVAS_HEIGHT);
    ctx.translate(fieldX, fieldY)
    ctx.rotate(robotRotation)
    ctx.translate(-fieldX, -fieldY)
    ctx.strokeStyle = "white";
    ctx.strokeRect(fieldX - (FIELD_ROBOT_SIDE / 2), fieldY - (FIELD_ROBOT_SIDE / 2), FIELD_ROBOT_SIDE, FIELD_ROBOT_SIDE);
    let matchState = data[i]["Match State"];
    if (matchState === "AUTONOMOUS") {
      matchState += ` (running: ${data[i]["Currently selected autonomous"]})`;
    }

    document.getElementById("matchState").innerHTML = `Match State: ${matchState}`;
    document.getElementById("matchTime").innerHTML = `Match Time: ${String((Number(data[i]["time"]) - startTime).toFixed(2))} sec`;
    document.getElementById("managerState").innerHTML = `Manager State ${data[i]["Manager State"]}`;
    document.getElementById("robotX").innerHTML = `Robot X: ${data[i]["Robot X"]}`;
    document.getElementById("robotY").innerHTML = `Robot Y: ${data[i]["Robot Y"]}`;
    document.getElementById("robotRotation").innerHTML = `Robot Rotation: ${degreesToRadians(Number(item["Robot Theta (deg)"]))}`;
  };

  // Match slider
  const onSliderChange = (e) => {
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

  document.getElementById("cycleTime").innerHTML = `
    <tr>
      <th scope="col">Teleop Time</th>
      <th scope="col">Manager State</th>
      <th scope="col">Diff Time</th>
    </tr>
  `;

  let lastTime = Number(data[teleopStart]["time"]);
  const teleopTimeOffset = lastTime;
  table += `
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

    console.log(typeof csvJSON(text));
    initialize(csvJSON(text));
}
