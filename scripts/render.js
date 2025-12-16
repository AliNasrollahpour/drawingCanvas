import { state, appState } from './state.js';
import { CONFIG, layerSets, layerPoints } from './config.js';

// --- RENDERING ---
export function render() {
    layerSets.innerHTML = '';
    Object.values(state.sets).forEach(set => {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        set.paths.forEach(pData => { 
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pData.d);
            path.setAttribute('stroke', CONFIG.strokeColors[set.id] || 'black');
            path.setAttribute('stroke-width', '2'); 
            
            const isLoop = pData.d.trim().toUpperCase().endsWith('Z');
            path.setAttribute('fill', isLoop ? CONFIG.fillColors[set.id] || 'gray' : 'none');
            
            path.setAttribute('stroke-dasharray', pData.type === 'open' ? '8, 4' : 'none');
            g.appendChild(path);
        });
        layerSets.appendChild(g);
    });

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