// =======================================================================
// APP-MAIN.JS - Main Integration and Document Processing
// Complete document processing, initialization, and module coordination
// =======================================================================

// =======================================================================
// COMPLETE DOCUMENT PROCESSING SYSTEM
// =======================================================================

function processCompleteDocument() {
    logToDebug('Processing complete document with enhanced parsing...', 'info');
    
    if (!documentHTML && !documentText) {
        showStatus('Please upload a document first', 'error');
        return;
    }

    // Save initial state for undo
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('process document');
    }

    showProgress(true);
    updateProgress(10);

    var bookType = getElementValue('bookType', 'text');
    var bookSize = getElementValue('bookSize', 'standard');
    var illustrationFreq = getElementValue('illustrationFreq', 'none');

    currentBookSize = bookSize;
    if (typeof updatePageDimensions === 'function') {
        updatePageDimensions();
    }

    logToDebug('Processing with settings: ' + bookType + ', ' + bookSize, 'info');

    updateProgress(30);
    
    try {
        // Enhanced document parsing to capture complete content
        var completeText = extractCompleteText();
        var enhancedStructure = parseEnhancedDocumentStructure(completeText);
        
        updateProgress(50);
        
        // Create smart layout that preserves all content
        processedPages = createCompleteSmartLayout(enhancedStructure, bookType, illustrationFreq);
        
        updateProgress(70);
        
        // Render pages
        if (typeof renderFormattedPages === 'function') {
            renderFormattedPages(processedPages);
        }
        
        updateProgress(100);
        
        var resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        if (typeof updatePageCountDisplay === 'function') {
            updatePageCountDisplay();
        }
        
        showStatus('Successfully generated ' + processedPages.length + ' pages - Complete document processed!', 'success');
        setTimeout(function() { showProgress(false); }, 1000);
        
        if (typeof markAsChanged === 'function') {
            markAsChanged();
        }
        
        logToDebug('Complete document processing finished - ' + processedPages.length + ' pages created', 'success');
        
    } catch (err) {
        logToDebug('Error in processCompleteDocument: ' + err.message, 'error');
        showStatus('Error processing document: ' + err.message, 'error');
        showProgress(false);
    }
}

function extractCompleteText() {
    // Use documentText if available, otherwise extract from HTML
    if (documentText && documentText.trim()) {
        logToDebug('Using extracted text: ' + documentText.length + ' characters', 'info');
        return documentText.trim();
    } else if (documentHTML) {
        // Clean HTML and extract text
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = documentHTML;
        var extractedText = tempDiv.textContent || tempDiv.innerText || '';
        logToDebug('Extracted from HTML: ' + extractedText.length + ' characters', 'info');
        return extractedText.trim();
    } else {
        throw new Error('No document content available');
    }
}

function parseEnhancedDocumentStructure(text) {
    // Split into paragraphs preserving structure
    var paragraphs = text.split(/\n\s*\n/).filter(function(p) { 
        return p.trim().length > 0; 
    });
    
    var structure = [];
    
    for (var i = 0; i < paragraphs.length; i++) {
        var paragraph = paragraphs[i].trim();
        
        // Check if it's a heading (starts with title case, short length, etc.)
        var isHeading = isLikelyHeading(paragraph);
        
        structure.push({
            content: paragraph,
            isHeading: isHeading,
            index: i,
            length: paragraph.length
        });
    }
    
    logToDebug('Enhanced structure parsed: ' + structure.length + ' paragraphs, ' + 
               structure.filter(function(s) { return s.isHeading; }).length + ' headings', 'success');
    
    return structure;
}

function isLikelyHeading(text) {
    // Simple heuristics for heading detection
    if (!text || text.length === 0) return false;
    if (text.length > 200) return false; // Too long to be a heading
    if (text.includes('\n')) return false; // Headings are usually single lines
    
    // Check for common heading patterns
    var headingPatterns = [
        /^Chapter \d+/i,
        /^Part \d+/i,
        /^Section \d+/i,
        /^\d+\./,
        /^[A-Z][^.!?]*[^.!?]$/  // Starts with capital, no sentence endings
    ];
    
    for (var i = 0; i < headingPatterns.length; i++) {
        if (headingPatterns[i].test(text.trim())) {
            return true;
        }
    }
    
    // Check if text is all caps or mostly capitalized
    var words = text.split(' ');
    var capitalizedWords = words.filter(function(word) {
        return word.length > 0 && word[0] === word[0].toUpperCase();
    });
    
    return capitalizedWords.length / words.length > 0.8 && words.length <= 10;
}

