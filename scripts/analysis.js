import { state } from './state.js';
import { W, H, BOUNDARY_PROXIMITY, layerOverlay, NOTATION } from './config.js';

// --- GEOMETRIC HELPERS ---

function isPointNearBoundary(px, py, boundaryMask, width, distance) {
    for (let dy = -distance; dy <= distance; dy++) {
        for (let dx = -distance; dx <= distance; dx++) {
            const nx = Math.floor(px) + dx;
            const ny = Math.floor(py) + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < H) {
                const ni = ny * width + nx;
                if (boundaryMask[ni]) return true;
            }
        }
    }
    return false;
}

function calculateDiameter(mask, width, height) {
    const pts = [];
    for (let y = 0; y < height; y++) {
        const row = y * width;
        for (let x = 0; x < width; x++) {
            if (mask[row + x]) pts.push([x, y]);
        }
    }

    if (pts.length < 2) return 0;

    // --- Convex Hull (Monotonic Chain) ---
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);

    const cross = (o, a, b) =>
        (a[0] - o[0]) * (b[1] - o[1]) -
        (a[1] - o[1]) * (b[0] - o[0]);

    const hull = [];

    // lower hull
    for (const p of pts) {
        while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0)
            hull.pop();
        hull.push(p);
    }

    // upper hull
    const lowerSize = hull.length;
    for (let i = pts.length - 1; i >= 0; i--) {
        const p = pts[i];
        while (hull.length > lowerSize && cross(hull[hull.length - 2], hull[hull.length - 1], p) <= 0)
            hull.pop();
        hull.push(p);
    }

    hull.pop(); 

    // --- Rotating Calipers for Diameter ---
    let maxDistSq = 0;
    let j = 1;

    const distSq = (a, b) => {
        const dx = a[0] - b[0];
        const dy = a[1] - b[1];
        return dx * dx + dy * dy;
    };

    for (let i = 0; i < hull.length; i++) {
        const next = (i + 1) % hull.length;
        while (true) {
            const nextJ = (j + 1) % hull.length;
            const crossVal =
                Math.abs(cross(hull[i], hull[next], hull[nextJ])) -
                Math.abs(cross(hull[i], hull[next], hull[j]));

            if (crossVal > 0) j = nextJ;
            else break;
        }
        maxDistSq = Math.max(maxDistSq, distSq(hull[i], hull[j]));
    }

    return Math.sqrt(maxDistSq).toFixed(2);
}

// --- CORE ANALYSIS FUNCTIONS ---

