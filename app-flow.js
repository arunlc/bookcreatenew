// =======================================================================
// APP-FLOW.JS - Semi-Independence Flow System
// Handles text overflow, content pulling, and smart page management
// =======================================================================

// =======================================================================
// ENHANCED SEMI-INDEPENDENCE FLOW SYSTEM
// =======================================================================

function scheduleEnhancedReflow(triggerPageIndex) {
    if (reflowTimeout) {
        clearTimeout(reflowTimeout);
    }
    
    // Show flow indicator
    if (typeof showFlowIndicator === 'function') {
        showFlowIndicator(triggerPageIndex);
    }
    
    // Debounced reflow - 500ms delay for better stability
    reflowTimeout = setTimeout(function() {
        performSemiIndependentFlow(triggerPageIndex);
        if (typeof hideFlowIndicator === 'function') {
            hideFlowIndicator(triggerPageIndex);
        }
    }, 500);
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
            var imageHeight = processedPages[startPageIndex].images.length * 180; // Conservative estimate
            availableHeight -= imageHeight;
        }
        
        logToDebug('Page ' + (startPageIndex + 1) + ' height check: ' + pageHeight + 'px used, ' + availableHeight + 'px available', 'flow');
        
        if (pageHeight > availableHeight) {
            // Page overflows - find overflow content
            var overflowData = findSmartOverflow(startPageIndex, availableHeight);
            
            if (overflowData.hasOverflow) {
                // Save state before making changes
                if (typeof saveToUndoStack === 'function') {
                    saveToUndoStack('automatic text flow');
                }
                
                // Update current page with fitting content
                updatePageContent(startPageIndex, overflowData.fittingContent);
                
                // Flow overflow to next page(s)
                flowOverflowForward(startPageIndex + 1, overflowData.overflowContent);
                
                logToDebug('Overflow handled - content flowed to next page', 'flow');
            }
        }
        
        // Update all affected page displays
        if (typeof updatePageRange === 'function') {
            updatePageRange(startPageIndex, Math.min(startPageIndex + 3, processedPages.length - 1));
        }
        
    } catch (err) {
        logToDebug('Error in semi-independent flow: ' + err.message, 'error');
        showStatus('Flow error: ' + err.message, 'error');
    } finally {
        isReflowing = false;
    }
}

function findSmartOverflow(pageIndex, availableHeight) {
    var content = processedPages[pageIndex].content;
    if (!content) return { hasOverflow: false, fittingContent: '', overflowContent: '' };
    
    // Split by paragraphs first (double newlines), then by sentences
    var paragraphs = content.split('\n\n').filter(function(p) { return p.trim(); });
    
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
        currentHeight += paragraphHeight + 20; // Add paragraph spacing
    }
    
    return {
        hasOverflow: overflowIndex >= 0,
        fittingContent: fittingParagraphs.join('\n\n'),
        overflowContent: overflowIndex >= 0 ? paragraphs.slice(overflowIndex).join('\n\n') : ''
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
        combinedContent += '\n\n' + nextPage.content;
    }
    
    // Check if next page also overflows
    var nextAvailableHeight = calculateAvailableTextHeight();
    if (nextPage.images && nextPage.images.length > 0) {
        nextAvailableHeight -= nextPage.images.length * 180;
    }
    
    var combinedHeight = measureTextHeightForContent(combinedContent);
    
    if (combinedHeight > nextAvailableHeight) {
        // Cascade overflow to subsequent pages
        var nextOverflowData = findOverflowInContent(combinedContent, nextAvailableHeight);
        if (nextOverflowData.hasOverflow) {
            updatePageContent(pageIndex, nextOverflowData.fittingContent);
            flowOverflowForward(pageIndex + 1, nextOverflowData.overflowContent);
        } else {
            updatePageContent(pageIndex, combinedContent);
        }
    } else {
        // All content fits
        updatePageContent(pageIndex, combinedContent);
    }
    
    logToDebug('Content flowed to page ' + (pageIndex + 1), 'flow');
}

function findOverflowInContent(content, availableHeight) {
    var paragraphs = content.split('\n\n').filter(function(p) { return p.trim(); });
    var fittingParagraphs = [];
    var currentHeight = 0;
    
    for (var i = 0; i < paragraphs.length; i++) {
        var paragraphHeight = measureParagraphHeight(paragraphs[i]);
        
        if (currentHeight + paragraphHeight > availableHeight && fittingParagraphs.length > 0) {
            return {
                hasOverflow: true,
                fittingContent: fittingParagraphs.join('\n\n'),
                overflowContent: paragraphs.slice(i).join('\n\n')
            };
        }
        
        fittingParagraphs.push(paragraphs[i]);
        currentHeight += paragraphHeight + 20;
    }
    
    return {
        hasOverflow: false,
        fittingContent: content,
        overflowContent: ''
    };
}

// =======================================================================
// CONTENT PULLING SYSTEM
// =======================================================================

