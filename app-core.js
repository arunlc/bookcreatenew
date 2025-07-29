// =======================================================================
// APP-CORE.JS - Main Application Functions and Page Rendering
// Core rendering, text input handling, and page management
// =======================================================================

// Global variables for enhanced flow system
var reflowTimeout = null;
var currentlyEditingPage = null;
var heightThresholds = {
    optimal: 0.7,    // 70% of page height
    nearFull: 0.9,   // 90% of page height
    overflow: 1.0    // 100% of page height
};

// =======================================================================
// MAIN PAGE RENDERING SYSTEM
// =======================================================================

function renderFormattedPages(pages) {
    console.log('Rendering', pages.length, 'pages with complete document processing...');
    logToDebug('Rendering ' + pages.length + ' pages with enhanced flow system', 'info');
    
    var container = document.getElementById('pagesContainer');
    if (!container) {
        console.error('Pages container not found!');
        logToDebug('Error: pagesContainer element not found', 'error');
        return;
    }
    
    container.innerHTML = '';

    for (var i = 0; i < pages.length; i++) {
        var page = pages[i];
        var pageDiv = document.createElement('div');
        pageDiv.className = 'page size-' + (currentBookSize || 'standard');
        pageDiv.setAttribute('data-page-index', i);

        // Enhanced flow indicator
        var flowIndicator = document.createElement('div');
        flowIndicator.className = 'flow-indicator';
        flowIndicator.textContent = getPageStatusText(page);

        // Enhanced page header with better status display
        var headerDiv = document.createElement('div');
        headerDiv.className = 'page-header';
        
        var pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        
        var characterCountClass = getCharacterCountClass(page.characterCount);
        var heightStatus = getPageHeightStatus(page);
        var characterCountHtml = '<span class="character-counter ' + characterCountClass + '">' + page.characterCount + ' chars</span>';
        var heightIndicatorHtml = '<span class="height-indicator ' + heightStatus.class + '">' + heightStatus.text + '</span>';
        
        pageInfo.innerHTML = '<span>Page ' + page.number + '</span>' + characterCountHtml + heightIndicatorHtml;
        
        // Enhanced page actions with better tooltips
        var pageActions = document.createElement('div');
        pageActions.className = 'page-actions';
        pageActions.innerHTML = 
            '<button class="copy-button" onclick="copyFormattedPage(' + i + ', \'text\')" title="Copy page text only">📋 Text</button>' +
            '<button class="copy-button" onclick="copyFormattedPage(' + i + ', \'formatted\')" title="Copy with formatting for Canva">🎨 HTML</button>' +
            (pages.length > 1 ? '<button class="delete-button" onclick="deletePage(' + i + ')" title="Delete this page (merges content)">🗑️</button>' : '');
        
        headerDiv.appendChild(pageInfo);
        headerDiv.appendChild(pageActions);

        // Enhanced toolbar with clearer button labels
        var toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        toolbar.innerHTML = 
            '<button class="toolbar-button image-btn" onclick="insertImagePlaceholder(' + i + ', \'half\')" title="Add half-page image placeholder">📷 Half Image</button>' +
            '<button class="toolbar-button image-btn" onclick="insertImagePlaceholder(' + i + ', \'full\')" title="Add full-page image placeholder">🖼️ Full Image</button>' +
            '<button class="toolbar-button break-btn" onclick="forcePageBreakAtCursor(' + i + ')" title="Split page at cursor position">✂️ Split Here</button>' +
            '<button class="toolbar-button move-btn" onclick="moveLastParagraphToNext(' + i + ')" title="Move last paragraph to next page">⤵️ Move Para</button>' +
            '<button class="toolbar-button" onclick="createNewPageAfter(' + i + ')" title="Insert blank page after this one">📄 New Page</button>';

        // Page content with enhanced structure
        var contentDiv = document.createElement('div');
        contentDiv.className = 'page-content';

        // Render existing images first
        if (page.images && page.images.length > 0) {
            for (var j = 0; j < page.images.length; j++) {
                var img = page.images[j];
                var imgPlaceholder = createImageElement(img.type, img.id, i);
                contentDiv.appendChild(imgPlaceholder);
            }
        }

        // Enhanced editable text content with better event handling
        var editableDiv = document.createElement('div');
        editableDiv.className = 'editable-content';
        editableDiv.contentEditable = true;
        editableDiv.setAttribute('data-page-index', i);
        editableDiv.textContent = page.content || '';
        
        // Set up all event listeners
        setupEditableEvents(editableDiv, i);

        contentDiv.appendChild(editableDiv);
        
        pageDiv.appendChild(flowIndicator);
        pageDiv.appendChild(headerDiv);
        pageDiv.appendChild(toolbar);
        pageDiv.appendChild(contentDiv);
        container.appendChild(pageDiv);
    }
    
    // Update all page status indicators
    updateAllPageStatus();
    
    logToDebug('Rendered ' + pages.length + ' pages successfully', 'success');
}

