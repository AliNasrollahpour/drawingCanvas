import { selectSet, inputName } from './config.js';

// --- STATE ---
export let state = {
    sets: {
        'A': { id: 'A', name: 'A', paths: [] }, 
        'B': { id: 'B', name: 'B', paths: [] },
        'C': { id: 'C', name: 'C', paths: [] },
        'D': { id: 'D', name: 'D', paths: [] },
        'E': { id: 'E', name: 'E', paths: [] },
        'F': { id: 'F', name: 'F', paths: [] },
        'G': { id: 'G', name: 'G', paths: [] },
        'H': { id: 'H', name: 'H', paths: [] },
        'I': { id: 'I', name: 'I', paths: [] },
        'J': { id: 'J', name: 'J', paths: [] },
        'K': { id: 'K', name: 'K', paths: [] },
        'L': { id: 'L', name: 'L', paths: [] },
        'M': { id: 'M', name: 'M', paths: [] },
        'N': { id: 'N', name: 'N', paths: [] },
        'O': { id: 'O', name: 'O', paths: [] },
        'P': { id: 'P', name: 'P', paths: [] },
        'Q': { id: 'Q', name: 'Q', paths: [] },
        'R': { id: 'R', name: 'R', paths: [] },
        'S': { id: 'S', name: 'S', paths: [] },
        'T': { id: 'T', name: 'T', paths: [] },
        'U': { id: 'U', name: 'U', paths: [] },
        'V': { id: 'V', name: 'V', paths: [] },
        'W': { id: 'W', name: 'W', paths: [] },
        'X': { id: 'X', name: 'X', paths: [] },
        'Y': { id: 'Y', name: 'Y', paths: [] },
        'Z': { id: 'Z', name: 'Z', paths: [] }
    },
    points: [] 
};

export let appState = {
    mode: 'draw', 
    penType: 'closed', 
    activeSetId: 'A',
    history: [],
    future: [],
    isDrawing: false,
    currentPath: [],
    dragStart: null,
    activePointIndex: -1
};

// --- STATE MUTATION & HISTORY UTILS ---

export function setState(newState) {
    state = newState;
}

export function saveHistory() {
    const snapshot = JSON.parse(JSON.stringify(state));
    appState.history.push(snapshot);
    appState.future = [];
}

export function undo() {
    if (appState.history.length <= 1) return;
    appState.future.push(appState.history.pop());
    setState(JSON.parse(JSON.stringify(appState.history[appState.history.length - 1])));
    return true; // Indicate action taken
}

export function redo() {
    if (appState.future.length === 0) return;
    const next = appState.future.pop();
    appState.history.push(next);
    setState(JSON.parse(JSON.stringify(next)));
    return true; // Indicate action taken
}

export function clearAllState() {
    state.points = [];
    Object.values(state.sets).forEach(s => s.paths = []);
}

export function updateUI() {
    const s = state.sets[appState.activeSetId];
    inputName.value = s.name;
    selectSet.value = s.id;
}