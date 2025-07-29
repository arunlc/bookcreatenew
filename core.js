// =======================================================================
// CORE.JS - Revised Semi-Independence Flow System
// True page dimensions with smart paragraph-aware overflow
// =======================================================================

// Global variables
var documentText = '';
var documentHTML = '';
var documentStructure = [];
var processedPages = [];
var targetCharactersPerPage = 1800; // Still used for initial split, then margin-based
var isReflowing = false;
var currentBookSize = 'standard';
var reflowTimeout = null;
var currentCursorPage = null;
var editHistory = []; // For undo functionality
var maxHistorySteps = 50;

// Page dimensions and margins (CSS-based measurements)
var pageDimensions = {
    standard: { width: 5.5, height: 8.5 }, // inches
    illustration: { width: 8, height: 8 }
};

var pageMargins = {
    top: 0.75,    // inches
    bottom: 0.75,
    inside: 0.5,
    outside: 0.5
};

// Initialize when page loads
window.onload = function() {
    console.log('Book Layout Generator v3.0 - Semi-Independence Flow System loaded');
    
    setTimeout(function() {
        setupEventListeners();
        if (typeof initializeProjectManagement === 'function') {
            initializeProjectManagement();
        }
        if (typeof checkForRecoveryData === 'function') {
            checkForRecoveryData();
        }
        setupUndoSystem();
    }, 100);
};

// =======================================================================
// UNDO/REDO SYSTEM
// =======================================================================

function setupUndoSystem() {
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
            e.preventDefault();
            undoLastChange();
        }
        if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'Z')) {
            e.preventDefault();
            redoLastChange();
        }
    });
    
    logToDebug('Undo system initialized (Ctrl+Z / Ctrl+Y)', 'success');
}

function saveStateToHistory() {
    // Deep copy current state
    var currentState = {
        pages: JSON.parse(JSON.stringify(processedPages)),
        timestamp: Date.now()
    };
    
    editHistory.push(currentState);
    
    // Limit history size
    if (editHistory.length > maxHistorySteps) {
        editHistory.shift();
    }
    
    logToDebug('State saved to history (' + editHistory.length + ' steps)', 'info');
}

function undoLastChange() {
    if (editHistory.length === 0) {
        showStatus('Nothing to undo', 'warning');
        return;
    }
    
    var previousState = editHistory.pop();
    processedPages = previousState.pages;
    
    // Re-render with previous state
    renderFormattedPages(processedPages);
    
    showStatus('Undo successful', 'success');
    logToDebug('Undo applied - restored to ' + new Date(previousState.timestamp).toLocaleTimeString(), 'success');
}

function redoLastChange() {
    // For now, we'll implement a simple version
    // Full redo would require separate redo stack
    showStatus('Redo not implemented yet - use manual editing', 'info');
}

// =======================================================================
// EVENT LISTENERS SETUP
// =======================================================================

function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    var uploadSection = document.getElementById('uploadSection');
    var fileInput = document.getElementById('fileInput');

    if (!uploadSection || !fileInput) {
        console.error('Required elements not found!');
        return;
    }

    // File upload listeners
    uploadSection.addEventListener('dragover', function(e) {
        e.preventDefault();
        uploadSection.classList.add('dragover');
    });

    uploadSection.addEventListener('dragleave', function() {
        uploadSection.classList.remove('dragover');
    });

    uploadSection.addEventListener('drop', function(e) {
        e.preventDefault();
        uploadSection.classList.remove('dragover');
        var files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    // Settings change listeners
    setupSettingsListeners();
    console.log('Event listeners set up successfully');
}

function setupSettingsListeners() {
    var bookSizeEl = document.getElementById('bookSize');
    if (bookSizeEl) {
        bookSizeEl.addEventListener('change', function(e) {
            currentBookSize = e.target.value;
            updatePageDimensions();
            if (typeof markAsChanged === 'function') {
                markAsChanged();
            }
        });
    }

    // Other settings listeners
    ['bookType', 'illustrationFreq'].forEach(function(id) {
        var element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                if (typeof markAsChanged === 'function') {
                    markAsChanged();
                }
            });
        }
    });
}

