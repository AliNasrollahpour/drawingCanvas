## 1. Overview

This project is an interactive web application that allows users to define and analyze custom sets and points on an SVG canvas. It provides real-time, robust geometric and topological analysis, including set classification (open, closed, neither) and set-theoretic operations (intersection, difference, subset relations).

The core of the application simulates topological properties by using pixel-level rasterization of the drawn shapes to accurately determine boundaries, interiors, and relationships between multiple sets.

## 2. Live Application

Explore the application immediately using the GitHub Pages deployment:

**[Launch Application Here](https://alinasrollahpour.github.io/drawingCanvas/)**

## 3. Features

* **Interactive Drawing:** Draw multiple distinct sets (A, B, C, etc.) on the canvas.
* **Pen Modes:** Choose between **Closed Pen** (for filling regions) and **Open Pen** (for paths/boundaries only).
* **Point Placement:** Switch to "Place Points" mode to add points, which can be extended into neighborhoods (disks) for more complex analysis.
* **Set Management:** Select an active set, rename it, and manage its paths.
* **Undo/Redo:** Full history tracking for drawing and placing actions.
* **Detailed Analysis:** Click the **Analyze** button to instantly generate a comprehensive report across three panels.
* **Export:** Download the canvas content as a scalable SVG file.

## 4. Mathematical and Topological Analysis

The application performs three primary types of analysis, displayed in the dedicated panels:

### A. Set Properties (Geometric and Topological)

This section classifies each drawn set based on its path components:
* **Type:** Determines if the set is **Open**, **Closed**, or **Neither**. (A set is considered open if its boundary is composed entirely of 'Open Pens'; closed if entirely of 'Closed Pens'.)
* **Parts:** Identifies the number of disconnected components within the set.
* **Diameter:** Calculates the longest distance between any two points in the set, using an efficient Convex Hull and Rotating Calipers algorithm.

### B. Point Classification

Points and their neighborhoods are classified relative to all drawn sets:
* **Interior Point:** A point $P$ is in the interior ($P \in A^0$) if a neighborhood around $P$ is fully contained within the set $A$.
* **Boundary Point:** A point $P$ is on the boundary ($P \in \partial A$) if every neighborhood around $P$ contains points both inside $A$ and outside $A$.
* **Exterior Point:** A point $P$ is an exterior point ($P \notin \overline{A}$) if there is a neighborhood around $P$ that contains no points of $A$.
* **Neighborhood Analysis:** If a point is drawn with a radius ($R > 0$), the analysis panel provides set-theoretic statements about the point's neighborhood, e.g., $\text{N}(P) \cap A \neq \emptyset$.

### C. Set Theory & Logic

This section generates logical statements based on the visual overlap of the drawn sets:
* **Intersection ($\cap$):** Statements like $A \cap B \neq \emptyset$ (Sets overlap) or $A \cap B = \emptyset$ (Sets are disjoint).
* **Difference ($\backslash$):** Statements like $A \backslash B \neq \emptyset$ (Set A has parts outside of B).
* **Containment ($\subset$ or $=$):** Statements indicating if one set is a proper subset of another or if two sets are equal based on their area.

## 5. Project Structure

The project has been refactored from a single file into a modular, clean structure using native JavaScript modules (`import`/`export`).


```

drawingCanvas/
├── index.html          # Main HTML structure, including links to CSS and the entry-point JS module.
├── main.js             # The application entry point. Initializes state and sets up interaction handlers.
├── style.css           # All application styling.
└── scripts/            # Directory for all core logic modules.
├── analysis.js     # Contains core geometric algorithms (rasterization, diameter, boundary detection, point classification, set logic).
├── config.js       # Global constants, configuration objects, and DOM element references.
├── interaction.js  # Handles all mouse events, toolbar functions, and state transitions based on user input.
├── render.js       # Functions responsible for converting application state data into SVG elements.
├── state.js        # Manages the global application state, including set/point data and undo/redo history.

```

## 6. Technologies Used

* **HTML5/CSS3:** For structure and styling.
* **Vanilla JavaScript (ESM):** Modern, modular logic without external frameworks.
* **SVG:** Used as the drawing canvas, allowing for scalable, resolution-independent geometry.
* **Canvas API (Off-screen):** Temporarily used within the `analysis.js` module for high-precision, pixel-level rasterization required for accurate boundary and interior checks of the sets.

## 7. Installation and Local Setup

To run this project locally, follow these simple steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/alinasrollahpour/drawingCanvas.git](https://github.com/alinasrollahpour/drawingCanvas.git)
    cd drawingCanvas
    ```
2.  **Open in Browser:** Since the project uses native JavaScript modules (`type="module"` and `import` statements), you must serve the files via a local web server to avoid CORS errors.

    * **Recommended Method (Python):**
        ```bash
        python3 -m http.server 8000
        ```
    * **Open the URL:** Navigate to `http://localhost:8000` in your web browser.

You can now use the application locally.
