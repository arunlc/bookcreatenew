// =======================================================================
// APP.JS - Complete Semi-Independence Flow System (Enhanced Version)
// Page rendering, editing, image management, and export functions
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
// PAGE RENDERING FUNCTIONS WITH ENHANCED FLOW
// =======================================================================

function renderFormattedPages(pages) {
    console.log('Rendering', pages.length, 'pages with semi-independence flow...');
    logToDebug('Starting to render ' + pages.length + ' pages with enhanced flow system', 'info');
    
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

        // Enhanced flow indicator with status
        var flowIndicator = document.createElement('div');
        flowIndicator.className = 'flow-indicator';
        flowIndicator.textContent = getPageStatusText(page);

        // Enhanced page header with height status
        var headerDiv = document.createElement('div');
        headerDiv.className = 'page-header';
        
        var pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        
        var characterCountClass = getCharacterCountClass(page.characterCount);
        var heightStatus = getPageHeightStatus(page);
        var characterCountHtml = '<span class="character-counter ' + characterCountClass + '">' + page.characterCount + ' chars</span>';
        var heightIndicatorHtml = '<span class="height-indicator ' + heightStatus.class + '">' + heightStatus.text + '</span>';
        
        pageInfo.innerHTML = '<span>Page ' + page.number + '</span>' + characterCountHtml + heightIndicatorHtml;
        
        // Enhanced page actions
        var pageActions = document.createElement('div');
        pageActions.className = 'page-actions';
        pageActions.innerHTML = 
            '<button class="copy-button" onclick="copyFormattedPage(' + i + ', \'text\')" title="Copy page text">📋 Text</button>' +
            '<button class="copy-button" onclick="copyFormattedPage(' + i + ', \'formatted\')" title="Copy formatted for Canva">🎨 HTML</button>' +
            (pages.length > 1 ? '<button class="delete-button" onclick="deletePage(' + i + ')" title="Delete this page">🗑️</button>' : '');
        
        headerDiv.appendChild(pageInfo);
        headerDiv.appendChild(pageActions);

        // Enhanced toolbar with new functions
        var toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        toolbar.innerHTML = 
            '<button class="toolbar-button image-btn" onclick="insertImagePlaceholder(' + i + ', \'half\')" title="Add half-page image">📷 Half Image</button>' +
            '<button class="toolbar-button image-btn" onclick="insertImagePlaceholder(' + i + ', \'full\')" title="Add full-page image">🖼️ Full Image</button>' +
            '<button class="toolbar-button break-btn" onclick="forcePageBreak(' + i + ')" title="Split page at cursor">✂️ Split Here</button>' +
            '<button class="toolbar-button" onclick="moveParagraphToNext(' + i + ')" title="Move last paragraph to next page">⤵️ Move Para</button>' +
            '<button class="toolbar-button" onclick="createNewPageAfter(' + i + ')" title="Insert new page">📄 New Page</button>';

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

        // Enhanced editable text content
        var editableDiv = document.createElement('div');
        editableDiv.className = 'editable-content';
        editableDiv.contentEditable = true;
        editableDiv.setAttribute('data-page-index', i);
        editableDiv.textContent = page.content || '';
        
        // Enhanced input event listener for real-time flow
        editableDiv.addEventListener('input', function(e) {
            handleEnhancedTextInput(e);
        });

        // Focus tracking for current page highlighting
        editableDiv.addEventListener('focus', function(e) {
            var pageIndex = parseInt(e.target.getAttribute('data-page-index'));
            setCurrentPage(pageIndex);
        });

        // Enhanced keyboard handling
        editableDiv.addEventListener('keydown', function(e) {
            handleKeyboardInput(e);
        });

        // Paste handling
        editableDiv.addEventListener('paste', function(e) {
            setTimeout(function() {
                handleEnhancedTextInput(e);
            }, 10);
        });

        contentDiv.appendChild(editableDiv);
        
        pageDiv.appendChild(flowIndicator);
        pageDiv.appendChild(headerDiv);
        pageDiv.appendChild(toolbar);
        pageDiv.appendChild(contentDiv);
        container.appendChild(pageDiv);
    }
    
    // Update page status indicators
    updateAllPageStatus();
    
    logToDebug('Rendered ' + pages.length + ' pages with enhanced flow system', 'success');
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
    processedPages[pageIndex].content = newContent;
    processedPages[pageIndex].characterCount = newContent.length;
    
    // Check page height and trigger flow if needed
    var pageHeight = measureActualPageHeight(pageIndex);
    var availableHeight = calculateAvailableTextHeight();
    
    logToDebug('Page ' + (pageIndex + 1) + ' edited: ' + newContent.length + ' chars, height: ' + pageHeight + 'px', 'flow');
    
    // Update visual indicators immediately
    updatePageStatus(pageIndex);
    updateCharacterCounter(pageIndex);
    
    // Mark as changed for auto-save
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    // Schedule semi-independent flow check
    scheduleEnhancedReflow(pageIndex);
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
// SEMI-INDEPENDENCE FLOW SYSTEM
// =======================================================================

function scheduleEnhancedReflow(triggerPageIndex) {
    if (reflowTimeout) {
        clearTimeout(reflowTimeout);
    }
    
    // Show flow indicator
    showFlowIndicator(triggerPageIndex);
    
    // Debounced reflow - 300ms delay for responsiveness
    reflowTimeout = setTimeout(function() {
        performSemiIndependentFlow(triggerPageIndex);
        hideFlowIndicator(triggerPageIndex);
    }, 300);
}

