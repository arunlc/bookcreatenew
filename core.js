// =======================================================================
// CORE.JS - Core Application Functions (FIXED VERSION)
// Character-based flow engine, document processing, page management
// =======================================================================

// Global variables
var documentText = '';
var documentHTML = '';
var documentStructure = [];
var processedPages = [];
var targetCharactersPerPage = 1800;
var isReflowing = false;
var currentBookSize = 'standard';
var reflowTimeout = null;
var currentCursorPage = null;

// Initialize when page loads
window.onload = function() {
    console.log('Book Layout Generator v2.0 loaded successfully');
    
    // Initialize in sequence to avoid timing issues
    setTimeout(function() {
        setupEventListeners();
        if (typeof initializeProjectManagement === 'function') {
            initializeProjectManagement();
        }
        if (typeof checkForRecoveryData === 'function') {
            checkForRecoveryData();
        }
    }, 100);
};

// Event listeners setup
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    var uploadSection = document.getElementById('uploadSection');
    var fileInput = document.getElementById('fileInput');

    // Check if elements exist before adding listeners
    if (!uploadSection) {
        console.error('Upload section not found!');
        return;
    }
    
    if (!fileInput) {
        console.error('File input not found!');
        return;
    }

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

    // Settings change listeners - with null checks
    var charactersPerPageEl = document.getElementById('charactersPerPage');
    if (charactersPerPageEl) {
        charactersPerPageEl.addEventListener('change', function(e) {
            targetCharactersPerPage = parseInt(e.target.value) || 1800;
            if (typeof markAsChanged === 'function') {
                markAsChanged();
            }
            if (processedPages.length > 0) {
                scheduleReflow();
            }
        });
    }

    var bookTypeEl = document.getElementById('bookType');
    if (bookTypeEl) {
        bookTypeEl.addEventListener('change', function() {
            if (typeof markAsChanged === 'function') {
                markAsChanged();
            }
        });
    }

    var bookSizeEl = document.getElementById('bookSize');
    if (bookSizeEl) {
        bookSizeEl.addEventListener('change', function(e) {
            currentBookSize = e.target.value;
            if (typeof markAsChanged === 'function') {
                markAsChanged();
            }
        });
    }

    var illustrationFreqEl = document.getElementById('illustrationFreq');
    if (illustrationFreqEl) {
        illustrationFreqEl.addEventListener('change', function() {
            if (typeof markAsChanged === 'function') {
                markAsChanged();
            }
            if (processedPages.length > 0) {
                scheduleReflow();
            }
        });
    }
    
    console.log('Event listeners set up successfully');
}

// =======================================================================
// DEBUG CONSOLE FUNCTIONS
// =======================================================================

function showDebugConsole() {
    var debugConsole = document.getElementById('debugConsole');
    if (!debugConsole) {
        addDebugConsole();
    }
    document.getElementById('debugConsole').style.display = 'block';
    logToDebug('Debug console opened - Character-based flow system active!', 'success');
}

function addDebugConsole() {
    var debugDiv = document.createElement('div');
    debugDiv.id = 'debugConsole';
    debugDiv.style.cssText = 'position: fixed; bottom: 20px; right: 20px; width: 450px; max-height: 400px; background: #1a1a1a; color: #00ff00; font-family: monospace; font-size: 12px; padding: 15px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); overflow-y: auto; z-index: 1000; display: none; border: 2px solid #333;';
    
    debugDiv.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #333; padding-bottom: 8px;"><strong style="color: #ffffff; font-size: 14px;">🐛 Debug Console - Character Flow v2.0</strong><button onclick="document.getElementById(\'debugConsole\').style.display=\'none\'" style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold;">✕ Close</button></div><div id="debugLog" style="max-height: 320px; overflow-y: auto;"></div><div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid #333; font-size: 10px; color: #888;">💡 Real-time character flow, auto-save, and project management</div>';
    
    document.body.appendChild(debugDiv);
}

