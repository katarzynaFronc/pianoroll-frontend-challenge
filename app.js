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
    cardDiv.id = `cardDiv${rollId}`;
    cardDiv.classList.add("card-hover");

    // Create and append other elements to the card container as needed
    // Handle click event
    const clickCard = (e) => {
      if (!e.target.classList.contains("piano-roll-card")) {
        return;
      } else {
        const actual = e.target;
        const rightColumn = actual.parentElement;
        const leftColumn = rightColumn.previousElementSibling;

        if (leftColumn.children[0]) {
          const oldCard = leftColumn.children[0];
          leftColumn.removeChild(oldCard);
          rightColumn.appendChild(oldCard);
        }
        
     // Create new classes for column
        leftColumn.classList.remove("leftColumn");
        leftColumn.classList.add("left-large");
        rightColumn.classList.remove("right-column");
        rightColumn.classList.add("right-narrow");
        
    // Reset classes of cardDiv
        const all = document.querySelectorAll(".piano-roll-card");
        all.forEach((e) => {
          e.classList.remove("small-card", "big-card");
        });

    // Add big-card to actual card 
        actual.classList.add("big-card");
        actual.classList.remove("card-hover");

        leftColumn.appendChild(actual);

    // Add small-card class to the rest cardDiv
        const smallCards = document.querySelectorAll(".piano-roll-card:not(.big-card)");

        smallCards.forEach((smallCard) => {
          if (smallCard !== actual) {
            smallCard.classList.remove("big-card");
            smallCard.classList.add("small-card");
          }
        });

    // Sort cards with small-card class to display in right order
        const cards = Array.from(document.querySelectorAll(".small-card"));
        cards.sort((a, b) => {
          const idA = parseInt(a.id.split("cardDiv")[1]);
          const idB = parseInt(b.id.split("cardDiv")[1]);

          return idA - idB;
        });
        cards.forEach((cardDiv) => rightColumn.appendChild(cardDiv));
      }
    };

    // Add event listener to every cardDiv
    cardDiv.addEventListener("click", clickCard);

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

    const container = document.querySelector("#pianoRollContainer");

    const leftColumn = document.createElement("section");
    leftColumn.classList.add("leftColumn");
    const rightColumn = document.createElement("section");
    rightColumn.classList.add("right-column");

    container.appendChild(leftColumn);
    container.appendChild(rightColumn);

    for (let it = 0; it < 20; it++) {
      const start = it * 60;
      const end = start + 60;
      const partData = this.data.slice(start, end);

      const { cardDiv, svg } = this.preparePianoRollCard(it);
      const rightColumn = document.querySelector(".right-column");
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

// Navigate to the "index.html" page
const linkLogo = document.querySelector(".logo-container");
linkLogo.addEventListener("click", () => {
  location.href = "index.html";
});
