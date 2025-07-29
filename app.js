// =======================================================================
// APP.JS - Main Application & Page Management (FIXED VERSION)
// Page rendering, editing, image management, and export functions
// =======================================================================

// =======================================================================
// PAGE RENDERING FUNCTIONS
// =======================================================================

function renderFormattedPages(pages) {
    console.log('Rendering', pages.length, 'pages...');
    logToDebug('Starting to render ' + pages.length + ' pages', 'info');
    
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

        // Flow indicator
        var flowIndicator = document.createElement('div');
        flowIndicator.className = 'flow-indicator';
        flowIndicator.textContent = 'Flowing...';

        // Page header
        var headerDiv = document.createElement('div');
        headerDiv.className = 'page-header';
        
        var pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        
        var characterCountClass = getCharacterCountClass(page.characterCount);
        var characterCountHtml = '<span class="character-counter ' + characterCountClass + '">' + page.characterCount + ' / ' + targetCharactersPerPage + ' chars</span>';
        
        pageInfo.innerHTML = '<span>Page ' + page.number + '</span>' + characterCountHtml;
        
        // Page actions
        var pageActions = document.createElement('div');
        pageActions.className = 'page-actions';
        pageActions.innerHTML = 
            '<button class="copy-button" onclick="copyFormattedPage(' + i + ', \'text\')">Copy Text</button>' +
            '<button class="copy-button" onclick="copyFormattedPage(' + i + ', \'formatted\')">Copy HTML</button>' +
            (pages.length > 1 ? '<button class="delete-button" onclick="deletePage(' + i + ')">Delete</button>' : '');
        
        headerDiv.appendChild(pageInfo);
        headerDiv.appendChild(pageActions);

        // Toolbar
        var toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        toolbar.innerHTML = 
            '<button class="toolbar-button image-btn" onclick="insertImagePlaceholder(' + i + ', \'half\')">📷 Half Image</button>' +
            '<button class="toolbar-button image-btn" onclick="insertImagePlaceholder(' + i + ', \'full\')">🖼️ Full Image</button>' +
            '<button class="toolbar-button break-btn" onclick="forcePageBreak(' + i + ')">⏎ Force Break</button>' +
            '<button class="toolbar-button" onclick="createNewPageAfter(' + i + ')">📄 New Page</button>';

        // Page content
        var contentDiv = document.createElement('div');
        contentDiv.className = 'page-content';

        // Render existing images
        if (page.images && page.images.length > 0) {
            for (var j = 0; j < page.images.length; j++) {
                var img = page.images[j];
                var imgPlaceholder = createImageElement(img.type, img.id, i);
                contentDiv.appendChild(imgPlaceholder);
            }
        }

        // Editable text content
        var editableDiv = document.createElement('div');
        editableDiv.className = 'editable-content';
        editableDiv.contentEditable = true;
        editableDiv.setAttribute('data-page-index', i);
        editableDiv.textContent = page.content || '';
        
        // Add input event listener for real-time character flow
        editableDiv.addEventListener('input', function(e) {
            handleTextInput(e);
        });

        // Add cursor tracking
        editableDiv.addEventListener('focus', function(e) {
            currentCursorPage = parseInt(e.target.getAttribute('data-page-index'));
        });

        // Handle Enter key for paragraph creation
        editableDiv.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                // Let the default behavior happen (creates new line)
                setTimeout(function() {
                    handleTextInput({ target: e.target });
                }, 10);
            }
        });

        contentDiv.appendChild(editableDiv);
        
        pageDiv.appendChild(flowIndicator);
        pageDiv.appendChild(headerDiv);
        pageDiv.appendChild(toolbar);
        pageDiv.appendChild(contentDiv);
        container.appendChild(pageDiv);
    }
    
    logToDebug('Rendered ' + pages.length + ' pages successfully', 'success');
}

function handleTextInput(event) {
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
    
    logToDebug('Page ' + (pageIndex + 1) + ' edited: ' + newContent.length + ' characters', 'flow');
    
    // Mark as changed for auto-save
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    // Update character counter display
    updateCharacterCounter(pageIndex);
    
    // Schedule reflow after a short delay to avoid excessive calls
    scheduleReflow();
}

