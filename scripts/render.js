import { state, appState } from './state.js';
import { CONFIG, layerSets, layerPoints } from './config.js';

export function render() {
    layerSets.innerHTML = '';
    
    // Render permanent sets
    Object.values(state.sets).forEach(set => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        set.paths.forEach(pData => { 
            // Check if this is a composite path (multiple strokes forming one closed shape)
            if (pData.isComposite) {
                // Render the filled closed path with SAME fill color as regular paths
                const fillPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                fillPath.setAttribute('d', pData.d);
                fillPath.setAttribute('stroke', 'none');
                fillPath.setAttribute('fill', CONFIG.fillColors[set.id] || 'gray');
                // NO fill-opacity - use same as regular paths
                g.appendChild(fillPath);
                
                // Render each component stroke with its own style
                if (pData.componentStrokes) {
                    pData.componentStrokes.forEach(stroke => {
                        const strokePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        strokePath.setAttribute('d', stroke.pathData);
                        strokePath.setAttribute('stroke', CONFIG.strokeColors[set.id] || 'black');
                        strokePath.setAttribute('stroke-width', '2');
                        strokePath.setAttribute('fill', 'none');
                        strokePath.setAttribute('stroke-dasharray', stroke.type === 'open' ? '8, 4' : 'none');
                        g.appendChild(strokePath);
                    });
                }
            } else {
                // Regular path
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', pData.d);
                path.setAttribute('stroke', CONFIG.strokeColors[set.id] || 'black');
                path.setAttribute('stroke-width', '2'); 
                
                const isLoop = pData.d.trim().toUpperCase().endsWith('Z');
                path.setAttribute('fill', isLoop ? CONFIG.fillColors[set.id] || 'gray' : 'none');
                
                path.setAttribute('stroke-dasharray', pData.type === 'open' ? '8, 4' : 'none');
                g.appendChild(path);
            }
        });
        layerSets.appendChild(g);
    });
    
    // Render candidate strokes (if exists)
    if (appState.candidate.exists && appState.candidate.strokes.length > 0) {
        const strokeColor = CONFIG.strokeColors[appState.candidate.setId] || 'black';
        
        appState.candidate.strokes.forEach((stroke, index) => {
            // Candidate path
            const candidatePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            candidatePath.setAttribute('d', stroke.pathData);
            candidatePath.setAttribute('stroke', strokeColor);
            candidatePath.setAttribute('stroke-width', '2');
            candidatePath.setAttribute('fill', 'none');
            candidatePath.setAttribute('stroke-dasharray', stroke.penType === 'open' ? '8,4' : 'none');
            candidatePath.setAttribute('class', 'candidate-main-stroke');
            layerSets.appendChild(candidatePath);
        });
        
        // Candidate end points with pulsing animation
        const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        startCircle.setAttribute('cx', appState.candidate.startPoint.x);
        startCircle.setAttribute('cy', appState.candidate.startPoint.y);
        startCircle.setAttribute('r', 4.5);
        startCircle.setAttribute('fill', strokeColor);
        startCircle.setAttribute('stroke', strokeColor);
        startCircle.setAttribute('stroke-width', '1.5');
        startCircle.setAttribute('class', 'candidate-endpoint');
        layerSets.appendChild(startCircle);
        
        const endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        endCircle.setAttribute('cx', appState.candidate.endPoint.x);
        endCircle.setAttribute('cy', appState.candidate.endPoint.y);
        endCircle.setAttribute('r', 4.5);
        endCircle.setAttribute('fill', strokeColor);
        endCircle.setAttribute('stroke', strokeColor);
        endCircle.setAttribute('stroke-width', '1.5');
        endCircle.setAttribute('class', 'candidate-endpoint');
        layerSets.appendChild(endCircle);
    }

    layerPoints.innerHTML = '';
    state.points.forEach((pt, idx) => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        if (pt.r > 0) {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pt.x); circle.setAttribute('cy', pt.y); circle.setAttribute('r', pt.r);
            circle.setAttribute('fill', 'rgba(255,215,0,0.1)'); circle.setAttribute('stroke', 'orange'); circle.setAttribute('stroke-dasharray', '4');
            g.appendChild(circle);
        }
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y); dot.setAttribute('r', 4); dot.setAttribute('fill', 'black');
        g.appendChild(dot);
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pt.x + 8); text.setAttribute('y', pt.y - 8);
        text.textContent = `P${idx+1}`; text.setAttribute('font-size', '12');
        g.appendChild(text);
        layerPoints.appendChild(g);
    });
}