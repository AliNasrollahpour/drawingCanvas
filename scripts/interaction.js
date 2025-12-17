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

// Helper to check if point is near candidate end
function isNearCandidateEnd(point) {
    if (!appState.candidate.exists) return false;
    if (appState.candidate.setId !== appState.activeSetId) return false;
    
    const distToStart = Math.hypot(point.x - appState.candidate.startPoint.x, 
                                   point.y - appState.candidate.startPoint.y);
    const distToEnd = Math.hypot(point.x - appState.candidate.endPoint.x, 
                                 point.y - appState.candidate.endPoint.y);
    
    return {
        nearStart: distToStart < CLOSING_DISTANCE,
        nearEnd: distToEnd < CLOSING_DISTANCE,
        closestEnd: distToStart < distToEnd ? 'start' : 'end',
        distanceToStart: distToStart,
        distanceToEnd: distToEnd
    };
}

// Function to combine all candidate points in correct order
function combineCandidatePoints(candidateStrokes, newStrokePoints, extendingFromEnd) {
    let allPoints = [];
    
    // Collect points from all existing strokes
    candidateStrokes.forEach(stroke => {
        allPoints = allPoints.concat(stroke.points);
    });
    
    if (extendingFromEnd === 'start') {
        // Extending from start: reverse existing points and prepend new stroke (without first point)
        allPoints = [...newStrokePoints.slice(1).reverse(), ...allPoints.slice(1)];
    } else {
        // Extending from end: append new stroke (without first point)
        allPoints = [...allPoints, ...newStrokePoints.slice(1)];
    }
    
    return allPoints;
}

// Render candidate strokes in preview layer
function renderCandidateInPreview(candidateStrokes, isExtending = false) {
    if (!candidateStrokes || candidateStrokes.length === 0) return;
    
    candidateStrokes.forEach((stroke, index) => {
        const strokeColor = CONFIG.strokeColors[appState.candidate.setId] || 'black';
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', stroke.pathData);
        path.setAttribute('stroke', strokeColor);
        path.setAttribute('stroke-width', isExtending ? '1.5' : '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-dasharray', stroke.penType === 'open' ? '8,4' : 'none');
        
        if (isExtending) {
            path.setAttribute('class', 'candidate-preview-stroke');
        } else {
            path.setAttribute('class', 'candidate-main-stroke');
        }
        
        layerPreview.appendChild(path);
    });
    
    // Render candidate endpoints (only if candidate exists)
    if (appState.candidate.exists && !isExtending) {
        const strokeColor = CONFIG.strokeColors[appState.candidate.setId] || 'black';
        
        // Start point
        const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        startCircle.setAttribute('cx', appState.candidate.startPoint.x);
        startCircle.setAttribute('cy', appState.candidate.startPoint.y);
        startCircle.setAttribute('r', 4.5);
        startCircle.setAttribute('fill', strokeColor);
        startCircle.setAttribute('stroke', strokeColor);
        startCircle.setAttribute('stroke-width', '1.5');
        startCircle.setAttribute('class', 'candidate-endpoint');
        layerPreview.appendChild(startCircle);
        
        // End point
        const endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        endCircle.setAttribute('cx', appState.candidate.endPoint.x);
        endCircle.setAttribute('cy', appState.candidate.endPoint.y);
        endCircle.setAttribute('r', 4.5);
        endCircle.setAttribute('fill', strokeColor);
        endCircle.setAttribute('stroke', strokeColor);
        endCircle.setAttribute('stroke-width', '1.5');
        endCircle.setAttribute('class', 'candidate-endpoint');
        layerPreview.appendChild(endCircle);
    }
}