function updateCharacterCounter(pageIndex) {
    if (!processedPages[pageIndex]) return;
    
    var page = processedPages[pageIndex];
    var headerDiv = document.querySelector('[data-page-index="' + pageIndex + '"] .page-header .page-info');
    
    if (headerDiv) {
        var characterCountClass = getCharacterCountClass(page.characterCount);
        var characterCountHtml = '<span class="character-counter ' + characterCountClass + '">' + page.characterCount + ' / ' + targetCharactersPerPage + ' chars</span>';
        
        headerDiv.innerHTML = '<span>Page ' + page.number + '</span>' + characterCountHtml;
    }
}

// =======================================================================
// IMAGE PLACEHOLDER FUNCTIONS
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
    placeholderDetails.textContent = type === 'half' ? 
        'This image will occupy half the page height' : 
        'This image will occupy most of the page';
    
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
    
    // Update available character space and trigger reflow if needed
    var reservedChars = type === 'half' ? 200 : 400;
    if (page.content && page.content.length > targetCharactersPerPage - reservedChars) {
        scheduleReflow();
    }
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('Image placeholder added successfully!', 'success');
}

function removeImagePlaceholder(imageId, pageIndex) {
    logToDebug('Removing image placeholder ' + imageId + ' from page ' + (pageIndex + 1), 'info');
    
    if (!processedPages[pageIndex]) {
        logToDebug('Invalid page index for image removal: ' + pageIndex, 'error');
        return;
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
    
    // Trigger reflow since we have more space now
    scheduleReflow();
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('Image placeholder removed!', 'success');
}

// =======================================================================
// PAGE MANAGEMENT FUNCTIONS
// =======================================================================

function forcePageBreak(pageIndex) {
    logToDebug('Forcing page break at page ' + (pageIndex + 1), 'info');
    
    if (!processedPages[pageIndex]) {
        logToDebug('Invalid page index for page break: ' + pageIndex, 'error');
        return;
    }
    
    // Get cursor position in the editable div
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
        processedPages[pageIndex].content = beforeCursor;
        processedPages[pageIndex].characterCount = beforeCursor.length;
        
        // Create new page with content after cursor if there's content
        if (afterCursor.trim()) {
            var newPageNumber = processedPages.length + 1;
            var newPage = createCharacterPage(newPageNumber, afterCursor.trim(), false);
            
            // Insert new page after current page
            processedPages.splice(pageIndex + 1, 0, newPage);
            
            // Renumber pages
            for (var i = 0; i < processedPages.length; i++) {
                processedPages[i].number = i + 1;
            }
            
            // Re-render
            renderFormattedPages(processedPages);
            
            showStatus('Page break inserted successfully!', 'success');
        } else {
            // Just update the current page
            updateCharacterCounter(pageIndex);
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

function createNewPageAfter(pageIndex) {
    logToDebug('Creating new page after index: ' + pageIndex, 'info');
    
    var newPageNumber = processedPages.length + 1;
    var newPage = {
        number: newPageNumber,
        content: '',
        characterCount: 0,
        images: [],
        hasIllustration: false,
        isBlank: true
    };
    
    // Insert new page after specified index
    processedPages.splice(pageIndex + 1, 0, newPage);
    
    // Renumber pages
    for (var i = 0; i < processedPages.length; i++) {
        processedPages[i].number = i + 1;
    }
    
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
    
    if (!processedPages[pageIndex]) {
        logToDebug('Invalid page index for deletion: ' + pageIndex, 'error');
        return;
    }
    
    // Merge content with adjacent page
    var deletedContent = processedPages[pageIndex].content || '';
    
    if (deletedContent.trim()) {
        if (pageIndex < processedPages.length - 1) {
            // Merge with next page
            processedPages[pageIndex + 1].content = deletedContent + ' ' + (processedPages[pageIndex + 1].content || '');
            processedPages[pageIndex + 1].characterCount = processedPages[pageIndex + 1].content.length;
        } else if (pageIndex > 0) {
            // Merge with previous page
            processedPages[pageIndex - 1].content = (processedPages[pageIndex - 1].content || '') + ' ' + deletedContent;
            processedPages[pageIndex - 1].characterCount = processedPages[pageIndex - 1].content.length;
        }
    }
    
    // Remove the page
    processedPages.splice(pageIndex, 1);
    
    // Renumber pages
    for (var i = 0; i < processedPages.length; i++) {
        processedPages[i].number = i + 1;
    }
    
    // Re-render pages
    renderFormattedPages(processedPages);
    
    // Trigger reflow to redistribute content properly
    scheduleReflow();
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('Page deleted and content merged successfully!', 'success');
}

// =======================================================================
// COPY AND EXPORT FUNCTIONS
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
        
        // Add image placeholders to text
        if (page.images && page.images.length > 0) {
            var imagePlaceholders = page.images.map(function(img) {
                return '[' + img.type.toUpperCase() + ' IMAGE PLACEHOLDER]';
            }).join('\n');
            textToCopy = imagePlaceholders + '\n\n' + textToCopy;
        }
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).then(function() {
            showStatus('Page copied to clipboard (' + format + ' format)!', 'success');
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
            showStatus('Page copied to clipboard (' + format + ' format)!', 'success');
        } catch (err) {
            showStatus('Copy failed. Please copy manually.', 'error');
        }
        document.body.removeChild(textArea);
    }
}

function convertToCanvaFormat(page) {
    var canvaText = '';
    
    // Add image placeholders
    if (page.images && page.images.length > 0) {
        for (var i = 0; i < page.images.length; i++) {
            var img = page.images[i];
            canvaText += '[ADD ' + img.type.toUpperCase() + ' IMAGE HERE]\n\n';
        }
    }
    
    canvaText += page.content || '';
    
    return canvaText;
}

function copyAllPages() {
    if (!processedPages || processedPages.length === 0) {
        showStatus('No pages to copy', 'error');
        return;
    }
    
    var allText = '';
    for (var i = 0; i < processedPages.length; i++) {
        allText += 'PAGE ' + (i + 1) + ':\n';
        allText += convertToCanvaFormat(processedPages[i]) + '\n---\n\n';
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(allText).then(function() {
            showStatus('All pages copied to clipboard (Canva format)!', 'success');
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
            showStatus('All pages copied to clipboard (Canva format)!', 'success');
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
    
    var content = 'Book Layout Export (Character-Based Flow v2.0)\n';
    content += 'Generated: ' + new Date().toLocaleDateString() + '\n';
    content += 'Total Pages: ' + processedPages.length + '\n';
    content += 'Characters per page: ' + targetCharactersPerPage + '\n\n';
    content += '==================================================\n\n';

    for (var i = 0; i < processedPages.length; i++) {
        var page = processedPages[i];
        content += 'PAGE ' + page.number + ' (' + (page.characterCount || 0) + ' characters)\n';
        content += '==================================================\n';
        
        // Add image placeholders
        if (page.images && page.images.length > 0) {
            for (var j = 0; j < page.images.length; j++) {
                var img = page.images[j];
                content += '[' + img.type.toUpperCase() + ' IMAGE PLACEHOLDER - ' + img.id + ']\n\n';
            }
        }
        
        content += (page.content || '') + '\n\n';
        
        if (i < processedPages.length - 1) {
            content += '==================================================\n\n';
        }
    }

    var blob = new Blob([content], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'book-layout-character-based-v2.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showStatus('Text file exported successfully!', 'success');
}

function generateCanvaInstructions() {
    if (!processedPages || processedPages.length === 0) {
        showStatus('No pages to generate instructions for', 'error');
        return;
    }
    
    var instructions = 'Canva Book Layout Instructions (Character-Based Flow v2.0)\n';
    instructions += '==================================================\n\n';
    instructions += 'Book Details:\n';
    instructions += '- Total Pages: ' + processedPages.length + '\n';
    instructions += '- Book Type: ' + getElementValue('bookType', 'text') + '\n';
    instructions += '- Book Size: ' + getElementValue('bookSize', 'standard') + '\n';
    instructions += '- Characters per Page: ' + getElementValue('charactersPerPage', '1800') + '\n';
    instructions += '- Layout System: Character-based flow with real-time editing v2.0\n';
    instructions += '- Project Management: Auto-save enabled with project history\n\n';
    
    instructions += 'Image Placement Guide:\n';
    instructions += '- Half-page images reserve ~200 characters of space\n';
    instructions += '- Full-page images reserve ~400 characters of space\n';
    instructions += '- Images can be placed anywhere in the page flow\n';
    instructions += '- Each image placeholder shows exact dimensions needed\n\n';
    
    instructions += 'Steps for Canva:\n';
    instructions += '1. Create a new design with your chosen book dimensions\n';
    instructions += '2. For each page below, create a new page in Canva\n';
    instructions += '3. Add image placeholders first (they determine text space)\n';
    instructions += '4. Copy the text content into text boxes\n';
    instructions += '5. Ensure consistent spacing and alignment\n';
    instructions += '6. Replace image placeholders with actual artwork\n';
    instructions += '7. Use this file as your master reference\n\n';
    
    instructions += 'Page-by-Page Content:\n';
    instructions += '==================================================\n\n';

    for (var i = 0; i < processedPages.length; i++) {
        var page = processedPages[i];
        instructions += 'PAGE ' + page.number + ' (' + (page.characterCount || 0) + ' characters):\n\n';
        
        // Add image instructions
        if (page.images && page.images.length > 0) {
            instructions += 'IMAGES TO ADD:\n';
            for (var j = 0; j < page.images.length; j++) {
                var img = page.images[j];
                instructions += '- ' + img.type.toUpperCase() + ' page image (' + img.id + ')\n';
            }
            instructions += '\n';
        }
        
        instructions += 'TEXT CONTENT:\n';
        instructions += (page.content || '') + '\n\n';
        
        var separator = '';
        for (var k = 0; k < 50; k++) {
            separator += '-';
        }
        instructions += separator + '\n\n';
    }

    var blob = new Blob([instructions], { type: 'text/plain' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'canva-instructions-character-flow-v2.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showStatus('Canva instructions generated successfully!', 'success');
}

function generatePDF() {
    showStatus('Opening print dialog for PDF generation...', 'success');
    
    // Apply print-friendly styles temporarily
    document.body.classList.add('print-ready');
    
    // Open browser print dialog after a short delay
    setTimeout(function() {
        window.print();
        document.body.classList.remove('print-ready');
    }, 1000);
}

// =======================================================================
// PREVIEW MODE FUNCTIONS
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
        showStatus('Edit mode enabled', 'success');
        logToDebug('Switched to edit mode', 'info');
    } else {
        pagesContainer.classList.add('preview-mode');
        showStatus('Preview mode enabled - Hide editing controls', 'success');
        logToDebug('Switched to preview mode', 'info');
        
        // Add preview mode styles if not already added
        if (!document.getElementById('previewStyles')) {
            var style = document.createElement('style');
            style.id = 'previewStyles';
            style.textContent = `
                .preview-mode .page-header,
                .preview-mode .toolbar {
                    display: none !important;
                }
                .preview-mode .page {
                    box-shadow: 0 8px 20px rgba(0,0,0,0.25);
                    margin-bottom: 40px;
                }
                .preview-mode .editable-content {
                    border: none !important;
                    background: transparent !important;
                    cursor: default;
                }
                .preview-mode .editable-content:hover,
                .preview-mode .editable-content:focus {
                    border: none !important;
                    background: transparent !important;
                    box-shadow: none !important;
                }
                .preview-mode .flow-indicator {
                    display: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

// =======================================================================
// INITIALIZATION AND ERROR HANDLING
// =======================================================================

// Make sure functions are available globally
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

// Log successful initialization
console.log('App.js loaded successfully - Page rendering functions available');

if (typeof logToDebug === 'function') {
    setTimeout(function() {
        logToDebug('App.js module loaded successfully', 'success');
        logToDebug('All page rendering and interaction functions initialized', 'info');
    }, 200);
}
