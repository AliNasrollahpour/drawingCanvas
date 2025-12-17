// --- CONSTANTS & CONFIG ---
export const W = 1280;
export const H = 720;

// Extended color palette for 26 sets (A-Z)
const COLOR_PALETTE = {
    'A': '#007bff', 'B': '#dc3545', 'C': '#28a745', 'D': '#ffc107',
    'E': '#6f42c1', 'F': '#fd7e14', 'G': '#20c997', 'H': '#17a2b8',
    'I': '#e83e8c', 'J': '#6c757d', 'K': '#343a40', 'L': '#007bff',
    'M': '#dc3545', 'N': '#28a745', 'O': '#ffc107', 'P': '#6f42c1',
    'Q': '#fd7e14', 'R': '#20c997', 'S': '#17a2b8', 'T': '#e83e8c',
    'U': '#6c757d', 'V': '#343a40', 'W': '#007bff', 'X': '#dc3545',
    'Y': '#28a745', 'Z': '#ffc107'
};

// Helper function to convert hex to rgba with opacity
function hexToRgba(hex, opacity) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Generate fill and stroke colors for all sets A-Z
const fillColors = {};
const strokeColors = {};

for (const [key, color] of Object.entries(COLOR_PALETTE)) {
    strokeColors[key] = color;
    fillColors[key] = hexToRgba(color, 0.1);
}

export const CONFIG = {
    fillColors,
    strokeColors
};

export const BOUNDARY_PROXIMITY = 4;
export const CLOSING_DISTANCE = 25;

// --- NOTATION ---
export const NOTATION = {
    INTERIOR: '⁰',
    BOUNDARY: '∂',
    CLOSURE: '̅',
    ELEMENT_OF: '∈',
    NOT_ELEMENT_OF: '∉',
    INTERSECTION: '∩',
    DIFFERENCE: '\\',
    EMPTY_SET: '∅',
    SUBSET: '⊂',
    EQUAL: '=',
    NOT_EQUAL: '≠',
    NEIGHBORHOOD: 'N'
};

// --- DOM ELEMENTS ---
export const svg = document.getElementById('mainSvg');
export const layerSets = document.getElementById('layerSets');
export const layerPoints = document.getElementById('layerPoints');
export const layerPreview = document.getElementById('layerPreview');
export const layerOverlay = document.getElementById('layerOverlay');
export const selectSet = document.getElementById('activeSetSelect');
export const inputName = document.getElementById('setNameInput');
export const penSelect = document.getElementById('penSelect');

// DEBUG: Log if elements are found
console.log('config.js loaded. Checking DOM elements:');
console.log('svg:', svg ? 'found' : 'NOT FOUND');
console.log('selectSet:', selectSet ? 'found' : 'NOT FOUND');
console.log('inputName:', inputName ? 'found' : 'NOT FOUND');
console.log('penSelect:', penSelect ? 'found' : 'NOT FOUND');