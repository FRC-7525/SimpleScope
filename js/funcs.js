// helper functions

const degreesToRadians = (x) => {
  return (x * Math.PI) / 180;
};

function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
};

function csvJSON(csv) {
  const lines = csv.split("\n");

  let result = [];

  const headers = lines[0].split(",");

  for (let i = 1; i < lines.length; i++) {
    let obj = {};
    let currentline = lines[i].split(",");

    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = currentline[j];
    }

    result.push(obj);
  }

  return result;
}

