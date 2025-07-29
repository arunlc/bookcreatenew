// =======================================================================
// APP-ACTIONS.JS - Page Actions and Management
// Move Para, Split Here, Image management, Page creation/deletion
// =======================================================================

// =======================================================================
// MOVE PARAGRAPH FUNCTIONALITY
// =======================================================================

function moveLastParagraphToNext(pageIndex) {
    logToDebug('Moving last paragraph from page ' + (pageIndex + 1) + ' to next page', 'info');
    
    var page = processedPages[pageIndex];
    if (!page || !page.content || !page.content.trim()) {
        showStatus('No content to move', 'error');
        return;
    }
    
    // Save state for undo
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('move paragraph');
    }
    
    // Split content into paragraphs (split by double newlines or single newlines)
    var content = page.content.trim();
    var paragraphs;
    
    // Try double newlines first, then single newlines
    if (content.includes('\n\n')) {
        paragraphs = content.split('\n\n').filter(function(p) { return p.trim(); });
    } else {
        paragraphs = content.split('\n').filter(function(p) { return p.trim(); });
    }
    
    if (paragraphs.length <= 1) {
        showStatus('Need at least 2 paragraphs to move one', 'warning');
        return;
    }
    
    // Remove last paragraph
    var lastParagraph = paragraphs.pop();
    var remainingContent = paragraphs.join('\n\n');
    
    // Update current page
    updatePageContent(pageIndex, remainingContent);
    
    // Create next page if needed
    if (pageIndex + 1 >= processedPages.length) {
        createNewBlankPage();
    }
    
    // Add paragraph to beginning of next page
    var nextPage = processedPages[pageIndex + 1];
    var nextContent = lastParagraph;
    if (nextPage.content && nextPage.content.trim()) {
        nextContent = lastParagraph + '\n\n' + nextPage.content;
    }
    updatePageContent(pageIndex + 1, nextContent);
    
    // Re-render affected pages
    if (typeof updatePageRange === 'function') {
        updatePageRange(pageIndex, pageIndex + 1);
    }
    
    showStatus('Last paragraph moved to next page!', 'success');
    logToDebug('Paragraph moved successfully', 'success');
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
}

// =======================================================================
// FORCE PAGE BREAK FUNCTIONALITY
// =======================================================================

function forcePageBreakAtCursor(pageIndex) {
    logToDebug('Forcing page break at cursor on page ' + (pageIndex + 1), 'info');
    
    if (!processedPages[pageIndex]) {
        logToDebug('Invalid page index for page break: ' + pageIndex, 'error');
        return;
    }
    
    // Save state for undo
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('force page break');
    }
    
    var editableDiv = document.querySelector('[data-page-index="' + pageIndex + '"] .editable-content');
    if (!editableDiv) {
        showStatus('Could not find text area for page break', 'error');
        return;
    }
    
    var selection = window.getSelection();
    
    if (selection.rangeCount > 0 && editableDiv.contains(selection.anchorNode)) {
        var range = selection.getRangeAt(0);
        
        // Get text content and cursor position
        var textContent = editableDiv.textContent || '';
        var cursorPos = getCaretPosition(editableDiv);
        
        if (cursorPos === -1) {
            cursorPos = textContent.length; // Default to end if can't determine position
        }
        
        // Split content at cursor position
        var beforeCursor = textContent.substring(0, cursorPos).trim();
        var afterCursor = textContent.substring(cursorPos).trim();
        
        // Update current page with content before cursor
        updatePageContent(pageIndex, beforeCursor);
        
        // Create new page with content after cursor if there's content
        if (afterCursor) {
            // Create new page
            var newPage = createBlankPage(processedPages.length + 1);
            processedPages.splice(pageIndex + 1, 0, newPage);
            
            // Add content to new page
            updatePageContent(pageIndex + 1, afterCursor);
            
            // Renumber pages
            renumberPages();
            
            // Re-render all pages
            if (typeof renderFormattedPages === 'function') {
                renderFormattedPages(processedPages);
            }
            
            showStatus('Page split successfully at cursor position!', 'success');
        } else {
            // Just update the current page
            if (typeof updatePageStatus === 'function') {
                updatePageStatus(pageIndex);
            }
            showStatus('Page content updated', 'success');
        }
        
    } else {
        // Fallback: split at the end of the page
        var content = processedPages[pageIndex].content || '';
        var midPoint = Math.floor(content.length / 2);
        
        // Find a good break point (prefer end of sentence)
        var breakPoint = findGoodBreakPoint(content, midPoint);
        
        var beforeBreak = content.substring(0, breakPoint).trim();
        var afterBreak = content.substring(breakPoint).trim();
        
        updatePageContent(pageIndex, beforeBreak);
        
        if (afterBreak) {
            var newPage = createBlankPage(processedPages.length + 1);
            processedPages.splice(pageIndex + 1, 0, newPage);
            updatePageContent(pageIndex + 1, afterBreak);
            renumberPages();
            if (typeof renderFormattedPages === 'function') {
                renderFormattedPages(processedPages);
            }
        }
        
        showStatus('Page split at midpoint (cursor position not detected)', 'success');
    }
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
}