function performSemiIndependentFlow(startPageIndex) {
    if (isReflowing) return;
    
    logToDebug('Starting semi-independent flow from page ' + (startPageIndex + 1), 'flow');
    isReflowing = true;
    
    try {
        // Check if current page overflows
        var pageHeight = measureActualPageHeight(startPageIndex);
        var availableHeight = calculateAvailableTextHeight();
        
        // Adjust available height for images
        if (processedPages[startPageIndex].images && processedPages[startPageIndex].images.length > 0) {
            var imageHeight = processedPages[startPageIndex].images.length * 150; // Approximate image height
            availableHeight -= imageHeight;
        }
        
        if (pageHeight > availableHeight) {
            // Page overflows - find overflow content
            var overflowData = findSmartOverflow(startPageIndex, availableHeight);
            
            if (overflowData.hasOverflow) {
                // Update current page with fitting content
                updatePageContent(startPageIndex, overflowData.fittingContent);
                
                // Flow overflow to next page(s)
                flowOverflowForward(startPageIndex + 1, overflowData.overflowContent);
                
                logToDebug('Overflow detected - flowing to next page', 'flow');
            }
        }
        
        // Update all affected page displays
        updatePageRange(startPageIndex, Math.min(startPageIndex + 3, processedPages.length - 1));
        
    } catch (err) {
        logToDebug('Error in semi-independent flow: ' + err.message, 'error');
    } finally {
        isReflowing = false;
    }
}

function findSmartOverflow(pageIndex, availableHeight) {
    var content = processedPages[pageIndex].content;
    var paragraphs = content.split('\n').filter(function(p) { return p.trim(); });
    
    var fittingParagraphs = [];
    var currentHeight = 0;
    var overflowIndex = -1;
    
    for (var i = 0; i < paragraphs.length; i++) {
        var paragraphHeight = measureParagraphHeight(paragraphs[i]);
        
        if (currentHeight + paragraphHeight > availableHeight && fittingParagraphs.length > 0) {
            overflowIndex = i;
            break;
        }
        
        fittingParagraphs.push(paragraphs[i]);
        currentHeight += paragraphHeight;
    }
    
    return {
        hasOverflow: overflowIndex >= 0,
        fittingContent: fittingParagraphs.join('\n'),
        overflowContent: overflowIndex >= 0 ? paragraphs.slice(overflowIndex).join('\n') : ''
    };
}

function flowOverflowForward(pageIndex, overflowContent) {
    if (!overflowContent || !overflowContent.trim()) return;
    
    // Create new page if needed
    while (pageIndex >= processedPages.length) {
        createNewBlankPage();
    }
    
    // Get next page
    var nextPage = processedPages[pageIndex];
    
    // Combine overflow with existing content
    var combinedContent = overflowContent;
    if (nextPage.content && nextPage.content.trim()) {
        combinedContent += '\n' + nextPage.content;
    }
    
    // Check if next page also overflows
    var nextAvailableHeight = calculateAvailableTextHeight();
    if (nextPage.images && nextPage.images.length > 0) {
        nextAvailableHeight -= nextPage.images.length * 150;
    }
    
    var combinedHeight = measureTextHeightForContent(combinedContent);
    
    if (combinedHeight > nextAvailableHeight) {
        // Cascade overflow
        var nextOverflow = findSmartOverflow(pageIndex, nextAvailableHeight);
        if (nextOverflow.hasOverflow) {
            updatePageContent(pageIndex, nextOverflow.fittingContent);
            flowOverflowForward(pageIndex + 1, nextOverflow.overflowContent);
        } else {
            updatePageContent(pageIndex, combinedContent);
        }
    } else {
        // All content fits
        updatePageContent(pageIndex, combinedContent);
    }
}

function checkForContentPull(pageIndex) {
    // Check if page has room to pull content from next page
    var currentHeight = measureActualPageHeight(pageIndex);
    var availableHeight = calculateAvailableTextHeight();
    
    if (processedPages[pageIndex].images) {
        availableHeight -= processedPages[pageIndex].images.length * 150;
    }
    
    var remainingSpace = availableHeight - currentHeight;
    
    // If there's significant space and next page exists
    if (remainingSpace > 100 && pageIndex + 1 < processedPages.length) {
        var nextPage = processedPages[pageIndex + 1];
        if (nextPage.content && nextPage.content.trim()) {
            pullContentFromNextPage(pageIndex, remainingSpace);
        }
    }
}