function setupEditableEvents(editableDiv, pageIndex) {
    // Input event for real-time text changes
    editableDiv.addEventListener('input', function(e) {
        handleEnhancedTextInput(e);
    });

    // Focus tracking for current page highlighting
    editableDiv.addEventListener('focus', function(e) {
        setCurrentPage(pageIndex);
    });

    // Enhanced keyboard handling
    editableDiv.addEventListener('keydown', function(e) {
        handleKeyboardInput(e);
    });

    // Paste handling with undo support
    editableDiv.addEventListener('paste', function(e) {
        if (typeof saveToUndoStack === 'function') {
            saveToUndoStack('paste text');
        }
        setTimeout(function() {
            handleEnhancedTextInput(e);
        }, 10);
    });

    // Cut handling with undo support
    editableDiv.addEventListener('cut', function(e) {
        if (typeof saveToUndoStack === 'function') {
            saveToUndoStack('cut text');
        }
        setTimeout(function() {
            handleEnhancedTextInput(e);
        }, 10);
    });
}

function handleEnhancedTextInput(event) {
    if (isReflowing) return;
    
    var editableDiv = event.target;
    var pageIndex = parseInt(editableDiv.getAttribute('data-page-index'));
    
    if (isNaN(pageIndex) || pageIndex < 0 || pageIndex >= processedPages.length) {
        logToDebug('Invalid page index: ' + pageIndex, 'error');
        return;
    }
    
    // Update the page content in our data structure
    var newContent = editableDiv.textContent || editableDiv.innerText || '';
    var oldContent = processedPages[pageIndex].content;
    
    // Only process if content actually changed
    if (newContent === oldContent) return;
    
    processedPages[pageIndex].content = newContent;
    processedPages[pageIndex].characterCount = newContent.length;
    
    // Update visual indicators immediately
    updatePageStatus(pageIndex);
    updateCharacterCounter(pageIndex);
    
    // Mark as changed for auto-save
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    // Schedule flow check with debouncing
    scheduleEnhancedReflow(pageIndex);
    
    logToDebug('Page ' + (pageIndex + 1) + ' content updated: ' + newContent.length + ' chars', 'flow');
}

function handleKeyboardInput(e) {
    var pageIndex = parseInt(e.target.getAttribute('data-page-index'));
    
    if (e.key === 'Enter' && !e.shiftKey) {
        // Handle paragraph creation
        setTimeout(function() {
            handleEnhancedTextInput({ target: e.target });
        }, 10);
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
        // Handle deletion - may need to pull content from next page
        setTimeout(function() {
            checkForContentPull(pageIndex);
        }, 10);
    }
}

// =======================================================================
// PAGE STATUS AND MEASUREMENT FUNCTIONS
// =======================================================================

function measureActualPageHeight(pageIndex) {
    var editableDiv = document.querySelector('[data-page-index="' + pageIndex + '"] .editable-content');
    if (!editableDiv) return 0;
    
    return editableDiv.scrollHeight;
}

function measureTextHeightForContent(content) {
    if (!content || !content.trim()) return 20;
    
    // Create temporary element to measure height
    var tempDiv = document.createElement('div');
    tempDiv.style.cssText = 
        'position: absolute; top: -9999px; left: -9999px; ' +
        'width: ' + getTextAreaWidth() + 'px; ' +
        'font-family: ' + (pageSettings ? pageSettings.typography.fontFamily : 'Georgia') + '; ' +
        'font-size: ' + (pageSettings ? pageSettings.typography.fontSize : '12pt') + '; ' +
        'line-height: ' + (pageSettings ? pageSettings.typography.lineHeight : '1.4') + '; ' +
        'white-space: pre-wrap; ' +
        'word-wrap: break-word; ' +
        'padding: 10px 0;';
    
    tempDiv.textContent = content;
    document.body.appendChild(tempDiv);
    
    var height = tempDiv.scrollHeight;
    document.body.removeChild(tempDiv);
    
    return height;
}

