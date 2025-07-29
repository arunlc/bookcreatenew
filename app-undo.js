// =======================================================================
// APP-UNDO.JS - Complete Undo/Redo System
// Working Ctrl+Z/Ctrl+Y functionality with state management
// =======================================================================

// Undo system variables
var undoStack = [];
var redoStack = [];
var maxUndoSteps = 20;

// =======================================================================
// UNDO SYSTEM INITIALIZATION
// =======================================================================

function initializeUndoSystem() {
    setupUndoKeyboardListeners();
    setupKeyboardShortcuts();
    logToDebug('Undo system initialized - Ctrl+Z/Ctrl+Y ready', 'success');
}

function setupUndoKeyboardListeners() {
    // Remove existing listeners to prevent duplicates
    document.removeEventListener('keydown', handleUndoKeyboard);
    document.addEventListener('keydown', handleUndoKeyboard);
}

function handleUndoKeyboard(e) {
    // Ctrl+Z for undo
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        performUndo();
        return false;
    }
    
    // Ctrl+Y or Ctrl+Shift+Z for redo
    if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        performRedo();
        return false;
    }
}

function setupKeyboardShortcuts() {
    // Additional keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Ctrl+S for save (if project management is available)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            if (typeof saveProject === 'function') {
                saveProject();
            } else {
                showStatus('Save function not available', 'warning');
            }
        }
        
        // Escape to clear selection/focus
        if (e.key === 'Escape') {
            document.activeElement.blur();
        }
    });
}

// =======================================================================
// UNDO STACK MANAGEMENT
// =======================================================================

function saveToUndoStack(action) {
    if (!processedPages || processedPages.length === 0) {
        logToDebug('No pages to save to undo stack', 'warning');
        return;
    }
    
    var state = {
        action: action,
        timestamp: Date.now(),
        pages: JSON.parse(JSON.stringify(processedPages)), // Deep copy
        currentPage: currentlyEditingPage || 0
    };
    
    undoStack.push(state);
    
    // Limit undo stack size
    if (undoStack.length > maxUndoSteps) {
        undoStack.shift();
    }
    
    // Clear redo stack when new action is performed
    redoStack = [];
    
    logToDebug('Action saved to undo stack: ' + action + ' (' + undoStack.length + ' total)', 'info');
}

function performUndo() {
    if (undoStack.length === 0) {
        showStatus('Nothing to undo', 'warning');
        logToDebug('Undo attempted but stack is empty', 'warning');
        return;
    }
    
    // Save current state to redo stack before undoing
    var currentState = {
        action: 'redo_point',
        timestamp: Date.now(),
        pages: JSON.parse(JSON.stringify(processedPages)),
        currentPage: currentlyEditingPage || 0
    };
    redoStack.push(currentState);
    
    // Restore previous state
    var previousState = undoStack.pop();
    processedPages = previousState.pages;
    currentlyEditingPage = previousState.currentPage;
    
    // Re-render pages to reflect the undone state
    if (typeof renderFormattedPages === 'function') {
        renderFormattedPages(processedPages);
    }
    
    // Update page count display
    if (typeof updatePageCountDisplay === 'function') {
        updatePageCountDisplay();
    }
    
    showStatus('Undo: ' + previousState.action, 'success');
    logToDebug('Undo performed: ' + previousState.action, 'success');
    
    // Mark as changed for auto-save
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
}

function performRedo() {
    if (redoStack.length === 0) {
        showStatus('Nothing to redo', 'warning');
        logToDebug('Redo attempted but stack is empty', 'warning');
        return;
    }
    
    // Save current state back to undo stack
    var currentState = {
        action: 'undo_point',
        timestamp: Date.now(),
        pages: JSON.parse(JSON.stringify(processedPages)),
        currentPage: currentlyEditingPage || 0
    };
    undoStack.push(currentState);
    
    // Restore redo state
    var redoState = redoStack.pop();
    processedPages = redoState.pages;
    currentlyEditingPage = redoState.currentPage;
    
    // Re-render pages to reflect the redone state
    if (typeof renderFormattedPages === 'function') {
        renderFormattedPages(processedPages);
    }
    
    // Update page count display
    if (typeof updatePageCountDisplay === 'function') {
        updatePageCountDisplay();
    }
    
    showStatus('Redo completed', 'success');
    logToDebug('Redo performed', 'success');
    
    // Mark as changed for auto-save
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
}