function pullContentFromNextPage(pageIndex, availableSpace) {
    var nextPageIndex = pageIndex + 1;
    if (nextPageIndex >= processedPages.length) return;
    
    var nextPage = processedPages[nextPageIndex];
    var nextContent = nextPage.content;
    
    // Find how much content can fit in available space
    var paragraphs = nextContent.split('\n').filter(function(p) { return p.trim(); });
    var pullableParagraphs = [];
    var usedSpace = 0;
    
    for (var i = 0; i < paragraphs.length; i++) {
        var paragraphHeight = measureParagraphHeight(paragraphs[i]);
        if (usedSpace + paragraphHeight <= availableSpace) {
            pullableParagraphs.push(paragraphs[i]);
            usedSpace += paragraphHeight;
        } else {
            break;
        }
    }
    
    if (pullableParagraphs.length > 0) {
        // Pull content to current page
        var currentContent = processedPages[pageIndex].content;
        var pulledContent = pullableParagraphs.join('\n');
        updatePageContent(pageIndex, currentContent + (currentContent ? '\n' : '') + pulledContent);
        
        // Remove pulled content from next page
        var remainingContent = paragraphs.slice(pullableParagraphs.length).join('\n');
        updatePageContent(nextPageIndex, remainingContent);
        
        logToDebug('Pulled ' + pullableParagraphs.length + ' paragraphs from next page', 'flow');
    }
}

// =======================================================================
// ENHANCED PAGE MANAGEMENT FUNCTIONS
// =======================================================================

function forcePageBreak(pageIndex) {
    logToDebug('Forcing page break at page ' + (pageIndex + 1), 'info');
    
    if (!processedPages[pageIndex]) {
        logToDebug('Invalid page index for page break: ' + pageIndex, 'error');
        return;
    }
    
    // Save state for undo
    if (typeof saveStateToHistory === 'function') {
        saveStateToHistory();
    }
    
    var editableDiv = document.querySelector('[data-page-index="' + pageIndex + '"] .editable-content');
    if (!editableDiv) {
        showStatus('Could not find editable content for page break', 'error');
        return;
    }
    
    var selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        var range = selection.getRangeAt(0);
        var cursorPos = range.startOffset;
        var textContent = editableDiv.textContent || '';
        
        // Split content at cursor position
        var beforeCursor = textContent.substring(0, cursorPos);
        var afterCursor = textContent.substring(cursorPos);
        
        // Update current page with content before cursor
        updatePageContent(pageIndex, beforeCursor);
        
        // Create new page with content after cursor if there's content
        if (afterCursor.trim()) {
            // Create new page
            var newPage = createBlankPage(processedPages.length + 1);
            processedPages.splice(pageIndex + 1, 0, newPage);
            
            // Add content to new page
            updatePageContent(pageIndex + 1, afterCursor.trim());
            
            // Renumber pages
            renumberPages();
            
            // Re-render
            renderFormattedPages(processedPages);
            
            showStatus('Page break inserted successfully!', 'success');
        } else {
            // Just update the current page
            updatePageStatus(pageIndex);
            showStatus('Page content updated', 'success');
        }
        
        // Mark as changed
        if (typeof markAsChanged === 'function') {
            markAsChanged();
        }
        
    } else {
        showStatus('Place cursor where you want to break the page', 'error');
    }
}

function moveParagraphToNext(pageIndex) {
    logToDebug('Moving last paragraph to next page from ' + (pageIndex + 1), 'info');
    
    var page = processedPages[pageIndex];
    if (!page || !page.content) {
        showStatus('No content to move', 'error');
        return;
    }
    
    // Save state for undo
    if (typeof saveStateToHistory === 'function') {
        saveStateToHistory();
    }
    
    var paragraphs = page.content.split('\n').filter(function(p) { return p.trim(); });
    
    if (paragraphs.length <= 1) {
        showStatus('Need at least 2 paragraphs to move one', 'error');
        return;
    }
    
    // Remove last paragraph
    var lastParagraph = paragraphs.pop();
    var remainingContent = paragraphs.join('\n');
    
    // Update current page
    updatePageContent(pageIndex, remainingContent);
    
    // Create next page if needed
    if (pageIndex + 1 >= processedPages.length) {
        createNewBlankPage();
    }
    
    // Add paragraph to next page
    var nextPage = processedPages[pageIndex + 1];
    var nextContent = lastParagraph + (nextPage.content ? '\n' + nextPage.content : '');
    updatePageContent(pageIndex + 1, nextContent);
    
    // Re-render affected pages
    updatePageRange(pageIndex, pageIndex + 1);
    
    showStatus('Paragraph moved to next page!', 'success');
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
}

function createNewPageAfter(pageIndex) {
    logToDebug('Creating new page after index: ' + pageIndex, 'info');
    
    // Save state for undo
    if (typeof saveStateToHistory === 'function') {
        saveStateToHistory();
    }
    
    var newPage = createBlankPage(processedPages.length + 1);
    
    // Insert new page after specified index
    processedPages.splice(pageIndex + 1, 0, newPage);
    
    // Renumber pages
    renumberPages();
    
    // Re-render pages to show the new page
    renderFormattedPages(processedPages);
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('New page created successfully!', 'success');
    logToDebug('New page created after index ' + pageIndex, 'success');
}

