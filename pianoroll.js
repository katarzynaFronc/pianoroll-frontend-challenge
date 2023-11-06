export function generateGradientTable(startColor, endColor, steps) {
  const gradientTable = [];
  for (let i = 0; i < steps; i++) {
    const r = startColor.r + ((endColor.r - startColor.r) * i) / (steps - 1);
    const g = startColor.g + ((endColor.g - startColor.g) * i) / (steps - 1);
    const b = startColor.b + ((endColor.b - startColor.b) * i) / (steps - 1);
    gradientTable.push(`rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`);
  }
  return gradientTable;
}

export default class PianoRoll {
  constructor(svgElement, sequence) {
    this.svgElement = svgElement;
    
    // Adding event listeners to svgElement
    if (this.svgElement) {
      this.svgElement.style.touchAction = "none";
      this.svgElement.addEventListener("pointerdown", this.handlePointerDown.bind(this));
      this.svgElement.addEventListener("pointermove", this.handlePointerMove.bind(this));
      this.svgElement.addEventListener("pointerup", this.handlePointerUp.bind(this));
    } else {
      console.error(`SVG element with id ${svgElement} does not exist`);
    }

    this.end = null;

    // PianoRoll brand #5DB5D5
    const backgroundStartColor = { r: 138, g: 184, b: 122 };
    // #154151
    const backgroundEndColor = { r: 138, g: 184, b: 122 };
    this.backgroundColormap = generateGradientTable(backgroundStartColor, backgroundEndColor, 128);

    const noteStartColor = { r: 66, g: 66, b: 61 };
    const noteEndColor = { r: 28, g: 28, b: 26 };
    this.noteColormap = generateGradientTable(noteStartColor, noteEndColor, 128);

    this.svgElement.setAttribute("width", "100%");
    this.svgElement.setAttribute("viewBox", "0 0 1 1");
    this.svgElement.setAttribute("preserveAspectRatio", "none");

    this.drawPianoRoll(sequence);
  }

  // Define a method named timeToX
  timeToX(time) {
    return time / this.end;
  }

  drawPianoRoll(sequence) {
    this.start = sequence[0].start;
    this.end = sequence[sequence.length - 1].end - this.start;
    // Extract just the pitches to prepare the SVG parameters
    const pitches = sequence.map((note) => {
      return note.pitch;
    });

    // Make it at lest 2 octaves (2 * 12)
    let pitch_min = Math.min(...pitches);
    let pitch_max = Math.max(...pitches);
    let pitch_span = pitch_max - pitch_min;

    // If the span is too low, we have to extend it equally on both sides
    if (pitch_span < 24) {
      const diff = 24 - pitch_span;
      const low = Math.ceil(diff / 2);
      const high = Math.floor(diff / 2);
      pitch_min -= low;
      pitch_max += high;
    }
    // And margin up and down
    pitch_min -= 3;
    pitch_max += 3;
    pitch_span = pitch_max - pitch_min;
    this.note_height = 1 / pitch_span;
    this.drawEmptyPianoRoll(pitch_min, pitch_max);

    sequence.sort((a, b) => a.start - b.start); //??

    sequence.forEach((note) => {
      const note_rectangle = document.createElementNS("http://www.w3.org/2000/svg", "rect");

      // Position and width are based on time
      const x = this.timeToX(note.start - this.start);
      const w = this.timeToX(note.end - note.start);

      note_rectangle.setAttribute("x", `${x}`);
      note_rectangle.setAttribute("width", `${w}`);

      // Computers draw upside down
      const y = 1 - (note.pitch - pitch_min) / pitch_span;

      note_rectangle.setAttribute("y", `${y}`);
      note_rectangle.setAttribute("height", `${this.note_height}`);

      // Colorcoding velocity
      const color = this.noteColormap[note.velocity];
      note_rectangle.setAttribute("fill", color);

      note_rectangle.classList.add("note-rectangle");

      // Draw it
      this.svgElement.appendChild(note_rectangle);
    });
  }