// =======================================================================
// PAGE CREATION AND DELETION
// =======================================================================

function createNewPageAfter(pageIndex) {
    logToDebug('Creating new page after index: ' + pageIndex, 'info');
    
    // Save state for undo
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('create new page');
    }
    
    var newPage = createBlankPage(processedPages.length + 1);
    
    // Insert new page after specified index
    processedPages.splice(pageIndex + 1, 0, newPage);
    
    // Renumber pages
    renumberPages();
    
    // Re-render pages to show the new page
    if (typeof renderFormattedPages === 'function') {
        renderFormattedPages(processedPages);
    }
    
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
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('delete page');
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
            var mergedContent = deletedContent + (nextContent ? '\n\n' + nextContent : '');
            updatePageContent(pageIndex + 1, mergedContent);
        } else if (pageIndex > 0) {
            // Merge with previous page
            var prevContent = (processedPages[pageIndex - 1].content || '');
            var mergedContent = prevContent + (prevContent ? '\n\n' : '') + deletedContent;
            updatePageContent(pageIndex - 1, mergedContent);
        }
    }
    
    // Remove the page
    processedPages.splice(pageIndex, 1);
    
    // Renumber pages
    renumberPages();
    
    // Re-render pages
    if (typeof renderFormattedPages === 'function') {
        renderFormattedPages(processedPages);
    }
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('Page deleted and content merged successfully!', 'success');
}

// =======================================================================
// IMAGE PLACEHOLDER MANAGEMENT
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
        'Height: ~180px | Reduces text space by ~200 chars' : 
        'Height: ~350px | Reduces text space by ~400 chars';
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
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('insert image placeholder');
    }
    
    var page = processedPages[pageIndex];
    if (!page.images) {
        page.images = [];
    }
    
    var newImageId = 'img_' + page.number + '_' + Date.now(); // Use timestamp for uniqueness
    
    page.images.push({
        type: type,
        id: newImageId
    });
    
    // Re-render the specific page to show the new image
    var pageDiv = document.querySelector('[data-page-index="' + pageIndex + '"]');
    if (pageDiv) {
        var contentDiv = pageDiv.querySelector('.page-content');
        var editableDiv = contentDiv.querySelector('.editable-content');
        var imgElement = createImageElement(type, newImageId, pageIndex);
        contentDiv.insertBefore(imgElement, editableDiv);
    }
    
    // Update page status immediately
    if (typeof updatePageStatus === 'function') {
        updatePageStatus(pageIndex);
    }
    
    // Check if content needs to flow due to reduced space
    if (typeof scheduleEnhancedReflow === 'function') {
        scheduleEnhancedReflow(pageIndex);
    }
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus(type + ' image placeholder added! Text space adjusted.', 'success');
}

function removeImagePlaceholder(imageId, pageIndex) {
    logToDebug('Removing image placeholder ' + imageId + ' from page ' + (pageIndex + 1), 'info');
    
    if (!processedPages[pageIndex]) {
        logToDebug('Invalid page index for image removal: ' + pageIndex, 'error');
        return;
    }
    
    // Save state for undo
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('remove image placeholder');
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
    if (typeof updatePageStatus === 'function') {
        updatePageStatus(pageIndex);
    }
    
    // Check if we can pull content from next page due to additional space
    setTimeout(function() {
        if (typeof checkForContentPull === 'function') {
            checkForContentPull(pageIndex);
        }
    }, 100);
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('Image placeholder removed! Additional text space available.', 'success');
}

// =======================================================================
// PREVIEW MODE TOGGLE
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
// UTILITY HELPER FUNCTIONS
// =======================================================================

function shouldHaveIllustration(freq, pageNum) {
    switch (freq) {
        case 'every': return true;
        case 'alternate': return pageNum % 2 === 0;
        case 'chapter': return pageNum === 1;
        case 'none':
        default: return false;
    }
}

function validatePageIndex(pageIndex, functionName) {
    if (isNaN(pageIndex) || pageIndex < 0 || pageIndex >= processedPages.length) {
        logToDebug('Invalid page index in ' + functionName + ': ' + pageIndex, 'error');
        showStatus('Invalid page index', 'error');
        return false;
    }
    return true;
}

