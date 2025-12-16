import { state, saveHistory, undo, redo, updateUI } from './scripts/state.js';
import { render } from './scripts/render.js';
import { setupInteraction } from './scripts/interaction.js'; 
import { selectSet, svg } from './scripts/config.js';
import { analyze } from './scripts/analysis.js'; 

// --- EXPORT FUNCTION ---
function exportSVG() {
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'set_analysis.svg';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

// --- INITIALIZATION ---
function init() {
    // Populate the set selection dropdown
    Object.keys(state.sets).forEach(key => {
        const opt = document.createElement('option');
        opt.value = key; opt.text = key;
        selectSet.appendChild(opt);
    });
    
    // Wire up undo/redo and analysis global functions
    window.undo = () => { if (undo()) { updateUI(); render(); } };
    window.redo = () => { if (redo()) { updateUI(); render(); } };
    window.analyze = analyze; 
    window.exportSVG = exportSVG; 

    // Initialize Interactions and UI
    setupInteraction();
    updateUI();
    saveHistory();
}

// Start the application
init();