function measureParagraphHeight(text) {
    if (!text || !text.trim()) return 25; // Minimum height for empty paragraph
    
    return measureTextHeightForContent(text) + 10; // Add some spacing
}

function getPageHeightStatus(page) {
    var content = page.content || '';
    var estimatedHeight = measureTextHeightForContent(content);
    var availableHeight = calculateAvailableTextHeight();
    
    // Adjust for images
    if (page.images && page.images.length > 0) {
        availableHeight -= page.images.length * 180;
    }
    
    var fillRatio = estimatedHeight / availableHeight;
    
    if (fillRatio <= heightThresholds.optimal) {
        return { class: 'optimal', text: Math.round(fillRatio * 100) + '%' };
    } else if (fillRatio <= heightThresholds.nearFull) {
        return { class: 'near-full', text: Math.round(fillRatio * 100) + '%' };
    } else if (fillRatio <= heightThresholds.overflow) {
        return { class: 'overflow', text: 'FULL' };
    } else {
        return { class: 'overflow', text: 'OVERFLOW' };
    }
}

function getPageStatusText(page) {
    var heightStatus = getPageHeightStatus(page);
    return heightStatus.text === 'OVERFLOW' ? 'Flowing...' : 'Ready';
}

function updatePageStatus(pageIndex) {
    if (pageIndex < 0 || pageIndex >= processedPages.length) return;
    
    var page = processedPages[pageIndex];
    var pageElement = document.querySelector('[data-page-index="' + pageIndex + '"]');
    if (!pageElement) return;
    
    // Update height indicator
    var heightStatus = getPageHeightStatus(page);
    var heightIndicator = pageElement.querySelector('.height-indicator');
    if (heightIndicator) {
        heightIndicator.className = 'height-indicator ' + heightStatus.class;
        heightIndicator.textContent = heightStatus.text;
    }
    
    // Update flow indicator
    var flowIndicator = pageElement.querySelector('.flow-indicator');
    if (flowIndicator) {
        flowIndicator.textContent = getPageStatusText(page);
    }
    
    // Update character counter
    updateCharacterCounter(pageIndex);
}

function updateAllPageStatus() {
    for (var i = 0; i < processedPages.length; i++) {
        updatePageStatus(i);
    }
}

function updatePageRange(startIndex, endIndex) {
    for (var i = startIndex; i <= endIndex && i < processedPages.length; i++) {
        var pageElement = document.querySelector('[data-page-index="' + i + '"]');
        if (pageElement) {
            var editableDiv = pageElement.querySelector('.editable-content');
            if (editableDiv) {
                editableDiv.textContent = processedPages[i].content || '';
            }
        }
        updatePageStatus(i);
    }
}

function setCurrentPage(pageIndex) {
    // Remove current page highlighting from all pages
    var allPages = document.querySelectorAll('.page');
    allPages.forEach(function(page) {
        page.classList.remove('current-page');
    });
    
    // Add highlighting to current page
    var currentPageElement = document.querySelector('[data-page-index="' + pageIndex + '"]');
    if (currentPageElement) {
        currentPageElement.classList.add('current-page');
    }
    
    currentlyEditingPage = pageIndex;
    logToDebug('Current page set to: ' + (pageIndex + 1), 'info');
}

function showFlowIndicator(pageIndex) {
    var pageElement = document.querySelector('[data-page-index="' + pageIndex + '"]');
    if (pageElement) {
        var indicator = pageElement.querySelector('.flow-indicator');
        if (indicator) {
            indicator.classList.add('active');
            indicator.textContent = 'Flowing...';
        }
    }
}

function hideFlowIndicator(pageIndex) {
    var pageElement = document.querySelector('[data-page-index="' + pageIndex + '"]');
    if (pageElement) {
        var indicator = pageElement.querySelector('.flow-indicator');
        if (indicator) {
            indicator.classList.remove('active');
            indicator.textContent = getPageStatusText(processedPages[pageIndex]);
        }
    }
}

// =======================================================================
// UTILITY FUNCTIONS
// =======================================================================

function updatePageContent(pageIndex, newContent) {
    if (pageIndex < 0 || pageIndex >= processedPages.length) return;
    
    processedPages[pageIndex].content = newContent;
    processedPages[pageIndex].characterCount = newContent.length;
    
    // Update DOM element
    var editableDiv = document.querySelector('[data-page-index="' + pageIndex + '"] .editable-content');
    if (editableDiv) {
        editableDiv.textContent = newContent;
    }
    
    // Update status
    updatePageStatus(pageIndex);
}