// =======================================================================
// FILE HANDLING FUNCTIONS
// =======================================================================

function handleFile(file) {
    logToDebug('Starting file upload process...', 'info');
    
    if (!file.name.match(/\.(docx|doc)$/i)) {
        showStatus('Please select a Word document (.docx or .doc)', 'error');
        return;
    }

    var fileName = document.getElementById('fileName');
    if (fileName) {
        fileName.innerHTML = 'Selected: ' + file.name;
    }
    
    showProgress(true);
    updateProgress(20);

    var reader = new FileReader();
    
    reader.onerror = function() {
        showStatus('Error reading file. Please try again.', 'error');
        showProgress(false);
    };

    reader.onload = function(e) {
        updateProgress(50);
        
        try {
            if (typeof mammoth === 'undefined') {
                throw new Error('Document processing library not loaded. Please refresh.');
            }
            
            var options = {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh", 
                    "p[style-name='Heading 3'] => h3:fresh"
                ]
            };

            Promise.all([
                mammoth.convertToHtml({arrayBuffer: e.target.result}, options),
                mammoth.extractRawText({arrayBuffer: e.target.result})
            ]).then(function(results) {
                documentHTML = results[0].value;
                documentText = results[1].value;
                
                documentStructure = parseDocumentStructure(documentHTML);
                
                updateProgress(100);
                showStatus('Document loaded successfully!', 'success');
                setTimeout(function() { showProgress(false); }, 1000);
                
                showFormattingPreview(documentStructure);
                
                if (typeof markAsChanged === 'function') {
                    markAsChanged();
                }
            })
            .catch(function(err) {
                showStatus('Error processing document: ' + err.message, 'error');
                showProgress(false);
            });
            
        } catch (err) {
            showStatus('Unexpected error: ' + err.message, 'error');
            showProgress(false);
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function parseDocumentStructure(html) {
    try {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var elements = doc.body.children;
        var structure = [];
        
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var content = element.textContent.trim();
            
            if (content) {
                structure.push({
                    tag: element.tagName.toLowerCase(),
                    content: content,
                    html: element.outerHTML,
                    isHeading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element.tagName.toLowerCase()),
                    isEmpty: false
                });
            }
        }
        
        logToDebug('Document structure parsed: ' + structure.length + ' elements', 'success');
        return structure;
        
    } catch (err) {
        logToDebug('Error parsing document: ' + err.message, 'error');
        return [{
            tag: 'p',
            content: html.replace(/<[^>]*>/g, ''),
            html: html,
            isHeading: false,
            isEmpty: false
        }];
    }
}

function showFormattingPreview(structure) {
    var headings = structure.filter(function(item) { return item.isHeading; });
    var fileName = document.getElementById('fileName');
    
    if (fileName && headings.length > 0) {
        var previewDiv = document.createElement('div');
        previewDiv.style.cssText = 'background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;';
        
        var headingsList = headings.slice(0, 5).map(function(h) { 
            return '• ' + h.content; 
        }).join('<br>');
        
        var moreText = headings.length > 5 ? '<br>• ... and more' : '';
        
        previewDiv.innerHTML = '<strong>📋 Document Structure:</strong><br>' +
            '<small style="color: #666;">Found ' + headings.length + ' headings - Semi-independence flow ready!</small><br>' + 
            headingsList + moreText;
        
        fileName.appendChild(previewDiv);
    }
}

// =======================================================================
// DOCUMENT PROCESSING FUNCTIONS
// =======================================================================

