// =======================================================================
// PAGE-LAYOUT.JS - True Page Dimensions & Settings Management
// Handles real page dimensions, typography, margins, and layout settings
// =======================================================================

// Page Layout Settings
var pageSettings = {
    bookSize: 'standard',
    dimensions: {
        standard: { width: '5.5in', height: '8.5in' },
        illustration: { width: '8in', height: '8in' }
    },
    margins: {
        top: '0.75in',
        bottom: '0.75in',
        inside: '0.5in',
        outside: '0.5in'
    },
    bleed: '0.125in',
    typography: {
        fontFamily: 'Georgia',
        fontSize: '12pt',
        lineHeight: '1.4'
    },
    pageManagement: {
        orphanControl: true,
        chapterBreaks: true,
        pageNumbers: false
    }
};

// Preset configurations
var pagePresets = {
    children: {
        bookSize: 'illustration',
        margins: { top: '0.75in', bottom: '0.75in', inside: '0.75in', outside: '0.75in' },
        typography: { fontFamily: 'Arial', fontSize: '14pt', lineHeight: '1.5' },
        pageManagement: { orphanControl: true, chapterBreaks: true, pageNumbers: false }
    },
    adult: {
        bookSize: 'standard',
        margins: { top: '0.75in', bottom: '0.75in', inside: '0.5in', outside: '0.5in' },
        typography: { fontFamily: 'Times New Roman', fontSize: '12pt', lineHeight: '1.4' },
        pageManagement: { orphanControl: true, chapterBreaks: true, pageNumbers: true }
    },
    picture: {
        bookSize: 'illustration',
        margins: { top: '0.5in', bottom: '0.5in', inside: '0.5in', outside: '0.5in' },
        typography: { fontFamily: 'Arial', fontSize: '16pt', lineHeight: '1.6' },
        pageManagement: { orphanControl: false, chapterBreaks: false, pageNumbers: false }
    }
};

// =======================================================================
// PAGE SETTINGS MODAL FUNCTIONS
// =======================================================================

function showPageSettings() {
    logToDebug('Opening page settings modal...', 'info');
    
    var modal = document.getElementById('pageSettingsModal');
    if (!modal) {
        logToDebug('Page settings modal not found!', 'error');
        return;
    }
    
    // Populate current settings
    populateModalSettings();
    
    // Show modal
    modal.classList.add('active');
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
    
    logToDebug('Page settings modal opened', 'success');
}

function closePageSettings() {
    var modal = document.getElementById('pageSettingsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
        logToDebug('Page settings modal closed', 'info');
    }
}

function populateModalSettings() {
    // Book size
    var modalBookSize = document.getElementById('modalBookSize');
    if (modalBookSize) {
        modalBookSize.value = pageSettings.bookSize;
    }
    
    // Margins
    document.getElementById('marginTop').value = pageSettings.margins.top;
    document.getElementById('marginBottom').value = pageSettings.margins.bottom;
    document.getElementById('marginInside').value = pageSettings.margins.inside;
    document.getElementById('marginOutside').value = pageSettings.margins.outside;
    document.getElementById('bleedArea').value = pageSettings.bleed;
    
    // Typography
    document.getElementById('fontFamily').value = pageSettings.typography.fontFamily;
    document.getElementById('fontSize').value = pageSettings.typography.fontSize;
    document.getElementById('lineSpacing').value = pageSettings.typography.lineHeight;
    
    // Page management
    document.getElementById('orphanControl').checked = pageSettings.pageManagement.orphanControl;
    document.getElementById('chapterBreaks').checked = pageSettings.pageManagement.chapterBreaks;
    document.getElementById('pageNumbers').checked = pageSettings.pageManagement.pageNumbers;
    
    logToDebug('Modal settings populated', 'info');
}