function createBlankPage(pageNumber) {
    return {
        number: pageNumber,
        content: '',
        characterCount: 0,
        images: [],
        hasIllustration: false,
        isBlank: true
    };
}

function createNewBlankPage() {
    var newPage = createBlankPage(processedPages.length + 1);
    processedPages.push(newPage);
    return newPage;
}

function renumberPages() {
    for (var i = 0; i < processedPages.length; i++) {
        processedPages[i].number = i + 1;
    }
}

function getTextAreaWidth() {
    if (typeof pageSettings !== 'undefined' && pageSettings.dimensions) {
        var dimensions = pageSettings.dimensions[pageSettings.bookSize];
        var pageWidth = parseFloat(dimensions.width) * 96; // Convert to pixels
        var marginInside = parseFloat(pageSettings.margins.inside) * 96;
        var marginOutside = parseFloat(pageSettings.margins.outside) * 96;
        return Math.max(200, pageWidth - marginInside - marginOutside - 40); // Minimum width
    } else {
        // Fallback calculation
        var dimensions = currentBookSize === 'illustration' ? 
            { width: 8, height: 8 } : { width: 5.5, height: 8.5 };
        return Math.max(200, (dimensions.width * 96) - (0.5 * 96 * 2) - 40);
    }
}

function updateCharacterCounter(pageIndex) {
    if (!processedPages[pageIndex]) return;
    
    var page = processedPages[pageIndex];
    var headerDiv = document.querySelector('[data-page-index="' + pageIndex + '"] .page-header .page-info');
    
    if (headerDiv) {
        var characterCountClass = getCharacterCountClass(page.characterCount);
        var heightStatus = getPageHeightStatus(page);
        var characterCountHtml = '<span class="character-counter ' + characterCountClass + '">' + page.characterCount + ' chars</span>';
        var heightIndicatorHtml = '<span class="height-indicator ' + heightStatus.class + '">' + heightStatus.text + '</span>';
        
        headerDiv.innerHTML = '<span>Page ' + page.number + '</span>' + characterCountHtml + heightIndicatorHtml;
    }
}

function getCharacterCountClass(count) {
    if (count < targetCharactersPerPage * 0.8) {
        return 'optimal';
    } else if (count < targetCharactersPerPage) {
        return 'warning';
    } else {
        return 'overflow';
    }
}

function calculateAvailableTextHeight() {
    if (typeof pageSettings !== 'undefined' && pageSettings.dimensions) {
        var bookSize = pageSettings.bookSize;
        var dimensions = pageSettings.dimensions[bookSize];
        
        // Convert dimensions to pixels (assuming 96 DPI)
        var pageHeight = parseFloat(dimensions.height) * 96;
        var marginTop = parseFloat(pageSettings.margins.top) * 96;
        var marginBottom = parseFloat(pageSettings.margins.bottom) * 96;
        
        // Subtract header and toolbar height
        var availableHeight = pageHeight - marginTop - marginBottom - 110;
        
        return Math.max(200, availableHeight); // Minimum height
    } else {
        // Fallback calculation
        var dimensions = currentBookSize === 'illustration' ? 
            { width: 8, height: 8 } : { width: 5.5, height: 8.5 };
        return Math.max(200, (dimensions.height * 96) - (0.75 * 96 * 2) - 110);
    }
}

function updatePageCountDisplay() {
    var pageCountDisplay = document.getElementById('pageCountDisplay');
    if (pageCountDisplay && processedPages) {
        pageCountDisplay.textContent = processedPages.length + ' pages';
    }
}

function getElementValue(id, defaultValue) {
    var element = document.getElementById(id);
    return element ? element.value : defaultValue;
}

// Legacy compatibility functions
function scheduleReflow() {
    if (currentlyEditingPage !== null) {
        scheduleEnhancedReflow(currentlyEditingPage);
    } else {
        scheduleEnhancedReflow(0);
    }
}

function performReflow() {
    if (currentlyEditingPage !== null) {
        performSemiIndependentFlow(currentlyEditingPage);
    }
}

// Global exports
window.renderFormattedPages = renderFormattedPages;
window.updatePageStatus = updatePageStatus;
window.updateAllPageStatus = updateAllPageStatus;
window.setCurrentPage = setCurrentPage;
window.updatePageContent = updatePageContent;
window.createBlankPage = createBlankPage;
window.renumberPages = renumberPages;
window.scheduleReflow = scheduleReflow;
window.performReflow = performReflow;

console.log('App-Core.js loaded - Main rendering and page management functions ready');