function processDocument() {
    logToDebug('Starting document processing with semi-independence flow...', 'info');
    
    if (!documentHTML && !documentText) {
        showStatus('Please upload a document first', 'error');
        return;
    }

    // Save initial state
    saveStateToHistory();

    showProgress(true);
    updateProgress(10);

    var bookType = getElementValue('bookType', 'text');
    var bookSize = getElementValue('bookSize', 'standard');
    var illustrationFreq = getElementValue('illustrationFreq', 'none');

    currentBookSize = bookSize;
    updatePageDimensions();

    logToDebug('Processing with settings: ' + bookType + ', ' + bookSize, 'info');

    updateProgress(30);
    
    try {
        // Use smart paragraph-aware layout instead of character-based
        processedPages = createSmartParagraphLayout(documentStructure, bookType, illustrationFreq);
        
        updateProgress(70);
        
        if (typeof renderFormattedPages === 'function') {
            renderFormattedPages(processedPages);
        } else {
            throw new Error('Page rendering function not available');
        }
        
        updateProgress(100);
        
        var resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        updatePageCountDisplay();
        showStatus('Successfully generated ' + processedPages.length + ' pages with smart flow!', 'success');
        setTimeout(function() { showProgress(false); }, 1000);
        
        if (typeof markAsChanged === 'function') {
            markAsChanged();
        }
        
    } catch (err) {
        logToDebug('Error in processDocument: ' + err.message, 'error');
        showStatus('Error processing document: ' + err.message, 'error');
        showProgress(false);
    }
}