function applyPageSettings() {
    logToDebug('Applying page settings...', 'info');
    
    try {
        // Get values from modal
        var newSettings = {
            bookSize: document.getElementById('modalBookSize').value,
            margins: {
                top: document.getElementById('marginTop').value,
                bottom: document.getElementById('marginBottom').value,
                inside: document.getElementById('marginInside').value,
                outside: document.getElementById('marginOutside').value
            },
            bleed: document.getElementById('bleedArea').value,
            typography: {
                fontFamily: document.getElementById('fontFamily').value,
                fontSize: document.getElementById('fontSize').value,
                lineHeight: document.getElementById('lineSpacing').value
            },
            pageManagement: {
                orphanControl: document.getElementById('orphanControl').checked,
                chapterBreaks: document.getElementById('chapterBreaks').checked,
                pageNumbers: document.getElementById('pageNumbers').checked
            }
        };
        
        // Update settings
        pageSettings.bookSize = newSettings.bookSize;
        pageSettings.margins = newSettings.margins;
        pageSettings.bleed = newSettings.bleed;
        pageSettings.typography = newSettings.typography;
        pageSettings.pageManagement = newSettings.pageManagement;
        
        // Update main book size selector
        document.getElementById('bookSize').value = newSettings.bookSize;
        
        // Apply visual changes
        updatePageDimensions();
        updatePageTypography();
        
        // Mark as changed for auto-save
        if (typeof markAsChanged === 'function') {
            markAsChanged();
        }
        
        // Close modal
        closePageSettings();
        
        showStatus('Page settings applied successfully!', 'success');
        logToDebug('Page settings applied successfully', 'success');
        
    } catch (err) {
        showStatus('Error applying settings: ' + err.message, 'error');
        logToDebug('Error applying page settings: ' + err.message, 'error');
    }
}

function resetToDefaults() {
    logToDebug('Resetting to default settings...', 'info');
    
    // Reset to default values
    pageSettings = {
        bookSize: 'standard',
        dimensions: {
            standard: { width: '5.5in', height: '8.5in' },
            illustration: { width: '8in', height: '8in' }
        },
        margins: {
            top: '0.75in',
            bottom: '0.75in',
            inside: '0.5in',
            outside: '0.5in'
        },
        bleed: '0.125in',
        typography: {
            fontFamily: 'Georgia',
            fontSize: '12pt',
            lineHeight: '1.4'
        },
        pageManagement: {
            orphanControl: true,
            chapterBreaks: true,
            pageNumbers: false
        }
    };
    
    // Repopulate modal
    populateModalSettings();
    
    showStatus('Settings reset to defaults', 'success');
    logToDebug('Settings reset to defaults', 'success');
}

function applyPreset(presetName) {
    logToDebug('Applying preset: ' + presetName, 'info');
    
    var preset = pagePresets[presetName];
    if (!preset) {
        showStatus('Preset not found: ' + presetName, 'error');
        return;
    }
    
    // Apply preset settings
    pageSettings.bookSize = preset.bookSize;
    pageSettings.margins = preset.margins;
    pageSettings.typography = preset.typography;
    pageSettings.pageManagement = preset.pageManagement;
    
    // Update modal fields
    populateModalSettings();
    
    showStatus('Applied "' + presetName + '" preset successfully!', 'success');
    logToDebug('Preset applied: ' + presetName, 'success');
}

// =======================================================================
// PAGE DIMENSION UPDATE FUNCTIONS
// =======================================================================

function updatePageDimensions() {
    logToDebug('Updating page dimensions...', 'info');
    
    // Update CSS custom properties
    var root = document.documentElement;
    
    // Book dimensions
    var dimensions = pageSettings.dimensions[pageSettings.bookSize];
    if (pageSettings.bookSize === 'standard') {
        root.style.setProperty('--current-width', dimensions.width);
        root.style.setProperty('--current-height', dimensions.height);
    } else {
        root.style.setProperty('--current-width', dimensions.width);
        root.style.setProperty('--current-height', dimensions.height);
    }
    
    // Margins
    root.style.setProperty('--margin-top', pageSettings.margins.top);
    root.style.setProperty('--margin-bottom', pageSettings.margins.bottom);
    root.style.setProperty('--margin-inside', pageSettings.margins.inside);
    root.style.setProperty('--margin-outside', pageSettings.margins.outside);
    root.style.setProperty('--bleed-area', pageSettings.bleed);
    
    // Update all existing pages
    var pages = document.querySelectorAll('.page');
    pages.forEach(function(page) {
        page.className = 'page size-' + pageSettings.bookSize;
        
        // Update page content padding
        var pageContent = page.querySelector('.page-content');
        if (pageContent) {
            pageContent.style.padding = pageSettings.margins.top + ' ' + 
                                      pageSettings.margins.outside + ' ' + 
                                      pageSettings.margins.bottom + ' ' + 
                                      pageSettings.margins.inside;
        }
    });
    
    // Update current book size for reflow
    currentBookSize = pageSettings.bookSize;
    
    logToDebug('Page dimensions updated', 'success');
}