function analyzeSingleSet(setPaths, width, height) {
    if(setPaths.length === 0) return null;

    const off = document.createElement('canvas');
    off.width = width; off.height = height;
    const ctx = off.getContext('2d');
    const strokeMasks = [];

    for(const pData of setPaths) { 
        ctx.clearRect(0,0,width,height);
        ctx.fillStyle = 'black'; ctx.fillRect(0,0,width,height);
        const p = new Path2D(pData.d);
        
        if (pData.d.trim().toUpperCase().endsWith('Z')) { 
            ctx.fillStyle = 'white'; ctx.fill(p); 
        } else {
            ctx.strokeStyle = 'white'; ctx.lineWidth = 4; ctx.stroke(p); 
        }
        
        const data = ctx.getImageData(0,0,width,height).data;
        const mask = new Uint8Array(width*height);
        for(let k=0; k<width*height; k++) mask[k] = data[k*4] > 128 ? 1 : 0;
        strokeMasks.push(mask);
    }
    
    const strokeTypes = setPaths.map(p => p.type);
    
    // Parts and Preliminary Union
    const adj = new Array(setPaths.length).fill(0).map(()=>[]);
    for(let i=0; i<setPaths.length; i++){
        for(let j=i+1; j<setPaths.length; j++){
            let overlap = false;
            const mi = strokeMasks[i], mj = strokeMasks[j];
            for(let k=0; k<width*height; k++){
                if(mi[k] && mj[k]) { overlap=true; break; }
            }
            if(overlap){ adj[i].push(j); adj[j].push(i); }
        }
    }
    const parts = [];
    const seen = new Array(setPaths.length).fill(false);
    for(let i=0; i<setPaths.length; i++){
        if(!seen[i]){
            const q=[i]; seen[i]=true; const part=[];
            while(q.length){
                const u=q.pop(); part.push(u);
                for(const v of adj[u]) if(!seen[v]){ seen[v]=true; q.push(v); }
            }
            parts.push(part);
        }
    }
    const partMasks = []; 
    let preliminaryUnionMask = new Uint8Array(width*height); 
    for(const part of parts){
        const pm = new Uint8Array(width*height); 
        for(const idx of part){
            const m = strokeMasks[idx];
            for(let k=0; k<width*height; k++) if(m[k]) pm[k] = 1;
        }
        partMasks.push(pm);
        for(let k=0; k<width*height; k++) {
            if(pm[k] && !preliminaryUnionMask[k]) {
                preliminaryUnionMask[k] = 1;
            }
        }
    }

    // Boundary Detection
    const boundaryMask = new Uint8Array(width * height); 
    let finalSetType = 'neither';
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const i = y * width + x;
            if (!preliminaryUnionMask[i]) continue;
            const nb = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [1, -1], [-1, 1]]; 
            let isBoundary = false;
            for (const [dx, dy] of nb) {
                const nx = x + dx, ny = y + dy;
                if (nx < 0 || nx >= width || ny < 0 || ny >= height) {
                    isBoundary = true; 
                    break;
                }
                const ni = ny * width + nx;
                if (!preliminaryUnionMask[ni]) {
                    isBoundary = true; 
                    break;
                }
            }
            if (isBoundary) {
                boundaryMask[i] = 1; 
            }
        }
    }
    
    // Part Type Classification
    const partResults = [];
    for (let pi = 0; pi < partMasks.length; pi++) {
        const partMask = partMasks[pi];
        const partBoundary = new Uint8Array(width * height);
        for (let k = 0; k < W*H; k++) {
            if (partMask[k] && boundaryMask[k]) {
                partBoundary[k] = 1;
            }
        }
        const typesSeen = new Set();
        for (const sIdx of parts[pi]) { 
            const sm = strokeMasks[sIdx];
            let touches = false;
            for (let k = 0; k < width * height; k++) {
                if (sm[k] && partBoundary[k]) {
                    touches = true;
                    break;
                }
            }
            if (touches) typesSeen.add(strokeTypes[sIdx]); 
        }
        let partType = 'neither';
        if (typesSeen.size === 1) partType = typesSeen.has('open') ? 'open' : 'closed';
        partResults.push(partType);
    }
    const unique = Array.from(new Set(partResults));
    if (unique.length === 1) finalSetType = unique[0];

    // Final Union Mask
    let unionMask = new Uint8Array(width * height);
    if (finalSetType === 'open') {
        for (let k = 0; k < width * height; k++) {
            if (preliminaryUnionMask[k] && !boundaryMask[k]) {
                unionMask[k] = 1;
            }
        }
    } else { 
        unionMask = preliminaryUnionMask;
    }
    
    const diameter = calculateDiameter(unionMask, width, height);

    // Boundary Overlay
    layerOverlay.innerHTML = '';
    let boundaryPathData = [];
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (boundaryMask[y * width + x]) { 
                boundaryPathData.push(`M${x},${y}h1v1h-1z`);
            }
        }
    }
    if (boundaryPathData.length > 0) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', boundaryPathData.join(' '));
        path.setAttribute('fill', 'rgba(255, 100, 100, 0.2)');
        path.setAttribute('stroke', 'none'); 
        layerOverlay.appendChild(path);
    }

    return {
        partsCount: parts.length,
        setType: finalSetType, 
        unionMask: unionMask, 
        boundaryMask: boundaryMask, 
        diameter: diameter 
    };
}