function logToDebug(message, type) {
    console.log('[DEBUG] ' + message); // Also log to browser console
    
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
// FILE HANDLING FUNCTIONS
// =======================================================================

function handleFile(file) {
    logToDebug('Starting file upload process...', 'info');
    logToDebug('File: ' + file.name + ' (' + file.size + ' bytes)', 'info');

    if (!file.name.match(/\.(docx|doc)$/i)) {
        logToDebug('Invalid file type: ' + file.name, 'error');
        showStatus('Please select a Word document (.docx or .doc)', 'error');
        return;
    }

    var fileName = document.getElementById('fileName');
    if (fileName) {
        fileName.innerHTML = 'Selected: ' + file.name;
    }
    
    showProgress(true);
    updateProgress(20);
    logToDebug('File validation passed, starting FileReader...', 'success');

    var reader = new FileReader();
    
    reader.onerror = function(e) {
        logToDebug('FileReader error: ' + e, 'error');
        showStatus('Error reading file. Please try again.', 'error');
        showProgress(false);
    };

    reader.onload = function(e) {
        logToDebug('FileReader completed, file size: ' + e.target.result.byteLength + ' bytes', 'info');
        updateProgress(50);
        
        try {
            // Check if mammoth is available
            if (typeof mammoth === 'undefined') {
                throw new Error('Mammoth library not loaded. Please refresh the page.');
            }
            
            var options = {
                styleMap: [
                    "p[style-name='Heading 1'] => h1:fresh",
                    "p[style-name='Heading 2'] => h2:fresh",
                    "p[style-name='Heading 3'] => h3:fresh"
                ]
            };

            logToDebug('Starting Mammoth processing...', 'info');
            
            Promise.all([
                mammoth.convertToHtml({arrayBuffer: e.target.result}, options),
                mammoth.extractRawText({arrayBuffer: e.target.result})
            ]).then(function(results) {
                logToDebug('Mammoth processing successful', 'success');
                logToDebug('HTML result length: ' + results[0].value.length, 'info');
                logToDebug('Text result length: ' + results[1].value.length, 'info');

                documentHTML = results[0].value;
                documentText = results[1].value;
                
                logToDebug('Parsing document structure...', 'info');
                documentStructure = parseDocumentStructure(documentHTML);
                logToDebug('Document structure: ' + documentStructure.length + ' elements found', 'success');
                
                updateProgress(100);
                showStatus('Document loaded successfully with formatting!', 'success');
                setTimeout(function() { showProgress(false); }, 1000);
                
                showFormattingPreview(documentStructure);
                
                // Mark as changed since we loaded new content
                if (typeof markAsChanged === 'function') {
                    markAsChanged();
                }
            })
            .catch(function(err) {
                logToDebug('Mammoth processing error: ' + err.message, 'error');
                showStatus('Error processing document: ' + err.message, 'error');
                showProgress(false);
            });
            
        } catch (err) {
            logToDebug('Unexpected error in handleFile: ' + err.message, 'error');
            showStatus('Unexpected error: ' + err.message, 'error');
            showProgress(false);
        }
    };
    
    logToDebug('Starting FileReader.readAsArrayBuffer...', 'info');
    reader.readAsArrayBuffer(file);
}

function parseDocumentStructure(html) {
    logToDebug('Parsing document structure from HTML...', 'info');
    
    try {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var elements = doc.body.children;
        var structure = [];
        
        logToDebug('Found ' + elements.length + ' elements in document body', 'info');
        
        for (var i = 0; i < elements.length; i++) {
            var element = elements[i];
            var item = {
                tag: element.tagName.toLowerCase(),
                content: element.textContent.trim(),
                html: element.outerHTML,
                isHeading: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].indexOf(element.tagName.toLowerCase()) !== -1,
                isEmpty: element.textContent.trim() === ''
            };
            
            if (!item.isEmpty) {
                structure.push(item);
            }
        }
        
        logToDebug('Document structure parsed: ' + structure.length + ' non-empty elements', 'success');
        return structure;
        
    } catch (err) {
        logToDebug('Error parsing document structure: ' + err.message, 'error');
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
    logToDebug('Showing formatting preview...', 'info');
    
    try {
        var headings = structure.filter(function(item) { return item.isHeading; });
        logToDebug('Found headings: ' + headings.length, 'info');
        
        var fileName = document.getElementById('fileName');
        if (fileName && headings.length > 0) {
            var previewDiv = document.createElement('div');
            previewDiv.style.cssText = 'background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #28a745;';
            
            var headingsList = headings.slice(0, 5).map(function(h) { return '• ' + h.content; }).join('<br>');
            var moreText = headings.length > 5 ? '<br>• ... and more' : '';
            
            previewDiv.innerHTML = '<strong>📋 Detected Document Structure:</strong><br><small style="color: #666;">Found ' + headings.length + ' headings - Character-based flow system ready!</small><br>' + headingsList + moreText;
            fileName.appendChild(previewDiv);
            logToDebug('Formatting preview displayed', 'success');
        } else {
            logToDebug('No headings found for preview or fileName element missing', 'info');
        }
    } catch (err) {
        logToDebug('Error showing formatting preview: ' + err.message, 'error');
    }
}

// =======================================================================
// DOCUMENT PROCESSING FUNCTIONS
// =======================================================================

function processDocument() {
    logToDebug('Starting document processing with character-based flow...', 'info');
    
    if (!documentHTML && !documentText) {
        showStatus('Please upload a document first', 'error');
        return;
    }

    showProgress(true);
    updateProgress(10);

    // Get settings with safe defaults
    var bookType = getElementValue('bookType', 'text');
    var bookSize = getElementValue('bookSize', 'standard');
    var charactersPerPage = parseInt(getElementValue('charactersPerPage', '1800'));
    var illustrationFreq = getElementValue('illustrationFreq', 'none');

    targetCharactersPerPage = charactersPerPage;
    currentBookSize = bookSize;

    logToDebug('Processing with settings: ' + bookType + ', ' + bookSize + ', ' + charactersPerPage + ' chars/page', 'info');

    updateProgress(30);
    
    try {
        processedPages = createCharacterBasedLayout(documentStructure, bookType, charactersPerPage, illustrationFreq);
        
        updateProgress(70);
        
        // Ensure renderFormattedPages function exists
        if (typeof renderFormattedPages === 'function') {
            renderFormattedPages(processedPages);
        } else {
            logToDebug('renderFormattedPages function not found!', 'error');
            showStatus('Error: Page rendering function not available', 'error');
            showProgress(false);
            return;
        }
        
        updateProgress(100);
        
        var resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';
            resultsSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        // Update page count display
        updatePageCountDisplay();
        
        showStatus('Successfully generated ' + processedPages.length + ' pages with character-based flow!', 'success');
        setTimeout(function() { showProgress(false); }, 1000);
        
        // Mark as changed after processing
        if (typeof markAsChanged === 'function') {
            markAsChanged();
        }
        
    } catch (err) {
        logToDebug('Error in processDocument: ' + err.message, 'error');
        showStatus('Error processing document: ' + err.message, 'error');
        showProgress(false);
    }
}

function createCharacterBasedLayout(structure, bookType, charactersPerPage, illustrationFreq) {
    var pages = [];
    var pageNumber = 1;

    logToDebug('Creating character-based layout with ' + charactersPerPage + ' characters per page target', 'info');

    // Combine all content into a single text string
    var allContent = structure.map(function(item) {
        return item.content;
    }).join('\n\n');

    logToDebug('Total content: ' + allContent.length + ' characters', 'info');

    // Split content into pages based on character count
    var words = allContent.split(/\s+/);
    var currentText = '';

    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        var testText = currentText + (currentText ? ' ' : '') + word;
        
        if (testText.length > charactersPerPage && currentText.length > 0) {
            // Create page with current content
            var needsIllustration = shouldHaveIllustration(illustrationFreq, pageNumber);
            pages.push(createCharacterPage(pageNumber, currentText.trim(), needsIllustration));
            logToDebug('Created page ' + pageNumber + ' with ' + currentText.length + ' characters', 'success');
            
            currentText = word;
            pageNumber++;
        } else {
            currentText = testText;
        }
    }

    // Add final page if there's remaining content
    if (currentText.trim().length > 0) {
        var needsIllustration = shouldHaveIllustration(illustrationFreq, pageNumber);
        pages.push(createCharacterPage(pageNumber, currentText.trim(), needsIllustration));
        logToDebug('Created final page ' + pageNumber + ' with ' + currentText.length + ' characters', 'success');
    }

    logToDebug('Character-based layout complete: ' + pages.length + ' pages created', 'success');
    return pages;
}

