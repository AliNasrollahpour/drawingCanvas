// Located in: /scripts/interaction.js

import { appState, state, saveHistory, updateUI, clearAllState } from './state.js';
import { render } from './render.js';
import { svg, CLOSING_DISTANCE, CONFIG, layerPreview, selectSet, inputName, layerOverlay } from './config.js';
import { analyze } from './analysis.js'; // Corrected path/extension

// --- INTERACTION UTILS ---
function getLoc(e) {
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
}

function pointsToPath(pts, close=false) {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) d += ` L ${pts[i].x} ${pts[i].y}`;
    if (close) d += ' Z';
    return d;
}

// --- MOUSE HANDLERS ---
function handleMouseDown(e) {
    const p = getLoc(e);
    appState.isDrawing = true;
    if (appState.mode === 'draw') {
        appState.currentPath = [p];
    } else if (appState.mode === 'point') {
        state.points.push({ x: p.x, y: p.y, r: 0 });
        appState.activePointIndex = state.points.length - 1;
        appState.dragStart = p;
        render();
    }
}

function handleMouseMove(e) {
    if (!appState.isDrawing) return;
    const p = getLoc(e);
    if (appState.mode === 'draw') {
        // Drawing logic
        appState.currentPath.push(p);
        const pathData = pointsToPath(appState.currentPath, appState.penType === 'closed');
        
        layerPreview.innerHTML = '';
        const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        previewPath.setAttribute('d', pathData);
        previewPath.setAttribute('stroke', CONFIG.strokeColors[appState.activeSetId] || 'black');
        previewPath.setAttribute('stroke-width', '2');
        previewPath.setAttribute('fill', appState.penType === 'closed' ? CONFIG.fillColors[appState.activeSetId] : 'none');
        layerPreview.appendChild(previewPath);

    } else if (appState.mode === 'point' && appState.activePointIndex !== -1) {
        // Point radius logic
        const pt = state.points[appState.activePointIndex];
        const dx = p.x - appState.dragStart.x;
        const dy = p.y - appState.dragStart.y;
        pt.r = Math.max(0, Math.sqrt(dx * dx + dy * dy));
        render();
    }
}

function handleMouseUp(e) {
    if (!appState.isDrawing) return;
    appState.isDrawing = false;
    layerPreview.innerHTML = '';

    if (appState.mode === 'draw' && appState.currentPath.length > 1) {
        const pathData = pointsToPath(appState.currentPath, appState.penType === 'closed');
        state.sets[appState.activeSetId].paths.push({ 
            d: pathData, 
            type: appState.penType, 
            color: CONFIG.strokeColors[appState.activeSetId] 
        });
        saveHistory();
        render();
    } else if (appState.mode === 'point') {
        appState.activePointIndex = -1;
        saveHistory();
        render();
    }
}

// --- TOOLBAR HANDLERS ---

export function setMode(mode) {
    appState.mode = mode;
    updateUI();
}

export function setPenType(type) {
    appState.penType = type;
}

export function changeActiveSet() { 
    appState.activeSetId = selectSet.value; 
    updateUI(); 
}

export function updateSetName() { 
    const newName = inputName.value.trim().toUpperCase();
    state.sets[appState.activeSetId].name = newName || appState.activeSetId;
}

export function clearAll() {
    clearAllState(); 
    saveHistory(); 
    render();
    document.getElementById('geoResult').textContent = 'Cleared.';
    document.getElementById('pointResult').textContent = 'Cleared.';
    document.getElementById('logicResult').textContent = 'Cleared.';
    layerOverlay.innerHTML = '';
}

export function exportSVG() {
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = 'set_analysis.svg';
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
}

// --- INITIALIZE INTERACTION ---
export function setupInteraction() {
    svg.addEventListener('mousedown', handleMouseDown);
    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseup', handleMouseUp);
    
    // Wire up global functions used in HTML (non-module functions)
    window.setMode = setMode;
    window.setPenType = setPenType;
    window.changeActiveSet = changeActiveSet;
    window.updateSetName = updateSetName;
    window.clearAll = clearAll;
}