function createSmartParagraphLayout(structure, bookType, illustrationFreq) {
    var pages = [];
    var pageNumber = 1;
    var currentPageContent = [];
    var currentPageHeight = 0;
    
    // Calculate available height based on actual page dimensions
    var availableHeight = calculateAvailableTextHeight();
    
    logToDebug('Creating smart paragraph layout with ' + availableHeight + 'px available height', 'info');

    for (var i = 0; i < structure.length; i++) {
        var item = structure[i];
        
        // Measure actual height this paragraph would take
        var paragraphHeight = measureParagraphHeight(item.content);
        
        // Check if we need a new page
        if (currentPageHeight + paragraphHeight > availableHeight && currentPageContent.length > 0) {
            // Create page with current content
            pages.push(createSmartPage(pageNumber, currentPageContent, illustrationFreq));
            currentPageContent = [];
            currentPageHeight = 0;
            pageNumber++;
        }
        
        // Add paragraph to current page
        currentPageContent.push(item);
        currentPageHeight += paragraphHeight;
    }
    
    // Add final page if there's remaining content
    if (currentPageContent.length > 0) {
        pages.push(createSmartPage(pageNumber, currentPageContent, illustrationFreq));
    }

    logToDebug('Smart paragraph layout complete: ' + pages.length + ' pages created', 'success');
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

function shouldHaveIllustration(freq, pageNum) {
    switch (freq) {
        case 'every': return true;
        case 'alternate': return pageNum % 2 === 0;
        case 'chapter': return pageNum === 1;
        case 'none':
        default: return false;
    }
}

// =======================================================================
// PAGE DIMENSION CALCULATIONS
// =======================================================================

function updatePageDimensions() {
    var dimensions = pageDimensions[currentBookSize];
    var root = document.documentElement;
    
    // Update CSS variables for page dimensions
    root.style.setProperty('--current-width', dimensions.width + 'in');
    root.style.setProperty('--current-height', dimensions.height + 'in');
    root.style.setProperty('--margin-top', pageMargins.top + 'in');
    root.style.setProperty('--margin-bottom', pageMargins.bottom + 'in');
    root.style.setProperty('--margin-inside', pageMargins.inside + 'in');
    root.style.setProperty('--margin-outside', pageMargins.outside + 'in');
    
    logToDebug('Page dimensions updated: ' + dimensions.width + 'x' + dimensions.height + ' inches', 'info');
}

function calculateAvailableTextHeight() {
    var dimensions = pageDimensions[currentBookSize];
    var totalHeight = dimensions.height * 96; // Convert inches to pixels (96 DPI)
    var marginTop = pageMargins.top * 96;
    var marginBottom = pageMargins.bottom * 96;
    var headerHeight = 50; // Page header height in pixels
    var toolbarHeight = 50; // Toolbar height in pixels
    
    var availableHeight = totalHeight - marginTop - marginBottom - headerHeight - toolbarHeight;
    
    return Math.max(200, availableHeight); // Minimum 200px
}

function measureParagraphHeight(text) {
    // Create temporary element to measure actual text height
    var tempDiv = document.createElement('div');
    tempDiv.style.cssText = 
        'position: absolute; top: -9999px; left: -9999px; ' +
        'width: ' + getTextAreaWidth() + 'px; ' +
        'font-family: Georgia, serif; ' +
        'font-size: 12pt; ' +
        'line-height: 1.4; ' +
        'white-space: pre-wrap; ' +
        'word-wrap: break-word;';
    
    tempDiv.textContent = text;
    document.body.appendChild(tempDiv);
    
    var height = tempDiv.offsetHeight + 16; // Add some padding between paragraphs
    document.body.removeChild(tempDiv);
    
    return height;
}

function getTextAreaWidth() {
    var dimensions = pageDimensions[currentBookSize];
    var pageWidth = dimensions.width * 96; // Convert to pixels
    var marginInside = pageMargins.inside * 96;
    var marginOutside = pageMargins.outside * 96;
    
    return pageWidth - marginInside - marginOutside - 40; // Subtract some padding
}

// =======================================================================
// SEMI-INDEPENDENCE FLOW SYSTEM
// =======================================================================

function handleSemiIndependentFlow(pageIndex, newContent) {
    // This is the core of the semi-independence system
    if (isReflowing) return;
    
    logToDebug('Starting semi-independent flow from page ' + (pageIndex + 1), 'flow');
    
    // Save state before making changes
    saveStateToHistory();
    
    isReflowing = true;
    
    // Update current page
    processedPages[pageIndex].content = newContent;
    processedPages[pageIndex].characterCount = newContent.length;
    
    // Check if current page exceeds available height
    var availableHeight = calculateAvailableTextHeight();
    var currentHeight = measureParagraphHeight(newContent);
    
    // Reduce available height if page has images
    if (processedPages[pageIndex].images && processedPages[pageIndex].images.length > 0) {
        availableHeight -= 150 * processedPages[pageIndex].images.length; // Rough image height
    }
    
    if (currentHeight > availableHeight) {
        // Page overflows - need to move excess to next page
        var excess = findExcessContent(newContent, availableHeight);
        
        if (excess.overflow) {
            // Update current page with content that fits
            processedPages[pageIndex].content = excess.fitting;
            processedPages[pageIndex].characterCount = excess.fitting.length;
            
            // Flow overflow to next page
            flowContentToNextPage(pageIndex + 1, excess.overflow);
        }
    }
    
    // Re-render affected pages
    renderFormattedPages(processedPages);
    
    isReflowing = false;
    logToDebug('Semi-independent flow completed', 'flow');
}

function findExcessContent(content, availableHeight) {
    // Find the best break point that fits within available height
    var words = content.split(' ');
    var fitting = '';
    var currentHeight = 0;
    var lastGoodBreak = 0;
    
    for (var i = 0; i < words.length; i++) {
        var testContent = words.slice(0, i + 1).join(' ');
        var testHeight = measureParagraphHeight(testContent);
        
        if (testHeight > availableHeight) {
            // Find last sentence boundary before overflow
            var sentenceBreak = findLastSentenceBoundary(words, i);
            if (sentenceBreak > lastGoodBreak) {
                lastGoodBreak = sentenceBreak;
            } else {
                lastGoodBreak = Math.max(1, i - 1); // At least keep one word
            }
            break;
        }
        lastGoodBreak = i + 1;
    }
    
    return {
        fitting: words.slice(0, lastGoodBreak).join(' '),
        overflow: words.slice(lastGoodBreak).join(' ')
    };
}

function findLastSentenceBoundary(words, maxIndex) {
    // Look for sentence endings working backwards
    for (var i = Math.min(maxIndex - 1, words.length - 1); i >= 0; i--) {
        var word = words[i];
        if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?')) {
            return i + 1;
        }
    }
    return maxIndex; // No sentence boundary found
}