  drawEmptyPianoRoll(pitch_min, pitch_max) {
    const pitch_span = pitch_max - pitch_min;
    for (let it = pitch_min; it <= pitch_max + 1; it++) {
      // Black keys
      if ([1, 3, 6, 8, 10].includes(it % 12)) {
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        const y = 1 - (it - pitch_min) / pitch_span;
        const x = 0;
        const h = 1 / pitch_span;
        const w = 1;

        rect.setAttribute("fill", this.backgroundColormap[12]);
        rect.setAttribute("fill-opacity", "0.666");
        rect.setAttribute("x", `${x}`);
        rect.setAttribute("y", `${y}`);
        rect.setAttribute("width", `${w}`);
        rect.setAttribute("height", `${h}`);
        this.svgElement.appendChild(rect);
      }

      // Key separation
      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      const y = 1 - (it - pitch_min) / pitch_span + 1 / pitch_span;
      line.setAttribute("x1", "0");
      line.setAttribute("y1", `${y}`);
      line.setAttribute("x2", "2");
      line.setAttribute("y2", `${y}`);
      let line_width;

      // Every octave, line is bolder
      if (it % 12 === 0) {
        line_width = 0.003;
      } else {
        line_width = 0.001;
      }
      line.setAttribute("stroke-width", `${line_width}`);
      line.setAttribute("stroke", "black");
      this.svgElement.appendChild(line);
    }
  }

  // Adding pointerdown event to start selection
  handlePointerDown(event) {
    event.preventDefault();
    if (this.svgElement) {
      const rect = this.svgElement.getBoundingClientRect();
      let x;
      if (event.type === "touchstart") {
        x = event.touches[0].clientX - rect.left;
      } else {
        x = event.clientX - rect.left;
      }
      const time = (this.end * x) / rect.width;
      this.startSelection = time;
    }
  }

  // Adding pointermove event to continue selection
  handlePointerMove(event) {
    event.preventDefault();
    if (this.svgElement && this.startSelection) {
      const rect = this.svgElement.getBoundingClientRect();
      let x;
      if (event.type === "touchmove") {
        x = event.touches[0].clientX - rect.left;
      } else {
        x = event.clientX - rect.left;
      }
      const time = (this.end * x) / rect.width;
      this.endSelection = time;
      this.highlightSelection();
    }
  }

  // Adding pointerup event to end selection
  handlePointerUp(event) {
    event.preventDefault();
    if (this.svgElement) {
      console.log(`Selected passage: start = ${this.startSelection}, end = ${this.endSelection}`);
      this.startSelection = null;
      this.endSelection = null;
    }
  }

  // Adding visual effect of selection
  highlightSelection() {
    this.removeSelection();

    // start of the selection
    const startLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    startLine.setAttribute("x1", this.startSelection);
    startLine.setAttribute("y1", 0);
    startLine.setAttribute("x2", this.startSelection);
    startLine.setAttribute("y2", this.svgElement.getAttribute("height"));
    this.svgElement.appendChild(startLine);
    this.startLine = startLine;

    // end of the selection
    const endLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    endLine.setAttribute("x1", this.endSelection);
    endLine.setAttribute("y1", 0);
    endLine.setAttribute("x2", this.endSelection);
    endLine.setAttribute("y2", this.svgElement.getAttribute("height"));
    this.svgElement.appendChild(endLine);
    this.endLine = endLine;

    // covers the selected area
    const svgWidth = parseFloat(this.svgElement.getAttribute("width").replace("%", "")) / 100;
    const overlay = document.createElementNS("http://www.w3.org/2000/svg", "rect");

    overlay.setAttribute("x", (this.startSelection / this.end) * svgWidth);
    overlay.setAttribute("y", 0);
    overlay.setAttribute("width", ((this.endSelection - this.startSelection) / this.end) * svgWidth);
    overlay.setAttribute("height", this.svgElement.getAttribute("height"));
    overlay.setAttribute("style", "fill:rgba(255,255,255,0.8)");
    this.svgElement.insertBefore(overlay, this.svgElement.firstChild);
    this.overlay = overlay;
  }

  // Remove selection before start another
  removeSelection() {
    if (this.startLine) {
      this.svgElement.removeChild(this.startLine);
      this.startLine = null;
    }
    if (this.endLine) {
      this.svgElement.removeChild(this.endLine);
      this.endLine = null;
    }
    if (this.overlay) {
      this.svgElement.removeChild(this.overlay);
      this.overlay = null;
    }
  }
}
