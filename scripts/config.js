// --- CONSTANTS & CONFIG ---
export const W = 1280; // Internal SVG width
export const H = 720; // Internal SVG height

export const CONFIG = {
    fillColors: { 'A': 'rgba(255, 0, 0, 0.1)', 'B': 'rgba(0, 0, 255, 0.1)', 'C': 'rgba(0, 128, 0, 0.1)' },
    strokeColors: { 'A': 'red', 'B': 'blue', 'C': 'green' }
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