function deletePage(pageIndex) {
    if (processedPages.length <= 1) {
        showStatus('Cannot delete the only page!', 'error');
        return;
    }
    
    if (!confirm('Are you sure you want to delete this page? The content will be merged with adjacent pages.')) {
        return;
    }
    
    logToDebug('Deleting page ' + (pageIndex + 1), 'info');
    
    // Save state for undo
    if (typeof saveStateToHistory === 'function') {
        saveStateToHistory();
    }
    
    if (!processedPages[pageIndex]) {
        logToDebug('Invalid page index for deletion: ' + pageIndex, 'error');
        return;
    }
    
    // Merge content with adjacent page
    var deletedContent = processedPages[pageIndex].content || '';
    
    if (deletedContent.trim()) {
        if (pageIndex < processedPages.length - 1) {
            // Merge with next page
            var nextContent = (processedPages[pageIndex + 1].content || '');
            var mergedContent = deletedContent + (nextContent ? '\n' + nextContent : '');
            updatePageContent(pageIndex + 1, mergedContent);
        } else if (pageIndex > 0) {
            // Merge with previous page
            var prevContent = (processedPages[pageIndex - 1].content || '');
            var mergedContent = prevContent + (prevContent ? '\n' : '') + deletedContent;
            updatePageContent(pageIndex - 1, mergedContent);
        }
    }
    
    // Remove the page
    processedPages.splice(pageIndex, 1);
    
    // Renumber pages
    renumberPages();
    
    // Re-render pages
    renderFormattedPages(processedPages);
    
    // Trigger reflow to redistribute content properly
    if (pageIndex > 0) {
        scheduleEnhancedReflow(pageIndex - 1);
    } else if (processedPages.length > 0) {
        scheduleEnhancedReflow(0);
    }
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('Page deleted and content merged successfully!', 'success');
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
    // Create temporary element to measure height
    var tempDiv = document.createElement('div');
    tempDiv.style.cssText = 
        'position: absolute; top: -9999px; left: -9999px; ' +
        'width: ' + getTextAreaWidth() + '; ' +
        'font-family: ' + (pageSettings ? pageSettings.typography.fontFamily : 'Georgia') + '; ' +
        'font-size: ' + (pageSettings ? pageSettings.typography.fontSize : '12pt') + '; ' +
        'line-height: ' + (pageSettings ? pageSettings.typography.lineHeight : '1.4') + '; ' +
        'white-space: pre-wrap; ' +
        'word-wrap: break-word;';
    
    tempDiv.textContent = content;
    document.body.appendChild(tempDiv);
    
    var height = tempDiv.scrollHeight;
    document.body.removeChild(tempDiv);
    
    return height;
}

function getPageHeightStatus(page) {
    var content = page.content || '';
    var estimatedHeight = measureTextHeightForContent(content);
    var availableHeight = calculateAvailableTextHeight();
    
    // Adjust for images
    if (page.images && page.images.length > 0) {
        availableHeight -= page.images.length * 150;
    }
    
    var fillRatio = estimatedHeight / availableHeight;
    
    if (fillRatio <= heightThresholds.optimal) {
        return { class: 'optimal', text: Math.round(fillRatio * 100) + '%' };
    } else if (fillRatio <= heightThresholds.nearFull) {
        return { class: 'near-full', text: Math.round(fillRatio * 100) + '%' };
    } else if (fillRatio <= heightThresholds.overflow) {
        return { class: 'overflow', text: 'OVERFLOW' };
    } else {
        return { class: 'overflow', text: 'OVERFLOW+' };
    }
}