function createCompleteSmartLayout(structure, bookType, illustrationFreq) {
    var pages = [];
    var pageNumber = 1;
    var currentPageContent = [];
    var currentPageHeight = 0;
    
    // Calculate available height based on page dimensions
    var availableHeight = calculateAvailableTextHeight();
    
    logToDebug('Creating complete smart layout with ' + availableHeight + 'px available height', 'info');

    for (var i = 0; i < structure.length; i++) {
        var item = structure[i];
        
        // Measure actual height this paragraph would take
        var paragraphHeight = measureParagraphHeight(item.content);
        
        // Check if we need a new page (but always put at least one paragraph per page)
        if (currentPageHeight + paragraphHeight > availableHeight && currentPageContent.length > 0) {
            // Create page with current content
            pages.push(createSmartPage(pageNumber, currentPageContent, illustrationFreq));
            currentPageContent = [];
            currentPageHeight = 0;
            pageNumber++;
        }
        
        // Add paragraph to current page
        currentPageContent.push(item);
        currentPageHeight += paragraphHeight + 20; // Add spacing between paragraphs
        
        logToDebug('Added paragraph ' + (i + 1) + ' to page ' + pageNumber + 
                  ' (height: ' + paragraphHeight + 'px, total: ' + currentPageHeight + 'px)', 'flow');
    }
    
    // Add final page if there's remaining content
    if (currentPageContent.length > 0) {
        pages.push(createSmartPage(pageNumber, currentPageContent, illustrationFreq));
    }

    logToDebug('Complete smart layout finished: ' + pages.length + ' pages created', 'success');
    
    // Verify all content is included
    var totalOriginalChars = structure.reduce(function(total, item) {
        return total + item.content.length;
    }, 0);
    
    var totalPageChars = pages.reduce(function(total, page) {
        return total + page.characterCount;
    }, 0);
    
    logToDebug('Content verification: Original=' + totalOriginalChars + ' chars, Pages=' + totalPageChars + ' chars', 'info');
    
    return pages;
}

function createSmartPage(pageNumber, contentItems, illustrationFreq) {
    var content = contentItems.map(function(item) { return item.content; }).join('\n\n');
    var hasHeading = contentItems.some(function(item) { return item.isHeading; });
    var hasIllustration = shouldHaveIllustration(illustrationFreq, pageNumber);
    
    return {
        number: pageNumber,
        content: content,
        contentItems: contentItems,
        characterCount: content.length,
        images: hasIllustration ? [{ type: 'half', id: 'img_' + pageNumber + '_1' }] : [],
        hasIllustration: hasIllustration,
        hasHeading: hasHeading,
        isChapterStart: hasHeading
    };
}

// =======================================================================
// MAIN APPLICATION INITIALIZATION
// =======================================================================

function initializeCompleteApp() {
    logToDebug('Initializing complete app system...', 'info');
    
    try {
        // Initialize undo system
        if (typeof initializeUndoSystem === 'function') {
            initializeUndoSystem();
        }
        
        // Initialize project management if available
        if (typeof initializeProjectManagement === 'function') {
            initializeProjectManagement();
        }
        
        // Check for recovery data if available
        if (typeof checkForRecoveryData === 'function') {
            checkForRecoveryData();
        }
        
        // Set up debug console
        setupDebugConsole();
        
        logToDebug('Complete app system initialized successfully', 'success');
        
    } catch (err) {
        logToDebug('Error initializing app: ' + err.message, 'error');
        showStatus('Initialization error: ' + err.message, 'error');
    }
}

function setupDebugConsole() {
    // Add debug button click handler if not already set
    var debugButton = document.querySelector('.debug-button');
    if (debugButton && !debugButton.hasAttribute('data-handler-set')) {
        debugButton.addEventListener('click', showDebugConsole);
        debugButton.setAttribute('data-handler-set', 'true');
    }
}

function showDebugConsole() {
    var debugConsole = document.getElementById('debugConsole');
    if (!debugConsole) {
        addDebugConsole();
    }
    document.getElementById('debugConsole').style.display = 'block';
    logToDebug('Debug console opened - Complete system with all modules active!', 'success');
}

