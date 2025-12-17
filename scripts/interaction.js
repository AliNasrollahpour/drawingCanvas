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
        // Always add the current point to the path
        appState.currentPath.push(p);
        
        // Create preview path WITHOUT automatic closing
        const pathData = pointsToPath(appState.currentPath, false); // Always open in preview
        
        layerPreview.innerHTML = '';
        const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        previewPath.setAttribute('d', pathData);
        previewPath.setAttribute('stroke', CONFIG.strokeColors[appState.activeSetId] || 'black');
        previewPath.setAttribute('stroke-width', '2');
        previewPath.setAttribute('fill', 'none'); // No fill in preview
        
        if (appState.penType === 'open') {
            previewPath.setAttribute('stroke-dasharray', '8, 4');
        }
        
        // Show visual feedback if close to completing a loop
        if (appState.currentPath.length > 2) {
            const start = appState.currentPath[0];
            const distance = Math.hypot(p.x - start.x, p.y - start.y);
            
            if (distance < CLOSING_DISTANCE * 3) { // Slightly larger radius for visual feedback
                // Draw a circle at the start point to show potential closing
                const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                startCircle.setAttribute('cx', start.x);
                startCircle.setAttribute('cy', start.y);
                startCircle.setAttribute('r', 3);
                startCircle.setAttribute('fill', 'rgba(0, 200, 0, 0.5)');
                layerPreview.appendChild(startCircle);
                
                // If very close, draw a connecting line
                if (distance < CLOSING_DISTANCE) {
                    const connectLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    connectLine.setAttribute('x1', p.x);
                    connectLine.setAttribute('y1', p.y);
                    connectLine.setAttribute('x2', start.x);
                    connectLine.setAttribute('y2', start.y);
                    connectLine.setAttribute('stroke', 'rgba(0, 200, 0, 0.7)');
                    connectLine.setAttribute('stroke-dasharray', '3,3');
                    layerPreview.appendChild(connectLine);
                }
            }
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
    
    if (appState.mode === 'draw') {
        // Check if we should save the path or discard it
        if (appState.currentPath.length > 2) {
            const start = appState.currentPath[0];
            const end = appState.currentPath[appState.currentPath.length - 1];
            const distance = Math.hypot(end.x - start.x, end.y - start.y);
            const isClosed = distance < CLOSING_DISTANCE;
            
            // Save ONLY if it's a closed loop (regardless of pen type)
            if (isClosed) {
                const pathData = pointsToPath(appState.currentPath, true); // Always close with 'Z'
                state.sets[appState.activeSetId].paths.push({ 
                    d: pathData, 
                    type: appState.penType 
                });
                saveHistory();
                render();
            } else {
                // Discard the stroke as a false line (not a closed loop)
                console.log(`Discarded ${appState.penType} pen stroke: not a closed loop`);
            }
        }
        
        // Clear preview
        layerPreview.innerHTML = '';
        
    } else if (appState.mode === 'point') {
        appState.activePointIndex = -1;
        saveHistory();
        render();
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