function analyzePointWithNeighborhood(pt, results, W, H) {
    const r = pt.r || 1; 
    const setInteractions = {}; 

    Object.keys(results).forEach(sid => {
        setInteractions[sid] = { totalCheck: 0, inside: 0, outside: 0 };
    });

    const cx = pt.x;
    const cy = pt.y;
    const minX = Math.max(0, Math.floor(cx - r));
    const maxX = Math.min(W - 1, Math.ceil(cx + r));
    const minY = Math.max(0, Math.floor(cy - r));
    const maxY = Math.min(H - 1, Math.ceil(cy + r));

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            if (Math.hypot(x - cx, y - cy) <= r) {
                const idx = y * W + x;
                Object.keys(results).forEach(sid => {
                    setInteractions[sid].totalCheck++;
                    if (results[sid].unionMask[idx]) {
                        setInteractions[sid].inside++;
                    } else {
                        setInteractions[sid].outside++;
                    }
                });
            }
        }
    }

    let statements = [];

    Object.keys(results).forEach(sid => {
        const interaction = setInteractions[sid];
        if (interaction.totalCheck === 0) return;

        const name = state.sets[sid].name;
        const insideCount = interaction.inside;
        const outsideCount = interaction.outside;
        
        const pointName = `P${state.points.findIndex(p => p === pt) + 1}`;
        const neighborhood = `${NOTATION.NEIGHBORHOOD}(${pointName})`;
        
        if (insideCount > 0 && outsideCount === 0) {
            statements.push(`${neighborhood} ${NOTATION.SUBSET} ${name}`);
        } else if (insideCount > 0 && outsideCount > 0) {
            statements.push(`${neighborhood} ${NOTATION.INTERSECTION} ${name} ${NOTATION.NOT_EQUAL} ${NOTATION.EMPTY_SET}`);
        } else {
            statements.push(`${neighborhood} ${NOTATION.INTERSECTION} ${name} ${NOTATION.EQUAL} ${NOTATION.EMPTY_SET}`);
        }
    });

    return statements.join(' | ');
}