function updatePageTypography() {
    logToDebug('Updating page typography...', 'info');
    
    // Update CSS custom properties
    var root = document.documentElement;
    root.style.setProperty('--font-family', pageSettings.typography.fontFamily);
    root.style.setProperty('--font-size', pageSettings.typography.fontSize);
    root.style.setProperty('--line-height', pageSettings.typography.lineHeight);
    
    // Update all existing pages
    var pages = document.querySelectorAll('.page');
    pages.forEach(function(page) {
        page.style.fontFamily = pageSettings.typography.fontFamily;
        page.style.fontSize = pageSettings.typography.fontSize;
        page.style.lineHeight = pageSettings.typography.lineHeight;
        
        var editableContent = page.querySelector('.editable-content');
        if (editableContent) {
            editableContent.style.fontFamily = pageSettings.typography.fontFamily;
            editableContent.style.fontSize = pageSettings.typography.fontSize;
            editableContent.style.lineHeight = pageSettings.typography.lineHeight;
        }
    });
    
    // Trigger reflow to adjust for new typography
    if (processedPages && processedPages.length > 0) {
        setTimeout(function() {
            scheduleReflow();
        }, 100);
    }
    
    logToDebug('Page typography updated', 'success');
}

// =======================================================================
// PAGE MANAGEMENT FUNCTIONS
// =======================================================================

function createNewPage(afterPageIndex) {
    logToDebug('Creating new page after index: ' + afterPageIndex, 'info');
    
    var newPageNumber = processedPages.length + 1;
    var newPage = {
        number: newPageNumber,
        content: '',
        characterCount: 0,
        images: [],
        hasIllustration: false,
        isBlank: true
    };
    
    if (typeof afterPageIndex === 'number' && afterPageIndex >= 0) {
        processedPages.splice(afterPageIndex + 1, 0, newPage);
    } else {
        processedPages.push(newPage);
    }
    
    // Renumber pages
    for (var i = 0; i < processedPages.length; i++) {
        processedPages[i].number = i + 1;
    }
    
    // Re-render pages
    renderFormattedPages(processedPages);
    
    // Mark as changed
    if (typeof markAsChanged === 'function') {
        markAsChanged();
    }
    
    showStatus('New page created successfully!', 'success');
    logToDebug('New page created', 'success');
}