function createCharacterPage(pageNum, content, hasIllustration) {
    var characterCount = content.length;
    var images = [];
    
    if (hasIllustration) {
        images.push({
            type: 'half',
            id: 'img_' + pageNum + '_1'
        });
    }
    
    return {
        number: pageNum,
        content: content,
        characterCount: characterCount,
        images: images,
        hasIllustration: hasIllustration
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
// CHARACTER FLOW FUNCTIONS
// =======================================================================

function scheduleReflow() {
    if (reflowTimeout) {
        clearTimeout(reflowTimeout);
    }
    reflowTimeout = setTimeout(function() {
        performReflow();
    }, 500); // 500ms delay
}

function performReflow() {
    if (isReflowing) return;
    isReflowing = true;
    
    logToDebug('Starting character-based reflow...', 'flow');
    
    // Show flow indicators
    var flowIndicators = document.querySelectorAll('.flow-indicator');
    flowIndicators.forEach(function(indicator) {
        indicator.classList.add('active');
    });

    // Collect all text content
    var allContent = '';
    for (var i = 0; i < processedPages.length; i++) {
        if (i > 0) allContent += ' ';
        allContent += processedPages[i].content;
    }

    logToDebug('Total content for reflow: ' + allContent.length + ' characters', 'flow');

    // Redistribute content across pages
    var words = allContent.split(/\s+/).filter(function(word) { return word.length > 0; });
    var newPages = [];
    var currentText = '';
    var pageNumber = 1;

    for (var i = 0; i < words.length; i++) {
        var word = words[i];
        var testText = currentText + (currentText ? ' ' : '') + word;
        var availableChars = getAvailableCharacters(pageNumber);
        
        if (testText.length > availableChars && currentText.length > 0) {
            // Create page with current content
            var hasIllustration = shouldHaveIllustration(
                getElementValue('illustrationFreq', 'none'), 
                pageNumber
            );
            newPages.push(createCharacterPage(pageNumber, currentText.trim(), hasIllustration));
            
            currentText = word;
            pageNumber++;
        } else {
            currentText = testText;
        }
    }

    // Add final page if there's remaining content
    if (currentText.trim().length > 0) {
        var hasIllustration = shouldHaveIllustration(
            getElementValue('illustrationFreq', 'none'), 
            pageNumber
        );
        newPages.push(createCharacterPage(pageNumber, currentText.trim(), hasIllustration));
    }

    // Update processed pages
    processedPages = newPages;
    
    logToDebug('Reflow complete: ' + newPages.length + ' pages', 'flow');
    
    // Re-render pages
    if (typeof renderFormattedPages === 'function') {
        renderFormattedPages(processedPages);
    }
    
    // Update page count
    updatePageCountDisplay();
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    // Hide flow indicators
    setTimeout(function() {
        var flowIndicators = document.querySelectorAll('.flow-indicator');
        flowIndicators.forEach(function(indicator) {
            indicator.classList.remove('active');
        });
        isReflowing = false;
    }, 1000);
}

function getAvailableCharacters(pageNumber) {
    var baseChars = targetCharactersPerPage;
    var illustrationFreq = getElementValue('illustrationFreq', 'none');
    var hasIllustration = shouldHaveIllustration(illustrationFreq, pageNumber);
    
    // Reduce available characters based on image placeholders
    if (hasIllustration) {
        baseChars -= 200; // Reserve space for half-page image
    }
    
    return baseChars;
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
        if (!show) {
            updateProgress(0);
        }
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

function getCharacterCountClass(charCount) {
    var min = targetCharactersPerPage - 200;  // 1600 for target 1800
    var max = targetCharactersPerPage + 200;  // 2000 for target 1800
    var overflow = targetCharactersPerPage + 400; // 2200 for target 1800
    
    if (charCount >= min && charCount <= max) {
        return 'optimal';
    } else if (charCount <= overflow) {
        return 'warning';
    } else {
        return 'overflow';
    }
}

// Add error handling for the entire script
window.addEventListener('error', function(e) {
    console.error('Global error caught:', e.error);
    logToDebug('Global error: ' + e.message + ' at ' + e.filename + ':' + e.lineno, 'error');
});

// Check if all required elements exist on page load
window.addEventListener('DOMContentLoaded', function() {
    var requiredElements = ['uploadSection', 'fileInput', 'bookType', 'bookSize', 'illustrationFreq'];
    var missingElements = [];
    
    requiredElements.forEach(function(id) {
        if (!document.getElementById(id)) {
            missingElements.push(id);
        }
    });
    
    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        logToDebug('Missing elements: ' + missingElements.join(', '), 'error');
    } else {
        console.log('All required elements found');
    }
});