function checkForContentPull(pageIndex) {
    // Check if page has room to pull content from next page
    var currentHeight = measureActualPageHeight(pageIndex);
    var availableHeight = calculateAvailableTextHeight();
    
    if (processedPages[pageIndex].images) {
        availableHeight -= processedPages[pageIndex].images.length * 180;
    }
    
    var remainingSpace = availableHeight - currentHeight;
    
    // If there's significant space and next page exists
    if (remainingSpace > 150 && pageIndex + 1 < processedPages.length) {
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
    if (!nextContent || !nextContent.trim()) return;
    
    // Find how much content can fit in available space
    var paragraphs = nextContent.split('\n\n').filter(function(p) { return p.trim(); });
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
        // Save state for undo
        if (typeof saveToUndoStack === 'function') {
            saveToUndoStack('pull content from next page');
        }
        
        // Pull content to current page
        var currentContent = processedPages[pageIndex].content;
        var pulledContent = pullableParagraphs.join('\n\n');
        var newCurrentContent = currentContent + (currentContent ? '\n\n' : '') + pulledContent;
        updatePageContent(pageIndex, newCurrentContent);
        
        // Remove pulled content from next page
        var remainingContent = paragraphs.slice(pullableParagraphs.length).join('\n\n');
        updatePageContent(nextPageIndex, remainingContent);
        
        logToDebug('Pulled ' + pullableParagraphs.length + ' paragraphs from next page', 'flow');
        showStatus('Content pulled from next page to fill available space', 'success');
    }
}

// =======================================================================
// SMART PAGE BREAK AND SPLITTING FUNCTIONS
// =======================================================================

function findGoodBreakPoint(text, startPos) {
    // Look for sentence endings near the start position
    var searchRange = 100; // Search within 100 characters
    var start = Math.max(0, startPos - searchRange);
    var end = Math.min(text.length, startPos + searchRange);
    
    // Look for sentence endings (., !, ?)
    for (var i = startPos; i >= start; i--) {
        var char = text.charAt(i);
        if (char === '.' || char === '!' || char === '?') {
            // Make sure it's followed by space or newline
            if (i + 1 < text.length && (text.charAt(i + 1) === ' ' || text.charAt(i + 1) === '\n')) {
                return i + 1;
            }
        }
    }
    
    // Look for paragraph breaks
    for (var i = startPos; i >= start; i--) {
        if (text.charAt(i) === '\n' && (i === 0 || text.charAt(i - 1) === '\n')) {
            return i;
        }
    }
    
    // Look for word boundaries
    for (var i = startPos; i >= start; i--) {
        if (text.charAt(i) === ' ') {
            return i;
        }
    }
    
    // Fallback to original position
    return startPos;
}

function getCaretPosition(element) {
    var caretOffset = 0;
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    
    if (typeof win.getSelection != "undefined") {
        sel = win.getSelection();
        if (sel.rangeCount > 0) {
            var range = win.getSelection().getRangeAt(0);
            var preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
    } else if ((sel = doc.selection) && sel.type != "Control") {
        var textRange = sel.createRange();
        var preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }
    
    return caretOffset;
}

// =======================================================================
// FLOW DEBUGGING AND TESTING
// =======================================================================

function debugFlowSystem() {
    console.log('=== SEMI-INDEPENDENCE FLOW SYSTEM DEBUG ===');
    console.log('Current Pages:', processedPages ? processedPages.length : 0);
    console.log('Currently Editing:', currentlyEditingPage);
    console.log('Is Reflowing:', isReflowing);
    console.log('Target Characters Per Page:', targetCharactersPerPage);
    console.log('Current Book Size:', currentBookSize);
    console.log('Available Text Height:', calculateAvailableTextHeight() + 'px');
    console.log('Text Area Width:', getTextAreaWidth() + 'px');
    
    if (processedPages) {
        processedPages.forEach(function(page, index) {
            var heightStatus = getPageHeightStatus(page);
            var actualHeight = measureActualPageHeight(index);
            console.log('Page ' + (index + 1) + ':', {
                characters: page.characterCount,
                heightStatus: heightStatus.text,
                actualHeight: actualHeight + 'px',
                images: page.images ? page.images.length : 0,
                content: page.content ? page.content.substring(0, 50) + '...' : '[empty]'
            });
        });
    }
}

function testFlowSystem() {
    console.log('Testing flow system...');
    
    if (!processedPages || processedPages.length === 0) {
        console.log('No pages available for testing');
        return;
    }
    
    // Add test content to first page to trigger overflow
    var testContent = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(50);
    
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('flow system test');
    }
    
    processedPages[0].content += '\n\n' + testContent;
    processedPages[0].characterCount = processedPages[0].content.length;
    
    console.log('Added test content to trigger overflow');
    console.log('Page 1 content length:', processedPages[0].content.length);
    
    // Trigger flow
    scheduleEnhancedReflow(0);
    
    setTimeout(function() {
        console.log('Flow test completed. Check page content distribution.');
        if (processedPages.length > 1) {
            console.log('Page 2 content length:', processedPages[1].content.length);
        }
    }, 1000);
}

function forceReflow(pageIndex) {
    pageIndex = pageIndex || 0;
    console.log('Forcing reflow from page ' + (pageIndex + 1));
    performSemiIndependentFlow(pageIndex);
}

// =======================================================================
// GLOBAL EXPORTS
// =======================================================================

// Main flow functions
window.scheduleEnhancedReflow = scheduleEnhancedReflow;
window.performSemiIndependentFlow = performSemiIndependentFlow;
window.checkForContentPull = checkForContentPull;
window.pullContentFromNextPage = pullContentFromNextPage;

// Utility functions
window.findSmartOverflow = findSmartOverflow;
window.findGoodBreakPoint = findGoodBreakPoint;
window.getCaretPosition = getCaretPosition;

// Debug functions
window.debugFlowSystem = debugFlowSystem;
window.testFlowSystem = testFlowSystem;
window.forceReflow = forceReflow;

console.log('App-Flow.js loaded - Semi-independence flow system with smart overflow handling');