function getPageStatusText(page) {
    var heightStatus = getPageHeightStatus(page);
    return heightStatus.text === 'OVERFLOW' || heightStatus.text === 'OVERFLOW+' ? 'Flowing...' : 'Ready';
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
// UTILITY FUNCTIONS FOR ENHANCED SYSTEM
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
        return pageWidth - marginInside - marginOutside - 40; // Subtract padding
    } else {
        // Fallback calculation
        var dimensions = currentBookSize === 'illustration' ? 
            { width: 8, height: 8 } : { width: 5.5, height: 8.5 };
        return (dimensions.width * 96) - (0.5 * 96 * 2) - 40;
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

function measureParagraphHeight(text) {
    if (!text || !text.trim()) return 20; // Minimum height for empty paragraph
    
    // Create temporary element to measure actual text height
    var tempDiv = document.createElement('div');
    tempDiv.style.cssText = 
        'position: absolute; top: -9999px; left: -9999px; ' +
        'width: ' + getTextAreaWidth() + 'px; ' +
        'font-family: ' + (pageSettings ? pageSettings.typography.fontFamily : 'Georgia') + '; ' +
        'font-size: ' + (pageSettings ? pageSettings.typography.fontSize : '12pt') + '; ' +
        'line-height: ' + (pageSettings ? pageSettings.typography.lineHeight : '1.4') + '; ' +
        'white-space: pre-wrap; ' +
        'word-wrap: break-word; ' +
        'padding: 8px 0;'; // Add some paragraph spacing
    
    tempDiv.textContent = text;
    document.body.appendChild(tempDiv);
    
    var height = tempDiv.offsetHeight;
    document.body.removeChild(tempDiv);
    
    return height;
}

// =======================================================================
// IMAGE PLACEHOLDER FUNCTIONS (ENHANCED)
// =======================================================================

function createImageElement(type, id, pageIndex) {
    var imgDiv = document.createElement('div');
    imgDiv.className = 'image-placeholder ' + type + '-page';
    imgDiv.setAttribute('data-image-id', id);
    imgDiv.setAttribute('data-page-index', pageIndex);
    
    var placeholderText = document.createElement('div');
    placeholderText.className = 'placeholder-text';
    placeholderText.textContent = type === 'half' ? '🖼️ HALF PAGE IMAGE' : '🖼️ FULL PAGE IMAGE';
    
    var placeholderDetails = document.createElement('div');
    placeholderDetails.className = 'placeholder-details';
    
    // Enhanced details with dimensions
    var dimensions = type === 'half' ? 
        'Height: ~150px | Text space reduced by ~200 chars' : 
        'Height: ~300px | Text space reduced by ~400 chars';
    placeholderDetails.textContent = dimensions;
    
    var removeBtn = document.createElement('button');
    removeBtn.className = 'remove-image';
    removeBtn.innerHTML = '×';
    removeBtn.onclick = function() {
        removeImagePlaceholder(id, pageIndex);
    };
    
    imgDiv.appendChild(removeBtn);
    imgDiv.appendChild(placeholderText);
    imgDiv.appendChild(placeholderDetails);
    
    return imgDiv;
}

function insertImagePlaceholder(pageIndex, type) {
    logToDebug('Inserting ' + type + ' image placeholder on page ' + (pageIndex + 1), 'info');
    
    if (!processedPages[pageIndex]) {
        logToDebug('Invalid page index for image insertion: ' + pageIndex, 'error');
        return;
    }
    
    // Save state for undo
    if (typeof saveStateToHistory === 'function') {
        saveStateToHistory();
    }
    
    var page = processedPages[pageIndex];
    if (!page.images) {
        page.images = [];
    }
    
    var newImageId = 'img_' + page.number + '_' + (page.images.length + 1);
    
    page.images.push({
        type: type,
        id: newImageId
    });
    
    // Re-render the specific page
    var pageDiv = document.querySelector('[data-page-index="' + pageIndex + '"]');
    if (pageDiv) {
        var contentDiv = pageDiv.querySelector('.page-content');
        var editableDiv = contentDiv.querySelector('.editable-content');
        var imgElement = createImageElement(type, newImageId, pageIndex);
        contentDiv.insertBefore(imgElement, editableDiv);
    }
    
    // Update page status immediately
    updatePageStatus(pageIndex);
    
    // Check if content needs to flow due to reduced space
    var reservedHeight = type === 'half' ? 150 : 300;
    scheduleEnhancedReflow(pageIndex);
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('Image placeholder added successfully! Text space adjusted.', 'success');
}

function removeImagePlaceholder(imageId, pageIndex) {
    logToDebug('Removing image placeholder ' + imageId + ' from page ' + (pageIndex + 1), 'info');
    
    if (!processedPages[pageIndex]) {
        logToDebug('Invalid page index for image removal: ' + pageIndex, 'error');
        return;
    }
    
    // Save state for undo
    if (typeof saveStateToHistory === 'function') {
        saveStateToHistory();
    }
    
    var page = processedPages[pageIndex];
    if (page.images) {
        page.images = page.images.filter(function(img) {
            return img.id !== imageId;
        });
    }
    
    // Remove from DOM
    var imgElement = document.querySelector('[data-image-id="' + imageId + '"]');
    if (imgElement) {
        imgElement.remove();
    }
    
    // Update page status and potentially pull content from next page
    updatePageStatus(pageIndex);
    checkForContentPull(pageIndex);
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('Image placeholder removed! Additional text space available.', 'success');
}

// =======================================================================
// COPY AND EXPORT FUNCTIONS (ENHANCED)
// =======================================================================

function copyFormattedPage(index, format) {
    if (!processedPages[index]) {
        showStatus('Invalid page index for copying', 'error');
        return;
    }
    
    var page = processedPages[index];
    var textToCopy = '';
    
    if (format === 'formatted') {
        textToCopy = convertToCanvaFormat(page);
    } else {
        textToCopy = page.content || '';
        
        // Add image placeholders to text with enhanced details
        if (page.images && page.images.length > 0) {
            var imagePlaceholders = page.images.map(function(img) {
                return '[' + img.type.toUpperCase() + ' IMAGE PLACEHOLDER - ' + img.id + ']';
            }).join('\n');
            textToCopy = imagePlaceholders + '\n\n' + textToCopy;
        }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(function() {
            showStatus('Page ' + (index + 1) + ' copied to clipboard (' + format + ' format)!', 'success');
        }).catch(function(err) {
            console.error('Copy failed:', err);
            showStatus('Copy failed. Please try again.', 'error');
        });
    } else {
        // Fallback for older browsers
        var textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showStatus('Page ' + (index + 1) + ' copied to clipboard (' + format + ' format)!', 'success');
        } catch (err) {
            showStatus('Copy failed. Please copy manually.', 'error');
        }
        document.body.removeChild(textArea);
    }
}

function convertToCanvaFormat(page) {
    var canvaText = '';
    
    // Add enhanced image placeholders
    if (page.images && page.images.length > 0) {
        for (var i = 0; i < page.images.length; i++) {
            var img = page.images[i];
            var dimensions = img.type === 'half' ? '(~150px height)' : '(~300px height)';
            canvaText += '[ADD ' + img.type.toUpperCase() + ' IMAGE HERE ' + dimensions + ']\n\n';
        }
    }
    
    canvaText += page.content || '';
    
    // Add formatting hints
    canvaText += '\n\n[PAGE ' + page.number + ' - ' + page.characterCount + ' characters]';
    canvaText += '\n[Status: ' + getPageHeightStatus(page).text + ']';
    
    return canvaText;
}

