import { appState, state, saveHistory, updateUI, clearAllState } from './state.js';
import { render } from './render.js';
import { svg, CLOSING_DISTANCE, CONFIG, layerPreview, selectSet, inputName, layerOverlay } from './config.js';

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
        const isClosed = distance < CLOSING_DISTANCE; // Although visual feedback uses logic, actual closing happens on MouseUp
        
        // Visual feedback
        const pathData = pointsToPath(appState.currentPath, isClosed);
        
        layerPreview.innerHTML = '';
        const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        previewPath.setAttribute('d', pathData);
        previewPath.setAttribute('stroke', CONFIG.strokeColors[appState.activeSetId] || 'black');
        previewPath.setAttribute('stroke-width', '2');
        previewPath.setAttribute('fill', isClosed ? CONFIG.fillColors[appState.activeSetId] : 'none');
        if (appState.penType === 'open') {
             previewPath.setAttribute('stroke-dasharray', '8, 4');
        }
        layerPreview.appendChild(previewPath);

    } else if (appState.mode === 'point' && appState.activePointIndex !== -1) {
        const start = appState.dragStart;
        state.points[appState.activePointIndex].r = Math.hypot(p.x - start.x, p.y - start.y);
        render();
    }
}

function handleMouseUp(e) {
    if (!appState.isDrawing) return;
    appState.isDrawing = false;
    layerPreview.innerHTML = '';

    if (appState.mode === 'draw') {
        if (appState.currentPath.length > 2) {
            const start = appState.currentPath[0];
            const end = appState.currentPath[appState.currentPath.length - 1];
            const distance = Math.hypot(end.x - start.x, end.y - start.y);
            const isClosed = distance < CLOSING_DISTANCE;
            
            const pathData = pointsToPath(appState.currentPath, isClosed);
            state.sets[appState.activeSetId].paths.push({ 
                d: pathData, 
                type: appState.penType 
            });
            saveHistory();
            render();
        }
    } else if (appState.mode === 'point') {
        appState.activePointIndex = -1;
        saveHistory();
        render(); // Ensure text updates if needed
    }
}

// --- UI EXPORTS (Attached to Window for HTML Buttons) ---

export function setMode(mode) {
    appState.mode = mode;
    document.getElementById('modeDraw').className = mode === 'draw' ? 'active' : '';
    document.getElementById('modePoint').className = mode === 'point' ? 'active' : '';
    document.getElementById('setControls').style.opacity = mode === 'draw' ? '1' : '0.5';
    document.getElementById('penTypeControls').style.opacity = mode === 'draw' ? '1' : '0.5';
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

// --- INITIALIZE ---
export function setupInteraction() {
    svg.addEventListener('mousedown', handleMouseDown);
    svg.addEventListener('mousemove', handleMouseMove);
    svg.addEventListener('mouseup', handleMouseUp);
    
    // Bind to window so HTML onClick works
    window.setMode = setMode;
    window.setPenType = setPenType;
    window.changeActiveSet = changeActiveSet;
    window.updateSetName = updateSetName;
    window.clearAll = clearAll;
}