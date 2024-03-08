# SimpleScope

A very basic CSV-based match analyzer.

## Usage
- Convert your CSV to a JS file: `python3 convert_to_js.py --csv <PATH>`
- Put the path to the generated JS file in `index.html`
- Open `index.html` and explore!

The program currently expects a square robot of a fixed size, but that can be easily adjusted, along with everything else on the page.

Minimum expected keys:
- time
- Match State (DISABLED, AUTONOMOUS, TELEOP)
- Robot X
- Robot Y
- Robot Theta (deg)
