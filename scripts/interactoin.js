import { appState, state, saveHistory, updateUI, clearAllState } from './state.js';
import { render } from './render.js';
import { svg, CLOSING_DISTANCE, CONFIG, layerPreview, selectSet, inputName, layerOverlay } from './config.js';
import { analyze } from './analysis.js';

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
        appState.currentPath.push(p);
        const start = appState.currentPath[0];
        const distance = Math.hypot(p.x - start.x, p.y - start.y);
        const isClosed = distance < CLOSING_DISTANCE;
        const d = pointsToPath(appState.currentPath, isClosed);
        const stroke = CONFIG.strokeColors[appState.activeSetId];
        const dash = appState.penType === 'open' ? '8, 4' : 'none';
        const fill = isClosed ? CONFIG.fillColors[appState.activeSetId] : 'none';
        layerPreview.innerHTML = `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-dasharray="${dash}"/>`;
    } else if (appState.mode === 'point' && appState.activePointIndex !== -1) {
        const start = appState.dragStart;
        state.points[appState.activePointIndex].r = Math.hypot(p.x - start.x, p.y - start.y);
        render();
    }
}

function handleMouseUp() {
    if (!appState.isDrawing) return;
    appState.isDrawing = false;
    if (appState.mode === 'draw') {
        if (appState.currentPath.length > 2) {
            const start = appState.currentPath[0];
            const end = appState.currentPath[appState.currentPath.length - 1];
            const distance = Math.hypot(end.x - start.x, end.y - start.y);
            const isClosed = distance < CLOSING_DISTANCE;
            const d = pointsToPath(appState.currentPath, isClosed); 
            state.sets[appState.activeSetId].paths.push({ d: d, type: appState.penType });
            layerPreview.innerHTML = '';
            saveHistory();
            render();
        }
    } else if (appState.mode === 'point') {
        appState.activePointIndex = -1;
        saveHistory();
    }
}

// --- TOOLBAR & UI HANDLERS (Exported for HTML calls) ---
export function setMode(m) {
    appState.mode = m;
    document.getElementById('modeDraw').className = m === 'draw' ? 'active' : '';
    document.getElementById('modePoint').className = m === 'point' ? 'active' : '';
    document.getElementById('setControls').style.opacity = m === 'draw' ? '1' : '0.5';
    document.getElementById('penTypeControls').style.opacity = m === 'draw' ? '1' : '0.5';
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
    
    // Wire up global functions used in HTML
    window.setMode = setMode;
    window.setPenType = setPenType;
    window.changeActiveSet = changeActiveSet;
    window.updateSetName = updateSetName;
    window.clearAll = clearAll;
    window.analyze = analyze;
    window.exportSVG = exportSVG;
}