// --- MOUSE HANDLERS ---
function handleMouseDown(e) {
    const p = getLoc(e);
    appState.isDrawing = true;
    
    if (appState.mode === 'draw') {
        // Check if starting near candidate end
        const nearCandidate = isNearCandidateEnd(p);
        
        if (appState.candidate.exists && (nearCandidate.nearStart || nearCandidate.nearEnd)) {
            // Extending candidate - store which end we're extending from
            appState.extendingFromEnd = nearCandidate.closestEnd;
            
            // CRITICAL FIX: Always start EXACTLY at the candidate endpoint
            // This eliminates the visible gap
            if (nearCandidate.closestEnd === 'start') {
                appState.currentPath = [{...appState.candidate.startPoint}];
                console.log("Starting extension from candidate START point");
            } else {
                appState.currentPath = [{...appState.candidate.endPoint}];
                console.log("Starting extension from candidate END point");
            }
            
            // Add the current mouse position as the second point
            // This ensures smooth drawing from the snapped starting point
            appState.currentPath.push(p);
            
        } else {
            // Not extending candidate - start fresh stroke
            appState.currentPath = [p];
            appState.extendingFromEnd = null;
            
            // Discard existing candidate if starting new stroke not near it
            if (appState.candidate.exists) {
                appState.candidate.exists = false;
                appState.candidate.strokes = [];
                console.log("Candidate discarded: new stroke started away from ends");
                render();
            }
        }
        
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
        // Update last point with current position
        if (appState.currentPath.length > 0) {
            appState.currentPath[appState.currentPath.length - 1] = p;
        } else {
            appState.currentPath.push(p);
        }
        
        // Add new point
        appState.currentPath.push(p);
        
        // Clear preview
        layerPreview.innerHTML = '';
        
        // If we have a candidate, show it in preview
        if (appState.candidate.exists) {
            renderCandidateInPreview(appState.candidate.strokes, true);
        }
        
        // Check for snapping for BOTH extending candidate AND single strokes
        let shouldSnap = false;
        let snapPoint = null;
        
        if (appState.extendingFromEnd && appState.candidate.exists) {
            // Snapping for extending candidate (to the other end)
            const otherEnd = appState.extendingFromEnd === 'start' 
                ? appState.candidate.endPoint 
                : appState.candidate.startPoint;
            
            const distanceToOtherEnd = Math.hypot(p.x - otherEnd.x, p.y - otherEnd.y);
            
            if (distanceToOtherEnd < CLOSING_DISTANCE) {
                shouldSnap = true;
                snapPoint = otherEnd;
            }
            
            // Show closing feedback for candidate extension
            const strokeColor = CONFIG.strokeColors[appState.activeSetId] || 'black';
            const otherEndCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            otherEndCircle.setAttribute('cx', otherEnd.x);
            otherEndCircle.setAttribute('cy', otherEnd.y);
            
            if (shouldSnap) {
                // Snap active - show green
                otherEndCircle.setAttribute('fill', '#00FF00');
                otherEndCircle.setAttribute('stroke', '#00CC00');
                otherEndCircle.setAttribute('r', 6);
                otherEndCircle.setAttribute('stroke-width', '2');
                
                // Draw connecting line
                const connectLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                connectLine.setAttribute('x1', p.x);
                connectLine.setAttribute('y1', p.y);
                connectLine.setAttribute('x2', otherEnd.x);
                connectLine.setAttribute('y2', otherEnd.y);
                connectLine.setAttribute('stroke', '#00FF00');
                connectLine.setAttribute('stroke-width', '1.5');
                connectLine.setAttribute('stroke-dasharray', '3,2');
                connectLine.setAttribute('stroke-opacity', '0.8');
                layerPreview.appendChild(connectLine);
            } else if (distanceToOtherEnd < CLOSING_DISTANCE * 3) {
                // Getting close
                otherEndCircle.setAttribute('fill', strokeColor);
                otherEndCircle.setAttribute('stroke', strokeColor);
                otherEndCircle.setAttribute('r', 5);
                otherEndCircle.setAttribute('stroke-width', '1.5');
            } else {
                // Normal state
                otherEndCircle.setAttribute('fill', strokeColor);
                otherEndCircle.setAttribute('stroke', strokeColor);
                otherEndCircle.setAttribute('r', 4.5);
                otherEndCircle.setAttribute('stroke-width', '1.5');
            }
            
            otherEndCircle.setAttribute('class', 'candidate-endpoint');
            layerPreview.appendChild(otherEndCircle);
        } else if (!appState.extendingFromEnd && appState.currentPath.length > 2) {
            // Snapping for single stroke (back to its own start point)
            const start = appState.currentPath[0];
            const distance = Math.hypot(p.x - start.x, p.y - start.y);
            
            if (distance < CLOSING_DISTANCE) {
                shouldSnap = true;
                snapPoint = start;
                
                // Show green start point and connecting line
                const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                startCircle.setAttribute('cx', start.x);
                startCircle.setAttribute('cy', start.y);
                startCircle.setAttribute('r', 6);
                startCircle.setAttribute('fill', '#00FF00');
                startCircle.setAttribute('stroke', '#00CC00');
                startCircle.setAttribute('stroke-width', '2');
                layerPreview.appendChild(startCircle);
                
                const connectLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                connectLine.setAttribute('x1', p.x);
                connectLine.setAttribute('y1', p.y);
                connectLine.setAttribute('x2', start.x);
                connectLine.setAttribute('y2', start.y);
                connectLine.setAttribute('stroke', '#00FF00');
                connectLine.setAttribute('stroke-width', '1.5');
                connectLine.setAttribute('stroke-dasharray', '3,2');
                connectLine.setAttribute('stroke-opacity', '0.8');
                layerPreview.appendChild(connectLine);
            } else if (distance < CLOSING_DISTANCE * 3) {
                // Getting close
                const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                startCircle.setAttribute('cx', start.x);
                startCircle.setAttribute('cy', start.y);
                startCircle.setAttribute('r', 5);
                startCircle.setAttribute('fill', 'rgba(0, 200, 0, 0.7)');
                startCircle.setAttribute('stroke', 'rgba(0, 150, 0, 0.9)');
                startCircle.setAttribute('stroke-width', '1.5');
                layerPreview.appendChild(startCircle);
            }
        }
        
        // Store snap state for use in handleMouseUp
        appState.lastSnapState = {
            shouldSnap: shouldSnap,
            snapPoint: snapPoint,
            currentMousePos: p
        };
        
        // Draw current path being drawn (with possible snapping)
        let displayPath = [...appState.currentPath];
        if (shouldSnap && snapPoint) {
            displayPath = [...displayPath.slice(0, -1), snapPoint];
        }
        
        const pathData = pointsToPath(displayPath, false);
        const previewPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        previewPath.setAttribute('d', pathData);
        previewPath.setAttribute('stroke', CONFIG.strokeColors[appState.activeSetId] || 'black');
        previewPath.setAttribute('stroke-width', '2');
        previewPath.setAttribute('fill', 'none');
        
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
    
    if (appState.mode === 'draw') {
        if (appState.currentPath.length >= 2) {
            // Remove duplicate last point (added in mouse move)
            if (appState.currentPath.length > 2) {
                appState.currentPath = appState.currentPath.slice(0, -1);
            }
            
            const start = appState.currentPath[0];
            const end = appState.currentPath[appState.currentPath.length - 1];
            
            // Use the last snap state from handleMouseMove
            const lastSnapState = appState.lastSnapState;
            
            // Check if we were extending a candidate
            if (appState.extendingFromEnd && appState.candidate.exists) {
                const otherEnd = appState.extendingFromEnd === 'start' 
                    ? appState.candidate.endPoint 
                    : appState.candidate.startPoint;
                
                // Check if we should snap based on last snap state
                const shouldSnap = lastSnapState && lastSnapState.shouldSnap;
                const completesLoop = shouldSnap;
                
                // Adjust the end point if we're close enough to snap
                let adjustedCurrentPath = [...appState.currentPath];
                if (completesLoop && lastSnapState && lastSnapState.snapPoint) {
                    adjustedCurrentPath[adjustedCurrentPath.length - 1] = lastSnapState.snapPoint;
                }
                
                // Create new stroke with adjusted points
                const newStroke = {
                    pathData: pointsToPath(adjustedCurrentPath, false),
                    penType: appState.penType,
                    points: adjustedCurrentPath
                };
                
                if (completesLoop) {
                    // We have a completed loop! Create combined closed path
                    const allPoints = combineCandidatePoints(
                        appState.candidate.strokes, 
                        adjustedCurrentPath, 
                        appState.extendingFromEnd
                    );
                    
                    // Create a closed path from all points
                    const closedPathData = pointsToPath(allPoints, true);
                    
                    // Save the closed path as a filled region
                    state.sets[appState.activeSetId].paths.push({
                        d: closedPathData,
                        type: 'closed', // Always closed for filling
                        isComposite: true, // Mark as composite path
                        componentStrokes: [
                            ...appState.candidate.strokes.map(s => ({ 
                                pathData: s.pathData, 
                                type: s.penType 
                            })),
                            { 
                                pathData: pointsToPath(adjustedCurrentPath, false), 
                                type: appState.penType 
                            }
                        ]
                    });
                    
                    console.log("Candidate completed and saved as filled closed set");
                    saveHistory();
                    
                    // Clear candidate
                    appState.candidate.exists = false;
                    appState.candidate.strokes = [];
                } else {
                    // Add new stroke to candidate and update candidate
                    appState.candidate.strokes.push(newStroke);
                    
                    // Update candidate endpoints based on extending direction
                    if (appState.extendingFromEnd === 'start') {
                        // Extended from start, so start point is new start (the end of new stroke)
                        appState.candidate.startPoint = {x: end.x, y: end.y};
                        // End point remains the same
                    } else {
                        // Extended from end, so end point is new end (the end of new stroke)
                        appState.candidate.endPoint = {x: end.x, y: end.y};
                        // Start point remains the same
                    }
                    
                    console.log("Candidate extended with new stroke");
                }
                
                appState.extendingFromEnd = null;
                
            } else {
                // Not extending a candidate - single stroke
                
                // Check if we should snap based on last snap state
                const shouldSnap = lastSnapState && lastSnapState.shouldSnap;
                const isClosed = shouldSnap;
                
                if (isClosed && lastSnapState && lastSnapState.snapPoint) {
                    // CRITICAL FIX: Use the SAME snapped point that was shown in preview
                    appState.currentPath[appState.currentPath.length - 1] = lastSnapState.snapPoint;
                    
                    // Regular closed stroke - save it as single stroke
                    const pathData = pointsToPath(appState.currentPath, true);
                    state.sets[appState.activeSetId].paths.push({
                        d: pathData,
                        type: appState.penType
                    });
                    saveHistory();
                    // Clear any existing candidate
                    appState.candidate.exists = false;
                    appState.candidate.strokes = [];
                } else {
                    // Open stroke - set as new candidate
                    appState.candidate = {
                        exists: true,
                        setId: appState.activeSetId,
                        strokes: [{
                            pathData: pointsToPath(appState.currentPath, false),
                            penType: appState.penType,
                            points: [...appState.currentPath]
                        }],
                        startPoint: { x: start.x, y: start.y },
                        endPoint: { x: end.x, y: end.y }
                    };
                    console.log("Stroke saved as candidate (open)");
                }
            }
        }
        
        // Clear snap state
        appState.lastSnapState = null;
        
        // Clear preview
        layerPreview.innerHTML = '';
        
        // Clear current path
        appState.currentPath = [];
        
        // Render to update display
        render();
        
    } else if (appState.mode === 'point') {
        appState.activePointIndex = -1;
        saveHistory();
        render();
    }
}

// --- UI EXPORTS ---

export function setMode(mode) {
    appState.mode = mode;
    document.getElementById('modeDraw').className = mode === 'draw' ? 'active' : '';
    document.getElementById('modePoint').className = mode === 'point' ? 'active' : '';
    document.getElementById('setControls').style.opacity = mode === 'draw' ? '1' : '0.5';
    document.getElementById('penTypeControls').style.opacity = mode === 'draw' ? '1' : '0.5';
    // Clear candidate when switching modes
    appState.candidate.exists = false;
    appState.candidate.strokes = [];
    appState.extendingFromEnd = null;
    appState.lastSnapState = null;
    render();
}

export function setPenType(type) {
    appState.penType = type;
}

export function changeActiveSet() { 
    appState.activeSetId = selectSet.value; 
    // Clear candidate when switching sets
    appState.candidate.exists = false;
    appState.candidate.strokes = [];
    appState.extendingFromEnd = null;
    appState.lastSnapState = null;
    updateUI(); 
    render();
}

export function updateSetName() { 
    const newName = inputName.value.trim().toUpperCase();
    state.sets[appState.activeSetId].name = newName || appState.activeSetId;
}

export function clearAll() {
    clearAllState(); 
    appState.candidate.exists = false;
    appState.candidate.strokes = [];
    appState.extendingFromEnd = null;
    appState.lastSnapState = null;
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