function ensurePageExists(pageIndex) {
    while (pageIndex >= processedPages.length) {
        createNewBlankPage();
    }
}

// =======================================================================
// ACTION TESTING AND DEBUGGING
// =======================================================================

function testMoveParaAction() {
    console.log('Testing Move Para action...');
    
    if (!processedPages || processedPages.length === 0) {
        console.log('No pages available for testing');
        return;
    }
    
    // Add test content with multiple paragraphs
    var testContent = 'First paragraph content here.\n\nSecond paragraph for testing.\n\nThird paragraph to move.';
    
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('test setup');
    }
    
    processedPages[0].content = testContent;
    processedPages[0].characterCount = testContent.length;
    
    if (typeof renderFormattedPages === 'function') {
        renderFormattedPages(processedPages);
    }
    
    console.log('Added test content with 3 paragraphs');
    console.log('Now testing moveLastParagraphToNext...');
    
    setTimeout(function() {
        moveLastParagraphToNext(0);
        console.log('Move Para test completed. Check page distribution.');
    }, 1000);
}

function testSplitAction() {
    console.log('Testing Split Here action...');
    
    if (!processedPages || processedPages.length === 0) {
        console.log('No pages available for testing');
        return;
    }
    
    // Add test content
    var testContent = 'This is the first part of the content. This is the second part that should be on the next page after splitting.';
    
    if (typeof saveToUndoStack === 'function') {
        saveToUndoStack('test setup');
    }
    
    processedPages[0].content = testContent;
    processedPages[0].characterCount = testContent.length;
    
    if (typeof renderFormattedPages === 'function') {
        renderFormattedPages(processedPages);
    }
    
    console.log('Added test content for splitting');
    console.log('Now testing forcePageBreakAtCursor (will split at midpoint)...');
    
    setTimeout(function() {
        forcePageBreakAtCursor(0);
        console.log('Split test completed. Check if content was split into 2 pages.');
    }, 1000);
}

function testImageActions() {
    console.log('Testing image placeholder actions...');
    
    if (!processedPages || processedPages.length === 0) {
        console.log('No pages available for testing');
        return;
    }
    
    console.log('Adding half-page image placeholder...');
    insertImagePlaceholder(0, 'half');
    
    setTimeout(function() {
        console.log('Adding full-page image placeholder...');
        insertImagePlaceholder(0, 'full');
        
        setTimeout(function() {
            console.log('Image actions test completed. Check page for image placeholders.');
        }, 1000);
    }, 1000);
}

function debugPageActions() {
    console.log('=== PAGE ACTIONS DEBUG ===');
    console.log('Available Actions:');
    console.log('- moveLastParagraphToNext(pageIndex)');
    console.log('- forcePageBreakAtCursor(pageIndex)');
    console.log('- createNewPageAfter(pageIndex)');
    console.log('- deletePage(pageIndex)');
    console.log('- insertImagePlaceholder(pageIndex, type)');
    console.log('- removeImagePlaceholder(imageId, pageIndex)');
    console.log('- togglePreviewMode()');
    
    if (processedPages && processedPages.length > 0) {
        console.log('\nCurrent Pages Status:');
        processedPages.forEach(function(page, index) {
            var paragraphCount = page.content ? page.content.split('\n\n').length : 0;
            var imageCount = page.images ? page.images.length : 0;
            console.log('Page ' + (index + 1) + ': ' + 
                       paragraphCount + ' paragraphs, ' + 
                       imageCount + ' images, ' + 
                       page.characterCount + ' chars');
        });
    }
    
    console.log('\nTest Functions:');
    console.log('- testMoveParaAction()');
    console.log('- testSplitAction()');
    console.log('- testImageActions()');
}

// =======================================================================
// GLOBAL EXPORTS
// =======================================================================

// Main action functions
window.moveLastParagraphToNext = moveLastParagraphToNext;
window.forcePageBreakAtCursor = forcePageBreakAtCursor;
window.createNewPageAfter = createNewPageAfter;
window.deletePage = deletePage;

// Image management functions
window.createImageElement = createImageElement;
window.insertImagePlaceholder = insertImagePlaceholder;
window.removeImagePlaceholder = removeImagePlaceholder;

// Preview and utility functions
window.togglePreviewMode = togglePreviewMode;
window.shouldHaveIllustration = shouldHaveIllustration;

// Legacy compatibility
window.forcePageBreak = forcePageBreakAtCursor;
window.moveParagraphToNext = moveLastParagraphToNext;

// Debug and test functions
window.testMoveParaAction = testMoveParaAction;
window.testSplitAction = testSplitAction;
window.testImageActions = testImageActions;
window.debugPageActions = debugPageActions;

console.log('App-Actions.js loaded - Page actions: Move Para, Split Here, Images, Page management');