function copyAllPages() {
    if (!processedPages || processedPages.length === 0) {
        showStatus('No pages to copy', 'error');
        return;
    }
    
    var allText = '';
    allText += 'COMPLETE BOOK LAYOUT - Semi-Independence Flow System\n';
    allText += '='.repeat(60) + '\n';
    allText += 'Generated: ' + new Date().toLocaleString() + '\n';
    allText += 'Total Pages: ' + processedPages.length + '\n';
    allText += 'Book Size: ' + (currentBookSize || 'standard') + '\n';
    allText += 'System: Enhanced Semi-Independence Flow v3.0\n';
    allText += '='.repeat(60) + '\n\n';
    
    for (var i = 0; i < processedPages.length; i++) {
        var page = processedPages[i];
        var heightStatus = getPageHeightStatus(page);
        
        allText += 'PAGE ' + (i + 1) + ' [' + heightStatus.text + ' - ' + page.characterCount + ' chars]\n';
        allText += '-'.repeat(40) + '\n';
        allText += convertToCanvaFormat(page) + '\n';
        allText += '='.repeat(60) + '\n\n';
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(allText).then(function() {
            showStatus('All ' + processedPages.length + ' pages copied to clipboard (Enhanced Canva format)!', 'success');
        }).catch(function(err) {
            console.error('Copy all failed:', err);
            showStatus('Copy failed. Please try again.', 'error');
        });
    } else {
        // Fallback for older browsers
        var textArea = document.createElement('textarea');
        textArea.value = allText;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showStatus('All ' + processedPages.length + ' pages copied to clipboard (Enhanced Canva format)!', 'success');
        } catch (err) {
            showStatus('Copy failed. Please copy manually.', 'error');
        }
        document.body.removeChild(textArea);
    }
}

