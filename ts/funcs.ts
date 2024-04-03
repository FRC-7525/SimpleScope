// helper functions

const degreesToRadians = (x: number): number => (x * Math.PI) / 180;

const clamp = (num: number, min: number, max: number): number => Math.min(Math.max(num, min), max);

const csvJSON = (csv: string) => {
    const lines = csv.split("\n");

    let result = [];

    const headers = lines[0].split(",");

    for (let i = 1; i < lines.length; i++) {
        let obj = {};
        let currentLine = lines[i].split(",");

        for (let j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentLine[j];
        }

        result.push(obj);
    }

    return result;
}
