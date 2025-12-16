// Located in: /main.js

import { state, saveHistory, undo, redo, updateUI } from './scripts/state.js';
import { render } from './scripts/render.js';
import { setupInteraction, exportSVG } from './scripts/interaction.js'; 
import { selectSet } from './scripts/config.js';
import { analyze } from './scripts/analysis.js'; 

// --- INITIALIZATION ---
function init() {
    // Populate the set selection dropdown
    Object.keys(state.sets).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key; opt.text = key;
        selectSet.appendChild(opt);
    });
    
    // Wire up undo/redo global functions
    window.undo = () => { if (undo()) { updateUI(); render(); } };
    window.redo = () => { if (redo()) { updateUI(); render(); } };

    // Expose Analyze and Export SVG functions to the global window object 
    window.analyze = analyze;
    window.exportSVG = exportSVG;

    // Set initial UI/State
    setupInteraction();
    updateUI();
    saveHistory();
}

// Start the application
init();