function deletePageById(pageIndex) {
    if (processedPages.length <= 1) {
        showStatus('Cannot delete the only page!', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this page?')) {
        var deletedPage = processedPages[pageIndex];
        
        // If page has content, merge it with adjacent page
        if (deletedPage.content && deletedPage.content.trim()) {
            if (pageIndex < processedPages.length - 1) {
                // Merge with next page
                processedPages[pageIndex + 1].content = deletedPage.content + ' ' + processedPages[pageIndex + 1].content;
                processedPages[pageIndex + 1].characterCount = processedPages[pageIndex + 1].content.length;
            } else if (pageIndex > 0) {
                // Merge with previous page
                processedPages[pageIndex - 1].content = processedPages[pageIndex - 1].content + ' ' + deletedPage.content;
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
        
        // Mark as changed
        if (typeof markAsChanged === 'function') {
            markAsChanged();
        }
        
        showStatus('Page deleted successfully!', 'success');
        logToDebug('Page deleted: ' + pageIndex, 'success');
    }
}

function checkOrphanControl() {
    if (!pageSettings.pageManagement.orphanControl) {
        return;
    }
    
    logToDebug('Checking for orphan lines...', 'info');
    
    var pages = document.querySelectorAll('.page');
    var orphanCount = 0;
    
    pages.forEach(function(page, index) {
        var editableContent = page.querySelector('.editable-content');
        if (!editableContent) return;
        
        var text = editableContent.textContent.trim();
        if (!text) return;
        
        // Simple orphan detection - count lines
        var lines = text.split('\n').filter(function(line) {
            return line.trim() !== '';
        });
        
        // Check for single line (orphan)
        if (lines.length === 1 && text.length < 50) {
            orphanCount++;
            showOrphanWarning(index, text);
        }
    });
    
    if (orphanCount > 0) {
        logToDebug('Found ' + orphanCount + ' potential orphan lines', 'warn');
    }
}

function showOrphanWarning(pageIndex, text) {
    var page = document.querySelector('[data-page-index="' + pageIndex + '"]');
    if (!page) return;
    
    // Create warning indicator
    var warning = document.createElement('div');
    warning.className = 'orphan-warning';
    warning.style.cssText = 'position: absolute; top: 10px; left: 10px; background: #ffc107; color: #333; padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; z-index: 15;';
    warning.textContent = '⚠️ Orphan';
    warning.title = 'Single line detected: "' + text.substring(0, 30) + '..."';
    
    // Remove existing warnings
    var existingWarning = page.querySelector('.orphan-warning');
    if (existingWarning) {
        existingWarning.remove();
    }
    
    page.appendChild(warning);
    
    // Auto remove after 5 seconds
    setTimeout(function() {
        if (warning.parentNode) {
            warning.remove();
        }
    }, 5000);
}

// =======================================================================
// DIMENSION CALCULATION FUNCTIONS
// =======================================================================

function calculateAvailableTextHeight() {
    var bookSize = pageSettings.bookSize;
    var dimensions = pageSettings.dimensions[bookSize];
    
    // Convert dimensions to pixels (assuming 96 DPI)
    var pageHeight = parseFloat(dimensions.height) * 96;
    var marginTop = parseFloat(pageSettings.margins.top) * 96;
    var marginBottom = parseFloat(pageSettings.margins.bottom) * 96;
    
    // Subtract header height (approximately 50px)
    var availableHeight = pageHeight - marginTop - marginBottom - 50;
    
    logToDebug('Available text height: ' + availableHeight + 'px', 'info');
    return availableHeight;
}

function measureTextHeight(text, fontFamily, fontSize, lineHeight, width) {
    // Create temporary measurement element
    var measureElement = document.createElement('div');
    measureElement.style.cssText = 
        'position: absolute; top: -9999px; left: -9999px; ' +
        'font-family: ' + fontFamily + '; ' +
        'font-size: ' + fontSize + '; ' +
        'line-height: ' + lineHeight + '; ' +
        'width: ' + width + '; ' +
        'white-space: pre-wrap; ' +
        'word-wrap: break-word;';
    
    measureElement.textContent = text;
    document.body.appendChild(measureElement);
    
    var height = measureElement.offsetHeight;
    document.body.removeChild(measureElement);
    
    return height;
}

function getTextWidth() {
    var bookSize = pageSettings.bookSize;
    var dimensions = pageSettings.dimensions[bookSize];
    
    // Convert to pixels and subtract margins
    var pageWidth = parseFloat(dimensions.width) * 96;
    var marginInside = parseFloat(pageSettings.margins.inside) * 96;
    var marginOutside = parseFloat(pageSettings.margins.outside) * 96;
    
    var textWidth = pageWidth - marginInside - marginOutside;
    
    return textWidth + 'px';
}

// =======================================================================
// PARAGRAPH-BASED TEXT FLOW
// =======================================================================

function createParagraphBasedLayout(documentStructure) {
    logToDebug('Creating paragraph-based layout...', 'info');
    
    var pages = [];
    var currentPageParagraphs = [];
    var currentPageHeight = 0;
    var availableHeight = calculateAvailableTextHeight();
    var textWidth = getTextWidth();
    var pageNumber = 1;
    
    for (var i = 0; i < documentStructure.length; i++) {
        var item = documentStructure[i];
        
        // Check if this is a chapter break
        if (item.isHeading && pageSettings.pageManagement.chapterBreaks && currentPageParagraphs.length > 0) {
            // Finish current page
            pages.push(createParagraphPage(pageNumber, currentPageParagraphs));
            currentPageParagraphs = [];
            currentPageHeight = 0;
            pageNumber++;
        }
        
        // Measure paragraph height
        var paragraphHeight = measureTextHeight(
            item.content,
            pageSettings.typography.fontFamily,
            pageSettings.typography.fontSize,
            pageSettings.typography.lineHeight,
            textWidth
        );
        
        // Add some padding between paragraphs
        var paragraphSpacing = parseFloat(pageSettings.typography.fontSize) * 0.5;
        var totalParagraphHeight = paragraphHeight + paragraphSpacing;
        
        // Check if paragraph fits on current page
        if (currentPageHeight + totalParagraphHeight > availableHeight && currentPageParagraphs.length > 0) {
            // Create new page
            pages.push(createParagraphPage(pageNumber, currentPageParagraphs));
            currentPageParagraphs = [];
            currentPageHeight = 0;
            pageNumber++;
        }
        
        // Add paragraph to current page
        currentPageParagraphs.push(item);
        currentPageHeight += totalParagraphHeight;
    }
    
    // Add final page if there are remaining paragraphs
    if (currentPageParagraphs.length > 0) {
        pages.push(createParagraphPage(pageNumber, currentPageParagraphs));
    }
    
    logToDebug('Paragraph-based layout complete: ' + pages.length + ' pages', 'success');
    return pages;
}

function createParagraphPage(pageNumber, paragraphs) {
    var content = paragraphs.map(function(p) { return p.content; }).join('\n\n');
    var hasHeading = paragraphs.some(function(p) { return p.isHeading; });
    
    return {
        number: pageNumber,
        content: content,
        paragraphs: paragraphs,
        characterCount: content.length,
        images: [],
        hasIllustration: false,
        hasHeading: hasHeading,
        isChapterStart: hasHeading
    };
}

// =======================================================================
// PREVIEW AND PRINT FUNCTIONS
// =======================================================================

function togglePreviewMode() {
    var pagesContainer = document.getElementById('pagesContainer');
    var isPreview = pagesContainer.classList.contains('preview-mode');
    
    if (isPreview) {
        pagesContainer.classList.remove('preview-mode');
        showStatus('Edit mode enabled', 'success');
        logToDebug('Switched to edit mode', 'info');
    } else {
        pagesContainer.classList.add('preview-mode');
        showStatus('Preview mode enabled', 'success');
        logToDebug('Switched to preview mode', 'info');
        
        // Add preview mode styles
        if (!document.getElementById('previewStyles')) {
            var style = document.createElement('style');
            style.id = 'previewStyles';
            style.textContent = `
                .preview-mode .page-header,
                .preview-mode .toolbar {
                    display: none !important;
                }
                .preview-mode .page {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                }
                .preview-mode .editable-content {
                    border: none !important;
                    background: transparent !important;
                }
                .preview-mode .editable-content:hover,
                .preview-mode .editable-content:focus {
                    border: none !important;
                    background: transparent !important;
                    box-shadow: none !important;
                }
            `;
            document.head.appendChild(style);
        }
    }
}

function showPrintDialog() {
    logToDebug('Opening print dialog...', 'info');
    
    // Apply print-friendly styles temporarily
    document.body.classList.add('print-ready');
    
    // Open browser print dialog
    setTimeout(function() {
        window.print();
        document.body.classList.remove('print-ready');
    }, 500);
}

// =======================================================================
// INITIALIZATION AND EVENT HANDLERS
// =======================================================================

function initializePageLayout() {
    logToDebug('Initializing page layout system...', 'info');
    
    // Set up modal event handlers
    setupModalEventHandlers();
    
    // Apply initial page settings
    updatePageDimensions();
    updatePageTypography();
    
    // Set up book size change handler
    var bookSizeSelect = document.getElementById('bookSize');
    if (bookSizeSelect) {
        bookSizeSelect.addEventListener('change', function(e) {
            pageSettings.bookSize = e.target.value;
            updatePageDimensions();
            if (typeof markAsChanged === 'function') {
                markAsChanged();
            }
            if (processedPages && processedPages.length > 0) {
                scheduleReflow();
            }
        });
    }
    
    logToDebug('Page layout system initialized', 'success');
}

function setupModalEventHandlers() {
    // Close modal when clicking outside
    var modal = document.getElementById('pageSettingsModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closePageSettings();
            }
        });
    }
    
    // ESC key to close modal
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            var modal = document.getElementById('pageSettingsModal');
            if (modal && modal.classList.contains('active')) {
                closePageSettings();
            }
        }
    });
}

// =======================================================================
// EXPORT CURRENT SETTINGS
// =======================================================================

function exportPageSettings() {
    var settingsData = {
        pageSettings: pageSettings,
        timestamp: Date.now(),
        version: '2.0'
    };
    
    var dataStr = JSON.stringify(settingsData, null, 2);
    var dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    var url = URL.createObjectURL(dataBlob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'page-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showStatus('Page settings exported successfully!', 'success');
    logToDebug('Page settings exported', 'success');
}

function importPageSettings(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
        try {
            var data = JSON.parse(e.target.result);
            if (data.pageSettings) {
                pageSettings = data.pageSettings;
                updatePageDimensions();
                updatePageTypography();
                showStatus('Page settings imported successfully!', 'success');
                logToDebug('Page settings imported', 'success');
            } else {
                throw new Error('Invalid settings file format');
            }
        } catch (err) {
            showStatus('Error importing settings: ' + err.message, 'error');
            logToDebug('Error importing settings: ' + err.message, 'error');
        }
    };
    reader.readAsText(file);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePageLayout);
} else {
    initializePageLayout();
}