export function analyze() {
    layerOverlay.innerHTML = '';
    let geoText = "";
    let pointText = "";
    let logicText = "";

    const results = {};
    
    // 1. Analyze Each Set Individually
    Object.values(state.sets).forEach(set => {
        if(set.paths.length === 0) return;
        
        const res = analyzeSingleSet(set.paths, W, H);
        if(!res) return;
        
        results[set.id] = res;

        const setTypeLabel = res.setType === 'open' ? 'Open' : (res.setType === 'closed' ? 'Closed' : 'Neither');
        geoText += `### ${set.name}\n`;
        geoText += `* **Type:** ${setTypeLabel}\n`;
        geoText += `* **Parts:** ${res.partsCount}\n`;
        geoText += `* **Diameter:** ${res.diameter} px\n---\n`;
    });

    // 2. Point Classification
    if(state.points.length > 0) {
        state.points.forEach((pt, i) => {
            const fx = Math.floor(pt.x);
            const fy = Math.floor(pt.y);
            const idx = fy * W + fx;
            
            const pointName = `P${i+1}`;
            let closureSets = [];
            let classificationDetails = [];
            
            Object.keys(results).forEach(sid => {
                const res = results[sid];
                const name = state.sets[sid].name;
                
                const isInSet = res.unionMask[idx];
                const isOnBoundaryPixel = res.boundaryMask[idx];
                const isNearBoundary = isPointNearBoundary(pt.x, pt.y, res.boundaryMask, W, BOUNDARY_PROXIMITY);
                
                let classification = 'Exterior';
                
                if (isInSet) {
                    classification = isOnBoundaryPixel ? 'Boundary' : 'Interior';
                } else {
                    if (isOnBoundaryPixel || isNearBoundary) {
                        classification = 'Boundary';
                    } else {
                        classification = 'Exterior';
                    }
                }
                
                if (classification === 'Interior') {
                    classificationDetails.push(`${pointName} ${NOTATION.ELEMENT_OF} ${name}${NOTATION.INTERIOR}`);
                    closureSets.push(name + NOTATION.CLOSURE);
                } else if (classification === 'Boundary') {
                    classificationDetails.push(`${pointName} ${NOTATION.ELEMENT_OF} ${NOTATION.BOUNDARY}${name}`);
                    closureSets.push(name + NOTATION.CLOSURE);
                } else { 
                    classificationDetails.push(`${pointName} ${NOTATION.NOT_ELEMENT_OF} ${name}${NOTATION.CLOSURE}`);
                }
            });

            let currentStatus = `${pointName}`;
            if (closureSets.length > 0) {
                currentStatus += ` ${NOTATION.ELEMENT_OF} ${closureSets.join(" ")}`;
            } else {
                currentStatus += ` ${NOTATION.NOT_ELEMENT_OF} (All ${NOTATION.CLOSURE}s)`;
            }

            pointText += `${currentStatus}\n`;
            pointText += `* ${classificationDetails.join(' | ')}\n`;
            
            if (pt.r > 0) {
                const neighborhoodAnalysis = analyzePointWithNeighborhood(pt, results, W, H);
                pointText += `* ${neighborhoodAnalysis}\n`;
            }
            pointText += `\n`;
        });
    }

    // 3. Multi-Set Logic
    const ids = Object.keys(results);
    const logicGroups = {
        [NOTATION.INTERSECTION]: [], 
        [NOTATION.DIFFERENCE]: [],   
        [NOTATION.SUBSET]: []        
    };
    
    for(let i=0; i<ids.length; i++){
        for(let j=i+1; j<ids.length; j++){ 
            const idA = ids[i], idB = ids[j];
            const maskA = results[idA].unionMask;
            const maskB = results[idB].unionMask;
            const nameA = state.sets[idA].name;
            const nameB = state.sets[idB].name;

            let intersectCount = 0;
            let onlyACount = 0;
            let onlyBCount = 0;
            let aInB = true; 
            let bInA = true; 

            for(let k=0; k<W*H; k++){
                const a = maskA[k] || 0;
                const b = maskB[k] || 0;
                if(a && b) intersectCount++;
                if(a && !b) {
                    onlyACount++;
                    aInB = false;
                }
                if(b && !a) {
                    onlyBCount++;
                    bInA = false;
                }
            }
            
            // Intersection
            if(intersectCount > 0) {
                logicGroups[NOTATION.INTERSECTION].push(`${nameA} ${NOTATION.INTERSECTION} ${nameB} ${NOTATION.NOT_EQUAL} ${NOTATION.EMPTY_SET}`);
            } else {
                logicGroups[NOTATION.INTERSECTION].push(`${nameA} ${NOTATION.INTERSECTION} ${nameB} ${NOTATION.EQUAL} ${NOTATION.EMPTY_SET}`);
            }

            // Difference A \ B
            if(onlyACount > 0) {
                logicGroups[NOTATION.DIFFERENCE].push(`${nameA} ${NOTATION.DIFFERENCE} ${nameB} ${NOTATION.NOT_EQUAL} ${NOTATION.EMPTY_SET}`);
            } else {
                logicGroups[NOTATION.DIFFERENCE].push(`${nameA} ${NOTATION.DIFFERENCE} ${nameB} ${NOTATION.EQUAL} ${NOTATION.EMPTY_SET}`);
            }
            // Difference B \ A
            if(onlyBCount > 0) {
                logicGroups[NOTATION.DIFFERENCE].push(`${nameB} ${NOTATION.DIFFERENCE} ${nameA} ${NOTATION.NOT_EQUAL} ${NOTATION.EMPTY_SET}`);
            } else {
                logicGroups[NOTATION.DIFFERENCE].push(`${nameB} ${NOTATION.DIFFERENCE} ${nameA} ${NOTATION.EQUAL} ${NOTATION.EMPTY_SET}`);
            }
            
            // Subset/Equality
            if (results[idA].diameter > 0 && aInB) {
                if (onlyBCount > 0) {
                    logicGroups[NOTATION.SUBSET].push(`${nameA} ${NOTATION.SUBSET} ${nameB}`);
                } else {
                    logicGroups[NOTATION.SUBSET].push(`${nameA} ${NOTATION.EQUAL} ${nameB}`);
                }
            }
            if (results[idB].diameter > 0 && bInA) {
                if (onlyACount > 0) {
                    logicGroups[NOTATION.SUBSET].push(`${nameB} ${NOTATION.SUBSET} ${nameA}`);
                } 
            }
        }
    }

    if (logicGroups[NOTATION.INTERSECTION].length > 0) {
        logicText += `### Intersection (${NOTATION.INTERSECTION})\n`;
        logicGroups[NOTATION.INTERSECTION].forEach(line => logicText += `* ${line}\n`);
        logicText += `---\n`;
    }
    if (logicGroups[NOTATION.DIFFERENCE].length > 0) {
        logicText += `### Difference (${NOTATION.DIFFERENCE})\n`;
        logicGroups[NOTATION.DIFFERENCE].forEach(line => logicText += `* ${line}\n`);
        logicText += `---\n`;
    }
    if (logicGroups[NOTATION.SUBSET].length > 0) {
        logicText += `### Containment (${NOTATION.SUBSET} or ${NOTATION.EQUAL})\n`;
        logicGroups[NOTATION.SUBSET].forEach(line => logicText += `* ${line}\n`);
        logicText += `---\n`;
    }

    document.getElementById('geoResult').textContent = geoText || "No sets drawn.";
    document.getElementById('pointResult').textContent = pointText || "No points placed.";
    document.getElementById('logicResult').textContent = logicText || "No interactions.";
}