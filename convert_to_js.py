import csv
import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("--csv", type=str, required=True)
args = parser.parse_args()

# Read in CSV
with open(args.csv, newline='') as csvfile:
    reader = csv.reader(csvfile, delimiter=',', )
    header = None
    data = []
    for row in reader:
        if header is None:
            header = row
            continue

        point = {}
        for i, item in enumerate(row):
            point[header[i]] = item

        data.append(point)

# print(json.dumps(data))

# Write to JS
with open(str(args.csv).removesuffix("csv") + "js", "w") as f:
    f.write("let data = " + json.dumps(data))