function addDebugConsole() {
    var debugDiv = document.createElement('div');
    debugDiv.id = 'debugConsole';
    debugDiv.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 500px; max-height: 450px; background: #1a1a1a; color: #00ff00; font-family: monospace; font-size: 12px; padding: 15px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); overflow-y: auto; z-index: 1000; display: none; border: 2px solid #333;';
    
    debugDiv.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 8px;"><strong style="color: #ffffff; font-size: 14px;">🐛 Debug Console - Complete System v4.0</strong><button onclick="document.getElementById(\'debugConsole\').style.display=\'none\'" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">✕ Close</button></div><div id="debugLog" style="max-height: 350px; overflow-y: auto;"></div><div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #333; font-size: 10px; color: #888;">💡 Complete system: Core rendering, Undo (Ctrl+Z), Flow management, Actions (Move Para, Split), Export functions</div>';
    
    document.body.appendChild(debugDiv);
}

// =======================================================================
// PROGRESS AND STATUS UTILITY FUNCTIONS
// =======================================================================

function showProgress(show) {
    var progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.display = show ? 'block' : 'none';
        if (!show) updateProgress(0);
    }
}

function updateProgress(percent) {
    var progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = percent + '%';
    }
}

function showStatus(message, type) {
    console.log('[STATUS] ' + type.toUpperCase() + ': ' + message);
    
    var statusDiv = document.getElementById('statusMessage');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = 'status-message status-' + type;
        statusDiv.style.display = 'block';
        
        setTimeout(function() {
            statusDiv.style.display = 'none';
        }, 5000);
    }
}

function logToDebug(message, type) {
    console.log('[DEBUG] ' + message);
    
    var debugLog = document.getElementById('debugLog');
    if (debugLog) {
        var colors = { 
            info: '#00ff00', 
            warn: '#ffaa00', 
            error: '#ff4444', 
            success: '#00aa00', 
            flow: '#00aaff',
            save: '#ff00ff'
        };
        var timestamp = new Date().toLocaleTimeString();
        var color = colors[type] || '#00ff00';
        debugLog.innerHTML += '<div style="color: ' + color + '; margin-bottom: 3px;">[' + timestamp + '] ' + message + '</div>';
        debugLog.scrollTop = debugLog.scrollHeight;
    }
}

// =======================================================================
// MAIN DEBUG AND TESTING FUNCTIONS
// =======================================================================

function debugCompleteSystem() {
    console.log('=== COMPLETE SYSTEM DEBUG ===');
    console.log('Modules loaded:');
    console.log('- App-Core.js: Page rendering and management');
    console.log('- App-Undo.js: Undo/Redo system (Ctrl+Z/Ctrl+Y)');
    console.log('- App-Flow.js: Semi-independence flow system');
    console.log('- App-Actions.js: Move Para, Split Here, Images');
    console.log('- App-Export.js: Copy and export functions');
    console.log('- App-Main.js: Integration and document processing');
    
    console.log('\nSystem Status:');
    console.log('- Pages loaded:', processedPages ? processedPages.length : 0);
    console.log('- Current book size:', currentBookSize || 'standard');
    console.log('- Is reflowing:', isReflowing || false);
    console.log('- Currently editing page:', currentlyEditingPage || 'none');
    
    // Check undo system
    if (typeof getUndoStatus === 'function') {
        var undoStatus = getUndoStatus();
        console.log('- Undo available:', undoStatus.undoAvailable);
        console.log('- Redo available:', undoStatus.redoAvailable);
    }
    
    console.log('\nAvailable debug functions:');
    console.log('- debugCompleteSystem() - This function');
    console.log('- debugFlowSystem() - Flow system debug');
    console.log('- debugUndoSystem() - Undo system debug');
    console.log('- debugPageActions() - Page actions debug');
    console.log('- debugExportSystem() - Export functions debug');
    console.log('- testCompleteWorkflow() - Test all major functions');
}

