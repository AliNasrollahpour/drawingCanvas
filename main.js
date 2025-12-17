import { state, saveHistory, undo, redo, updateUI } from './scripts/state.js';
import { render } from './scripts/render.js';
import { setupInteraction, setMode, setPenType, changeActiveSet, updateSetName, clearAll } from './scripts/interaction.js';
import { analyze } from './scripts/analysis.js';

console.log('main.js starting...');

// Simple export function
function exportSVG() {
    const svg = document.getElementById('mainSvg');
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'set_analysis.svg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize the dropdown manually
function initDropdown() {
    console.log('Initializing dropdown...');
    const select = document.getElementById('activeSetSelect');
    if (!select) {
        console.error('activeSetSelect element not found!');
        return;
    }
    
    console.log('Found select element, state.sets keys:', Object.keys(state.sets));
    
    // Clear existing options
    select.innerHTML = '';
    
    // Add all sets
    Object.keys(state.sets).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = state.sets[key].name;
        select.appendChild(option);
    });
    
    console.log('Dropdown populated with', select.options.length, 'options');
}

// Toast notification system
function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.log('Toast:', msg);
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    
    if (type === 'success') {
        toast.style.borderLeftColor = '#00b894';
    } else if (type === 'error') {
        toast.style.borderLeftColor = '#d63031';
    }
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            if (toast.parentNode === container) {
                container.removeChild(toast);
            }
        }, 300);
    }, 2000);
}

// Set up event listeners for buttons
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        console.log('Found analyze button');
        analyzeBtn.addEventListener('click', () => {
            console.log('Analyze button clicked');
            analyze();
            showToast('Analysis complete', 'success');
        });
    } else {
        console.error('Analyze button not found!');
    }
    
    // Undo button
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => {
            if (undo()) {
                updateUI();
                render();
                showToast('Undone last action', 'success');
            }
        });
    }
    
    // Redo button
    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) {
        redoBtn.addEventListener('click', () => {
            if (redo()) {
                updateUI();
                render();
                showToast('Redone last action', 'success');
            }
        });
    }
    
    // Clear button
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (confirm("Are you sure you want to clear everything? This cannot be undone.")) {
                clearAll();
                showToast('All cleared successfully', 'success');
            }
        });
    }
    
    // Export button
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const exportType = document.getElementById('exportType');
            if (!exportType) return;
            
            if (exportType.value === 'svg') {
                exportSVG();
                showToast('SVG exported successfully', 'success');
            } else if (exportType.value === 'json') {
                const dataStr = JSON.stringify({
                    sets: state.sets,
                    points: state.points,
                    version: '1.0'
                }, null, 2);
                const blob = new Blob([dataStr], {type: 'application/json'});
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'set_data.json';
                link.click();
                showToast('JSON exported successfully', 'success');
            }
        });
    }
    
    // Theme toggle
    const themeToggle = document.querySelector('.side-controls button');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('theme-dark');
            document.body.classList.toggle('theme-light');
            const isDark = document.body.classList.contains('theme-dark');
            showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'success');
        });
    }
    
    // Set name input
    const setNameInput = document.getElementById('setNameInput');
    if (setNameInput) {
        setNameInput.addEventListener('input', () => {
            updateSetName();
        });
    }
    
    // Active set select
    const activeSetSelect = document.getElementById('activeSetSelect');
    if (activeSetSelect) {
        activeSetSelect.addEventListener('change', () => {
            changeActiveSet();
        });
    }
    
    // Pen select
    const penSelect = document.getElementById('penSelect');
    if (penSelect) {
        penSelect.addEventListener('change', (e) => {
            setPenType(e.target.value);
        });
    }
    
    // Mode buttons
    const modeDraw = document.getElementById('modeDraw');
    const modePoint = document.getElementById('modePoint');
    
    if (modeDraw && modePoint) {
        modeDraw.addEventListener('click', () => {
            setMode('draw');
            modeDraw.className = 'active';
            modePoint.className = '';
        });
        
        modePoint.addEventListener('click', () => {
            setMode('point');
            modePoint.className = 'active';
            modeDraw.className = '';
        });
        
        // Set initial active mode
        modeDraw.className = 'active';
    }
}

// Initialize everything
function init() {
    console.log('Initializing app...');
    
    // Initialize dropdown first
    initDropdown();
    
    // Set up event listeners
    setupEventListeners();
    
    // Set up interaction (mouse events)
    setupInteraction();
    
    // Update UI
    updateUI();
    
    // Initial render
    render();
    
    // Save initial state
    saveHistory();
    
    // Set up global functions for HTML onclick (backup)
    window.undo = () => { if (undo()) { updateUI(); render(); showToast('Undone last action', 'success'); } };
    window.redo = () => { if (redo()) { updateUI(); render(); showToast('Redone last action', 'success'); } };
    window.analyze = analyze;
    window.exportSVG = exportSVG;
    window.setMode = setMode;
    window.setPenType = setPenType;
    window.changeActiveSet = changeActiveSet;
    window.updateSetName = updateSetName;
    window.clearAll = () => {
        if (confirm("Are you sure you want to clear everything? This cannot be undone.")) {
            clearAll();
            showToast('All cleared successfully', 'success');
        }
    };
    window.toggleTheme = () => {
        document.body.classList.toggle('theme-dark');
        document.body.classList.toggle('theme-light');
        const isDark = document.body.classList.contains('theme-dark');
        showToast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 'success');
    };
    window.handleExport = () => {
        const exportType = document.getElementById('exportType');
        if (!exportType) return;
        
        if (exportType.value === 'svg') {
            exportSVG();
            showToast('SVG exported successfully', 'success');
        } else if (exportType.value === 'json') {
            const dataStr = JSON.stringify({
                sets: state.sets,
                points: state.points,
                version: '1.0'
            }, null, 2);
            const blob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'set_data.json';
            link.click();
            showToast('JSON exported successfully', 'success');
        }
    };
    
    // Update layer count
    const layerCount = document.getElementById('layerCount');
    if (layerCount) {
        layerCount.textContent = `(${Object.keys(state.sets).length})`;
    }
    
    console.log('App initialized!');
    
    // Show welcome message
    setTimeout(() => {
        showToast('SetTheoryLab ready! Draw sets and place points, then click Analyze.', 'success');
    }, 500);
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}