function exportToText() {
    if (!processedPages || processedPages.length === 0) {
        showStatus('No pages to export', 'error');
        return;
    }
    
    var content = 'Book Layout Export - Semi-Independence Flow System v3.0\n';
    content += '='.repeat(70) + '\n';
    content += 'Generated: ' + new Date().toLocaleString() + '\n';
    content += 'Total Pages: ' + processedPages.length + '\n';
    content += 'Book Size: ' + (currentBookSize || 'standard') + '\n';
    content += 'Characters per page target: ' + targetCharactersPerPage + '\n';
    content += 'Flow System: Enhanced Semi-Independence with height-based overflow\n';
    content += 'Page Dimensions: True print dimensions with accurate margins\n';
    content += '='.repeat(70) + '\n\n';

    // Add summary statistics
    var totalChars = processedPages.reduce(function(total, page) {
        return total + page.characterCount;
    }, 0);
    var avgCharsPerPage = Math.round(totalChars / processedPages.length);
    var pagesWithImages = processedPages.filter(function(page) {
        return page.images && page.images.length > 0;
    }).length;
    
    content += 'SUMMARY STATISTICS:\n';
    content += '-'.repeat(30) + '\n';
    content += 'Total Characters: ' + totalChars + '\n';
    content += 'Average per Page: ' + avgCharsPerPage + '\n';
    content += 'Pages with Images: ' + pagesWithImages + '\n';
    content += 'Text-only Pages: ' + (processedPages.length - pagesWithImages) + '\n\n';
    content += '='.repeat(70) + '\n\n';

    for (var i = 0; i < processedPages.length; i++) {
        var page = processedPages[i];
        var heightStatus = getPageHeightStatus(page);
        
        content += 'PAGE ' + page.number + ' [Status: ' + heightStatus.text + ' | ' + (page.characterCount || 0) + ' characters]\n';
        content += '='.repeat(70) + '\n';
        
        // Add image placeholders with enhanced details
        if (page.images && page.images.length > 0) {
            content += 'IMAGES:\n';
            for (var j = 0; j < page.images.length; j++) {
                var img = page.images[j];
                var imgHeight = img.type === 'half' ? '~150px' : '~300px';
                var textReduction = img.type === 'half' ? '~200 chars' : '~400 chars';
                content += '- ' + img.type.toUpperCase() + ' IMAGE PLACEHOLDER (' + img.id + ')\n';
                content += '  Height: ' + imgHeight + ' | Text space reduced: ' + textReduction + '\n';
            }
            content += '\n';
        }
        
        content += 'TEXT CONTENT:\n';
        content += (page.content || '[Empty page]') + '\n\n';
        
        if (i < processedPages.length - 1) {
            content += '='.repeat(70) + '\n\n';
        }
    }

    var blob = new Blob([content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'book-layout-semi-independence-flow-v3.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showStatus('Enhanced text file exported successfully!', 'success');
}

function generateCanvaInstructions() {
    if (!processedPages || processedPages.length === 0) {
        showStatus('No pages to generate instructions for', 'error');
        return;
    }
    
    var instructions = 'Canva Book Layout Instructions - Semi-Independence Flow System v3.0\n';
    instructions += '='.repeat(80) + '\n\n';
    instructions += 'SYSTEM OVERVIEW:\n';
    instructions += 'This layout was generated using an enhanced semi-independence flow system\n';
    instructions += 'that respects manual edits while automatically managing text overflow.\n\n';
    
    instructions += 'BOOK DETAILS:\n';
    instructions += '-'.repeat(20) + '\n';
    instructions += '- Total Pages: ' + processedPages.length + '\n';
    instructions += '- Book Type: ' + getElementValue('bookType', 'text') + '\n';
    instructions += '- Book Size: ' + getElementValue('bookSize', 'standard') + '\n';
    instructions += '- Layout System: Semi-independence flow with height-based management\n';
    instructions += '- Project Management: Auto-save enabled with undo history\n';
    instructions += '- Page Dimensions: True print dimensions with accurate margins\n\n';
    
    instructions += 'IMAGE PLACEMENT GUIDE:\n';
    instructions += '-'.repeat(25) + '\n';
    instructions += '- Half-page images: ~150px height, reduce text space by ~200 characters\n';
    instructions += '- Full-page images: ~300px height, reduce text space by ~400 characters\n';
    instructions += '- Images are positioned before text in the flow\n';
    instructions += '- Text automatically wraps around image space\n';
    instructions += '- Each image placeholder shows exact ID for tracking\n\n';
    
    instructions += 'ENHANCED FEATURES:\n';
    instructions += '-'.repeat(20) + '\n';
    instructions += '- Real-time height monitoring with visual indicators\n';
    instructions += '- Smart paragraph-aware text flow\n';
    instructions += '- Forward-only flow preserves manual layout choices\n';
    instructions += '- Undo system for easy revision (Ctrl+Z)\n';
    instructions += '- Project save/load with complete state preservation\n\n';
    
    instructions += 'CANVA SETUP INSTRUCTIONS:\n';
    instructions += '-'.repeat(30) + '\n';
    instructions += '1. Create a new design with your chosen book dimensions:\n';
    var bookSize = getElementValue('bookSize', 'standard');
    var dimensions = bookSize === 'standard' ? '5.5" × 8.5"' : '8" × 8"';
    instructions += '   - Book Size: ' + dimensions + '\n';
    instructions += '2. For each page below, create a new page in Canva\n';
    instructions += '3. Add image placeholders first (they determine available text space)\n';
    instructions += '4. Copy the text content into text boxes with proper margins\n';
    instructions += '5. Use consistent typography and spacing throughout\n';
    instructions += '6. Replace image placeholders with actual artwork\n';
    instructions += '7. Use this file as your master reference for layout\n\n';
    
    instructions += 'PAGE-BY-PAGE CONTENT:\n';
    instructions += '='.repeat(80) + '\n\n';

    for (var i = 0; i < processedPages.length; i++) {
        var page = processedPages[i];
        var heightStatus = getPageHeightStatus(page);
        
        instructions += 'PAGE ' + page.number + ' [' + heightStatus.text + ' fill | ' + (page.characterCount || 0) + ' characters]\n';
        instructions += '='.repeat(50) + '\n\n';
        
        // Enhanced image instructions
        if (page.images && page.images.length > 0) {
            instructions += 'IMAGES TO ADD:\n';
            for (var j = 0; j < page.images.length; j++) {
                var img = page.images[j];
                var imgDetails = img.type === 'half' ? 
                    'Half-page image (~150px height, reduces text by ~200 chars)' :
                    'Full-page image (~300px height, reduces text by ~400 chars)';
                instructions += '- ' + img.type.toUpperCase() + ' IMAGE (' + img.id + ')\n';
                instructions += '  Details: ' + imgDetails + '\n';
                instructions += '  Position: Before text content\n';
            }
            instructions += '\n';
        }
        
        instructions += 'TEXT CONTENT:\n';
        instructions += (page.content || '[Empty page - ready for content]') + '\n\n';
        
        instructions += 'LAYOUT NOTES:\n';
        instructions += '- Page Status: ' + heightStatus.text + '\n';
        instructions += '- Character Count: ' + page.characterCount + '\n';
        instructions += '- Images: ' + (page.images ? page.images.length : 0) + '\n';
        instructions += '- Content Type: ' + (page.content && page.content.trim() ? 'Text' : 'Empty') + '\n\n';
        
        var separator = '';
        for (var k = 0; k < 80; k++) {
            separator += '-';
        }
        instructions += separator + '\n\n';
    }

    var blob = new Blob([instructions], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'canva-instructions-semi-independence-flow-v3.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showStatus('Enhanced Canva instructions generated successfully!', 'success');
}

function generatePDF() {
    showStatus('Opening print dialog for PDF generation...', 'success');
    logToDebug('Preparing print-ready layout with true page dimensions', 'info');
    
    // Apply print-friendly styles temporarily
    document.body.classList.add('print-ready');
    
    // Hide editing interface elements for clean print
    var editingElements = document.querySelectorAll('.page-header, .toolbar, .flow-indicator');
    editingElements.forEach(function(el) {
        el.style.display = 'none';
    });
    
    // Open browser print dialog after a short delay
    setTimeout(function() {
        window.print();
        
        // Restore editing interface
        setTimeout(function() {
            document.body.classList.remove('print-ready');
            editingElements.forEach(function(el) {
                el.style.display = '';
            });
        }, 1000);
    }, 1000);
}

// =======================================================================
// PREVIEW MODE FUNCTIONS (ENHANCED)
// =======================================================================

function togglePreviewMode() {
    var pagesContainer = document.getElementById('pagesContainer');
    if (!pagesContainer) {
        showStatus('Pages container not found', 'error');
        return;
    }
    
    var isPreview = pagesContainer.classList.contains('preview-mode');
    
    if (isPreview) {
        pagesContainer.classList.remove('preview-mode');
        showStatus('Edit mode enabled - Full functionality restored', 'success');
        logToDebug('Switched to edit mode', 'info');
    } else {
        pagesContainer.classList.add('preview-mode');
        showStatus('Preview mode enabled - Clean reading view', 'success');
        logToDebug('Switched to preview mode', 'info');
        
        // Add enhanced preview mode styles if not already added
        if (!document.getElementById('previewStyles')) {
            var style = document.createElement('style');
            style.id = 'previewStyles';
            style.textContent = `
                .preview-mode .page-header,
                .preview-mode .toolbar,
                .preview-mode .flow-indicator {
                    display: none !important;
                }
                .preview-mode .page {
                    box-shadow: 0 12px 28px rgba(0,0,0,0.25);
                    margin-bottom: 40px;
                    border: 2px solid #e0e0e0;
                }
                .preview-mode .page-content {
                    height: 100% !important;
                    padding-top: var(--margin-top);
                }
                .preview-mode .editable-content {
                    border: none !important;
                    background: transparent !important;
                    cursor: default !important;
                    user-select: text;
                }
                .preview-mode .editable-content:hover,
                .preview-mode .editable-content:focus {
                    border: none !important;
                    background: transparent !important;
                    box-shadow: none !important;
                }
                .preview-mode .image-placeholder .remove-image {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// =======================================================================
// ENHANCED UTILITY FUNCTIONS
// =======================================================================

function getElementValue(id, defaultValue) {
    var element = document.getElementById(id);
    return element ? element.value : defaultValue;
}

function scheduleReflow() {
    // Legacy function for backward compatibility
    if (currentlyEditingPage !== null) {
        scheduleEnhancedReflow(currentlyEditingPage);
    } else {
        scheduleEnhancedReflow(0);
    }
}

function performReflow() {
    // Legacy function for backward compatibility
    if (currentlyEditingPage !== null) {
        performSemiIndependentFlow(currentlyEditingPage);
    }
}

// =======================================================================
// GLOBAL FUNCTION EXPORTS AND INITIALIZATION
// =======================================================================

// Make sure all functions are available globally
window.renderFormattedPages = renderFormattedPages;
window.copyFormattedPage = copyFormattedPage;
window.copyAllPages = copyAllPages;
window.exportToText = exportToText;
window.generateCanvaInstructions = generateCanvaInstructions;
window.generatePDF = generatePDF;
window.insertImagePlaceholder = insertImagePlaceholder;
window.removeImagePlaceholder = removeImagePlaceholder;
window.forcePageBreak = forcePageBreak;
window.deletePage = deletePage;
window.createNewPageAfter = createNewPageAfter;
window.togglePreviewMode = togglePreviewMode;
window.moveParagraphToNext = moveParagraphToNext;
window.scheduleReflow = scheduleReflow;
window.performReflow = performReflow;

// Enhanced debugging functions
window.debugFlowSystem = function() {
    console.log('=== SEMI-INDEPENDENCE FLOW SYSTEM DEBUG ===');
    console.log('Current Pages:', processedPages.length);
    console.log('Currently Editing:', currentlyEditingPage);
    console.log('Is Reflowing:', isReflowing);
    console.log('Target Characters Per Page:', targetCharactersPerPage);
    console.log('Current Book Size:', currentBookSize);
    
    processedPages.forEach(function(page, index) {
        var heightStatus = getPageHeightStatus(page);
        console.log('Page ' + (index + 1) + ':', {
            characters: page.characterCount,
            heightStatus: heightStatus.text,
            images: page.images ? page.images.length : 0,
            content: page.content ? page.content.substring(0, 50) + '...' : '[empty]'
        });
    });
};

window.debugPageMeasurements = function() {
    console.log('=== PAGE MEASUREMENT DEBUG ===');
    console.log('Available Text Height:', calculateAvailableTextHeight() + 'px');
    console.log('Text Area Width:', getTextAreaWidth() + 'px');
    
    for (var i = 0; i < Math.min(processedPages.length, 3); i++) {
        var actualHeight = measureActualPageHeight(i);
        var calculatedHeight = measureTextHeightForContent(processedPages[i].content);
        console.log('Page ' + (i + 1) + ' Heights:', {
            actual: actualHeight + 'px',
            calculated: calculatedHeight + 'px',
            difference: Math.abs(actualHeight - calculatedHeight) + 'px'
        });
    }
};

// Error handling
window.addEventListener('error', function(e) {
    console.error('App.js Error:', e.error);
    logToDebug('App.js Error: ' + e.message, 'error');
    showStatus('An error occurred. Check debug console for details.', 'error');
});

// Log successful initialization
console.log('App.js v3.0 loaded - Enhanced Semi-Independence Flow System ready');

if (typeof logToDebug === 'function') {
    setTimeout(function() {
        logToDebug('App.js enhanced module loaded successfully', 'success');
        logToDebug('Semi-Independence Flow System v3.0 initialized', 'success');
        logToDebug('Features: Height-based flow, undo system, smart paragraph management', 'info');
        logToDebug('Debug functions: debugFlowSystem(), debugPageMeasurements()', 'info');
    }, 200);
} else {
    console.log('Debug logging not available - core.js may not be loaded yet');
}