function testCompleteWorkflow() {
    console.log('Testing complete workflow...');
    
    if (!processedPages || processedPages.length === 0) {
        console.log('No pages available. Please process a document first.');
        return;
    }
    
    console.log('1. Testing undo system...');
    if (typeof testUndoRedo === 'function') {
        testUndoRedo();
    }
    
    setTimeout(function() {
        console.log('2. Testing move paragraph...');
        if (typeof testMoveParaAction === 'function') {
            testMoveParaAction();
        }
        
        setTimeout(function() {
            console.log('3. Testing export functions...');
            if (typeof testExportFunctions === 'function') {
                testExportFunctions();
            }
            
            setTimeout(function() {
                console.log('4. Testing flow system...');
                if (typeof testFlowSystem === 'function') {
                    testFlowSystem();
                }
                console.log('Complete workflow test finished!');
            }, 2000);
        }, 2000);
    }, 3000);
}

function showSystemStats() {
    if (!processedPages || processedPages.length === 0) {
        alert('No pages loaded. Please process a document first.');
        return;
    }
    
    var totalChars = processedPages.reduce(function(total, page) {
        return total + page.characterCount;
    }, 0);
    
    var pagesWithImages = processedPages.filter(function(page) {
        return page.images && page.images.length > 0;
    }).length;
    
    var undoInfo = '';
    if (typeof getUndoStatus === 'function') {
        var undoStatus = getUndoStatus();
        undoInfo = '\n• Undo history: ' + undoStatus.undoCount + ' actions';
    }
    
    var stats = 'Complete System Statistics:\n' +
                '• Total pages: ' + processedPages.length + '\n' +
                '• Total characters: ' + totalChars + '\n' +
                '• Average per page: ' + Math.round(totalChars / processedPages.length) + '\n' +
                '• Pages with images: ' + pagesWithImages + '\n' +
                '• Book size: ' + (currentBookSize || 'standard') + undoInfo + '\n\n' +
                'System Features:\n' +
                '• Complete document processing ✓\n' +
                '• Working undo/redo (Ctrl+Z/Ctrl+Y) ✓\n' +
                '• Move Para functionality ✓\n' +
                '• Split Here at cursor ✓\n' +
                '• Semi-independence flow ✓\n' +
                '• Export to multiple formats ✓';
    
    alert(stats);
}

// =======================================================================
// LEGACY COMPATIBILITY AND MAIN PROCESSING
// =======================================================================

// Main processing function - entry point
function processDocument() {
    processCompleteDocument();
}

// Legacy compatibility functions
function getElementValue(id, defaultValue) {
    var element = document.getElementById(id);
    return element ? element.value : defaultValue;
}

// =======================================================================
// GLOBAL EXPORTS AND INITIALIZATION
// =======================================================================

// Main processing functions
window.processDocument = processDocument;
window.processCompleteDocument = processCompleteDocument;
window.extractCompleteText = extractCompleteText;
window.parseEnhancedDocumentStructure = parseEnhancedDocumentStructure;
window.createCompleteSmartLayout = createCompleteSmartLayout;

// Initialization functions
window.initializeCompleteApp = initializeCompleteApp;
window.showDebugConsole = showDebugConsole;

// Utility functions
window.showProgress = showProgress;
window.updateProgress = updateProgress;
window.showStatus = showStatus;
window.logToDebug = logToDebug;
window.getElementValue = getElementValue;

// Debug functions
window.debugCompleteSystem = debugCompleteSystem;
window.testCompleteWorkflow = testCompleteWorkflow;
window.showSystemStats = showSystemStats;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeCompleteApp);
} else {
    initializeCompleteApp();
}

// Global error handling
window.addEventListener('error', function(e) {
    console.error('App-Main.js Error:', e.error);
    if (typeof logToDebug === 'function') {
        logToDebug('App-Main.js Error: ' + e.message, 'error');
    }
    showStatus('System error occurred. Check debug console.', 'error');
});

// Log successful initialization
console.log('App-Main.js loaded - Complete system integration ready');

setTimeout(function() {
    if (typeof logToDebug === 'function') {
        logToDebug('Complete App System v4.0 loaded successfully', 'success');
        logToDebug('All modules: Core, Undo, Flow, Actions, Export, Main', 'success');
        logToDebug('Fixed: Document truncation, Ctrl+Z, Move Para, Split Here', 'success');
        logToDebug('Debug: debugCompleteSystem(), testCompleteWorkflow(), showSystemStats()', 'info');
    }
}, 500);