// =======================================================================
// UNDO SYSTEM STATUS AND DEBUGGING
// =======================================================================

function getUndoStatus() {
    return {
        undoAvailable: undoStack.length > 0,
        redoAvailable: redoStack.length > 0,
        undoCount: undoStack.length,
        redoCount: redoStack.length,
        lastAction: undoStack.length > 0 ? undoStack[undoStack.length - 1].action : 'none'
    };
}

function clearUndoHistory() {
    undoStack = [];
    redoStack = [];
    logToDebug('Undo history cleared', 'info');
    showStatus('Undo history cleared', 'info');
}

// =======================================================================
// DEBUG AND TESTING FUNCTIONS
// =======================================================================

function debugUndoSystem() {
    console.log('=== UNDO SYSTEM DEBUG ===');
    console.log('Undo Stack:', undoStack.length + ' actions');
    console.log('Redo Stack:', redoStack.length + ' actions');
    console.log('Max Steps:', maxUndoSteps);
    
    if (undoStack.length > 0) {
        console.log('Recent Actions:');
        undoStack.slice(-5).forEach(function(action, index) {
            var actualIndex = undoStack.length - 5 + index;
            if (actualIndex >= 0) {
                console.log('  ' + (actualIndex + 1) + '. ' + action.action + 
                           ' (' + new Date(action.timestamp).toLocaleTimeString() + ')');
            }
        });
    }
    
    console.log('Current Page:', currentlyEditingPage);
    console.log('Total Pages:', processedPages ? processedPages.length : 0);
    console.log('Use performUndo() and performRedo() to test manually');
}

function testUndoRedo() {
    console.log('Testing undo/redo system...');
    
    if (!processedPages || processedPages.length === 0) {
        console.log('No pages available for testing');
        return;
    }
    
    // Make a test change
    var originalContent = processedPages[0].content;
    saveToUndoStack('test change');
    processedPages[0].content = 'TEST CONTENT - ' + Date.now();
    processedPages[0].characterCount = processedPages[0].content.length;
    
    if (typeof renderFormattedPages === 'function') {
        renderFormattedPages(processedPages);
    }
    
    console.log('Made test change');
    console.log('Original content length:', originalContent.length);
    console.log('New content:', processedPages[0].content.substring(0, 50) + '...');
    
    setTimeout(function() {
        console.log('Performing undo...');
        performUndo();
        console.log('After undo, content length:', processedPages[0].content.length);
        
        setTimeout(function() {
            console.log('Performing redo...');
            performRedo();
            console.log('After redo, content length:', processedPages[0].content.length);
            console.log('Test completed!');
        }, 1000);
    }, 1000);
}

function showUndoStats() {
    var status = getUndoStatus();
    
    var message = 'Undo System Status:\n' +
                 '• Undo available: ' + (status.undoAvailable ? 'Yes (' + status.undoCount + ' actions)' : 'No') + '\n' +
                 '• Redo available: ' + (status.redoAvailable ? 'Yes (' + status.redoCount + ' actions)' : 'No') + '\n' +
                 '• Last action: ' + status.lastAction + '\n' +
                 '• Keyboard shortcuts: Ctrl+Z (undo), Ctrl+Y (redo)';
    
    alert(message);
}

// =======================================================================
// INTEGRATION HELPERS
// =======================================================================

function saveStateForAction(actionName) {
    // Helper function for other modules to easily save state
    saveToUndoStack(actionName);
}

function isUndoAvailable() {
    return undoStack.length > 0;
}

function isRedoAvailable() {
    return redoStack.length > 0;
}

// =======================================================================
// GLOBAL EXPORTS
// =======================================================================

// Core undo functions
window.initializeUndoSystem = initializeUndoSystem;
window.saveToUndoStack = saveToUndoStack;
window.saveStateForAction = saveStateForAction;
window.performUndo = performUndo;
window.performRedo = performRedo;

// Status and utility functions
window.getU
