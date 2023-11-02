import PianoRoll from "./pianoroll.js";

class PianoRollDisplay {
  constructor(csvURL) {
    this.csvURL = csvURL;
    this.data = null;
  }

  async loadPianoRollData() {
    try {
      const response = await fetch("https://pianoroll.ai/random_notes");
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      this.data = await response.json();
    } catch (error) {
      console.error("Error loading data:", error);
    }
  }

  preparePianoRollCard(rollId) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("piano-roll-card");
    const container = document.querySelector("#pianoRollContainer");

    // Create and append other elements to the card container as needed

    const leftColumn = document.createElement("section");
    leftColumn.classList.add("leftColumn");
    const rightColumn = document.createElement("section");
    rightColumn.classList.add("rightColumn");

    container.appendChild(leftColumn);
    container.appendChild(rightColumn);

    // ----------------------------------------------------------------
    const descriptionDiv = document.createElement("div");
    descriptionDiv.classList.add("description");
    descriptionDiv.textContent = `This is a piano roll number ${rollId}`;
    cardDiv.appendChild(descriptionDiv);

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.classList.add("piano-roll-svg");
    svg.setAttribute("width", "80%");
    svg.setAttribute("height", "150");

    // Append the SVG to the card container
    cardDiv.appendChild(svg);

    return { cardDiv, svg };
  }

  async generateSVGs() {
    if (!this.data) await this.loadPianoRollData();
    if (!this.data) return;

    const pianoRollContainer = document.getElementById("pianoRollContainer");
    pianoRollContainer.innerHTML = "";
    for (let it = 0; it < 20; it++) {
      const start = it * 60;
      const end = start + 60;
      const partData = this.data.slice(start, end);

      const { cardDiv, svg } = this.preparePianoRollCard(it);
      const rightColumn = document.querySelector(".rightColumn");
      rightColumn.appendChild(cardDiv);
      const roll = new PianoRoll(svg, partData);
    }
  }
}

const csvToSVG = new PianoRollDisplay();
csvToSVG
  .generateSVGs()
  .then(() => {})
  .catch((error) => {
    console.error(error);
  });