function flowContentToNextPage(pageIndex, overflowContent) {
    if (!overflowContent || !overflowContent.trim()) return;
    
    // Create new page if needed
    while (pageIndex >= processedPages.length) {
        var newPage = createSmartPage(processedPages.length + 1, [], 'none');
        processedPages.push(newPage);
    }
    
    // Add overflow to beginning of next page
    var nextPage = processedPages[pageIndex];
    var combinedContent = overflowContent + (nextPage.content ? ' ' + nextPage.content : '');
    
    // Check if next page now overflows
    var nextAvailableHeight = calculateAvailableTextHeight();
    if (nextPage.images && nextPage.images.length > 0) {
        nextAvailableHeight -= 150 * nextPage.images.length;
    }
    
    var combinedHeight = measureParagraphHeight(combinedContent);
    
    if (combinedHeight > nextAvailableHeight) {
        // Next page also overflows - cascade the flow
        var nextExcess = findExcessContent(combinedContent, nextAvailableHeight);
        nextPage.content = nextExcess.fitting;
        nextPage.characterCount = nextExcess.fitting.length;
        
        // Continue flowing to subsequent pages
        flowContentToNextPage(pageIndex + 1, nextExcess.overflow);
    } else {
        // Next page can accommodate all content
        nextPage.content = combinedContent;
        nextPage.characterCount = combinedContent.length;
    }
}

// =======================================================================
// UTILITY FUNCTIONS
// =======================================================================

function getElementValue(id, defaultValue) {
    var element = document.getElementById(id);
    return element ? element.value : defaultValue;
}

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

function updatePageCountDisplay() {
    var pageCountDisplay = document.getElementById('pageCountDisplay');
    if (pageCountDisplay && processedPages) {
        pageCountDisplay.textContent = processedPages.length + ' pages';
    }
}

function logToDebug(message, type) {
    console.log('[DEBUG] ' + message);
    
    var debugLog = document.getElementById('debugLog');
    if (debugLog) {
        var colors = { info: '#00ff00', warn: '#ffaa00', error: '#ff4444', success: '#00aa00', flow: '#00aaff' };
        var timestamp = new Date().toLocaleTimeString();
        var color = colors[type] || '#00ff00';
        debugLog.innerHTML += '<div style="color: ' + color + '; margin-bottom: 3px;">[' + timestamp + '] ' + message + '</div>';
        debugLog.scrollTop = debugLog.scrollHeight;
    }
}

// Debug console functions
function showDebugConsole() {
    var debugConsole = document.getElementById('debugConsole');
    if (!debugConsole) {
        addDebugConsole();
    }
    document.getElementById('debugConsole').style.display = 'block';
    logToDebug('Debug console opened - Semi-independence flow system active!', 'success');
}

function addDebugConsole() {
    var debugDiv = document.createElement('div');
    debugDiv.id = 'debugConsole';
    debugDiv.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 450px; max-height: 400px; background: #1a1a1a; color: #00ff00; font-family: monospace; font-size: 12px; padding: 15px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); overflow-y: auto; z-index: 1000; display: none; border: 2px solid #333;';
    
    debugDiv.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 8px;"><strong style="color: #ffffff; font-size: 14px;">🐛 Debug Console - Semi-Independence Flow v3.0</strong><button onclick="document.getElementById(\'debugConsole\').style.display=\'none\'" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">✕ Close</button></div><div id="debugLog" style="max-height: 320px; overflow-y: auto;"></div><div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #333; font-size: 10px; color: #888;">💡 Real-time semi-independent flow, undo system, and smart paragraph management</div>';
    
    document.body.appendChild(debugDiv);
}

// Global error handling
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    logToDebug('Global error: ' + e.message, 'error');
});

console.log('Core.js v3.0 loaded - Semi-Independence Flow System ready');
