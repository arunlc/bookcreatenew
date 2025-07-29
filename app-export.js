// =======================================================================
// APP-EXPORT.JS - Copy and Export Functions
// Copy pages, export to text, generate Canva instructions, PDF generation
// =======================================================================

// =======================================================================
// COPY FUNCTIONS
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
            var dimensions = img.type === 'half' ? '(~180px height)' : '(~350px height)';
            canvaText += '[ADD ' + img.type.toUpperCase() + ' IMAGE HERE ' + dimensions + ']\n\n';
        }
    }
    
    canvaText += page.content || '';
    
    // Add formatting hints
    canvaText += '\n\n[PAGE ' + page.number + ' - ' + page.characterCount + ' characters]';
    
    if (typeof getPageHeightStatus === 'function') {
        canvaText += '\n[Status: ' + getPageHeightStatus(page).text + ']';
    }
    
    return canvaText;
}

function copyAllPages() {
    if (!processedPages || processedPages.length === 0) {
        showStatus('No pages to copy', 'error');
        return;
    }
    
    var allText = '';
    allText += 'COMPLETE BOOK LAYOUT - Fixed Semi-Independence Flow System\n';
    allText += '='.repeat(70) + '\n';
    allText += 'Generated: ' + new Date().toLocaleString() + '\n';
    allText += 'Total Pages: ' + processedPages.length + '\n';
    allText += 'Book Size: ' + (currentBookSize || 'standard') + '\n';
    allText += 'System: Fixed Semi-Independence Flow with Working Undo\n';
    allText += 'Features: Complete document processing, Ctrl+Z/Ctrl+Y, Move Para, Split Here\n';
    allText += '='.repeat(70) + '\n\n';
    
    for (var i = 0; i < processedPages.length; i++) {
        var page = processedPages[i];
        var heightStatus = typeof getPageHeightStatus === 'function' ? 
            getPageHeightStatus(page) : { text: 'Unknown' };
        
        allText += 'PAGE ' + (i + 1) + ' [' + heightStatus.text + ' - ' + page.characterCount + ' chars]\n';
        allText += '-'.repeat(50) + '\n';
        allText += convertToCanvaFormat(page) + '\n';
        allText += '='.repeat(70) + '\n\n';
    }
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(allText).then(function() {
            showStatus('All ' + processedPages.length + ' pages copied to clipboard!', 'success');
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
            showStatus('All ' + processedPages.length + ' pages copied to clipboard!', 'success');
        } catch (err) {
            showStatus('Copy failed. Please copy manually.', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// =======================================================================
// TEXT EXPORT FUNCTION
// =======================================================================

function exportToText() {
    if (!processedPages || processedPages.length === 0) {
        showStatus('No pages to export', 'error');
        return;
    }
    
    var content = 'Book Layout Export - Fixed Semi-Independence Flow System\n';
    content += '='.repeat(70) + '\n';
    content += 'Generated: ' + new Date().toLocaleString() + '\n';
    content += 'Total Pages: ' + processedPages.length + '\n';
    content += 'Book Size: ' + (currentBookSize || 'standard') + '\n';
    content += 'Characters per page target: ' + (targetCharactersPerPage || 1800) + '\n';
    content += 'Flow System: Fixed Semi-Independence with Working Undo (Ctrl+Z/Ctrl+Y)\n';
    content += 'Page Dimensions: True print dimensions with accurate margins\n';
    content += 'Features: Complete document processing, Move Para, Split Here\n';
    content += '='.repeat(70) + '\n\n';

    // Add summary statistics
    var totalChars = processedPages.reduce(function(total, page) {
        return total + page.characterCount;
    }, 0);
    var avgCharsPerPage = Math.round(totalChars / processedPages.length);
    var pagesWithImages = processedPages.filter(function(page) {
        return page.images && page.images.length > 0;
    }).length;
    
    // Add undo system stats if available
    var undoStats = '';
    if (typeof getUndoStatus === 'function') {
        var undoStatus = getUndoStatus();
        undoStats = 'Undo Stack Size: ' + undoStatus.undoCount + ' actions\n';
    }
    
    content += 'SUMMARY STATISTICS:\n';
    content += '-'.repeat(30) + '\n';
    content += 'Total Characters: ' + totalChars + '\n';
    content += 'Average per Page: ' + avgCharsPerPage + '\n';
    content += 'Pages with Images: ' + pagesWithImages + '\n';
    content += 'Text-only Pages: ' + (processedPages.length - pagesWithImages) + '\n';
    content += undoStats;
    content += '\n' + '='.repeat(70) + '\n\n';

    for (var i = 0; i < processedPages.length; i++) {
        var page = processedPages[i];
        var heightStatus = typeof getPageHeightStatus === 'function' ? 
            getPageHeightStatus(page) : { text: 'Unknown' };
        
        content += 'PAGE ' + page.number + ' [Status: ' + heightStatus.text + ' | ' + (page.characterCount || 0) + ' characters]\n';
        content += '='.repeat(70) + '\n';
        
        // Add image placeholders with enhanced details
        if (page.images && page.images.length > 0) {
            content += 'IMAGES:\n';
            for (var j = 0; j < page.images.length; j++) {
                var img = page.images[j];
                var imgHeight = img.type === 'half' ? '~180px' : '~350px';
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
    a.download = 'book-layout-fixed-semi-independence-flow.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showStatus('Enhanced text file exported successfully!', 'success');
}

// =======================================================================
// CANVA INSTRUCTIONS GENERATION
// =======================================================================

function generateCanvaInstructions() {
    if (!processedPages || processedPages.length === 0) {
        showStatus('No pages to generate instructions for', 'error');
        return;
    }
    
    var instructions = 'Canva Book Layout Instructions - Fixed Semi-Independence Flow System\n';
    instructions += '='.repeat(80) + '\n\n';
    instructions += 'SYSTEM OVERVIEW:\n';
    instructions += 'This layout was generated using a FIXED semi-independence flow system that:\n';
    instructions += '- Processes complete documents without truncation\n';
    instructions += '- Includes working undo/redo (Ctrl+Z/Ctrl+Y)\n';
    instructions += '- Provides "Move Para" to move last paragraph to next page\n';
    instructions += '- Offers "Split Here" to break pages at cursor position\n';
    instructions += '- Respects manual edits while managing automatic text flow\n\n';
    
    instructions += 'BOOK DETAILS:\n';
    instructions += '-'.repeat(20) + '\n';
    instructions += '- Total Pages: ' + processedPages.length + '\n';
    
    // Get settings values
    var bookType = typeof getElementValue === 'function' ? getElementValue('bookType', 'text') : 'text';
    var bookSize = typeof getElementValue === 'function' ? getElementValue('bookSize', 'standard') : 'standard';
    
    instructions += '- Book Type: ' + bookType + '\n';
    instructions += '- Book Size: ' + bookSize + '\n';
    instructions += '- Layout System: Fixed Semi-independence flow with enhanced features\n';
    
    // Add undo stats if available
    if (typeof getUndoStatus === 'function') {
        var undoStatus = getUndoStatus();
        instructions += '- Undo Support: ' + undoStatus.undoCount + ' actions in history\n';
    }
    
    instructions += '- Page Dimensions: True print dimensions with accurate margins\n\n';
    
    instructions += 'ENHANCED FEATURES:\n';
    instructions += '-'.repeat(20) + '\n';
    instructions += '- Complete Document Processing: No content truncation\n';
    instructions += '- Working Undo System: Ctrl+Z/Ctrl+Y for all actions\n';
    instructions += '- Move Para Button: Moves last paragraph to next page\n';
    instructions += '- Split Here Button: Breaks page at cursor position\n';
    instructions += '- Real-time Height Monitoring: Visual page fill indicators\n';
    instructions += '- Smart Paragraph Flow: Respects sentence boundaries\n';
    instructions += '- Content Pull: Automatically fills space when available\n\n';
    
    instructions += 'IMAGE PLACEMENT GUIDE:\n';
    instructions += '-'.repeat(25) + '\n';
    instructions += '- Half-page images: ~180px height, reduce text space by ~200 characters\n';
    instructions += '- Full-page images: ~350px height, reduce text space by ~400 characters\n';
    instructions += '- Images positioned before text in the flow\n';
    instructions += '- Text automatically adjusts around image space\n';
    instructions += '- Each image has unique ID for tracking\n';
    instructions += '- Remove button (×) available in edit mode\n\n';
    
    instructions += 'CANVA SETUP INSTRUCTIONS:\n';
    instructions += '-'.repeat(30) + '\n';
    instructions += '1. Create new design with book dimensions:\n';
    var dimensions = bookSize === 'standard' ? '5.5" × 8.5"' : '8" × 8"';
    instructions += '   - Book Size: ' + dimensions + '\n';
    instructions += '2. Create one Canva page for each book page below\n';
    instructions += '3. Add image placeholders first (they determine text space)\n';
    instructions += '4. Copy text content into text boxes with proper margins\n';
    instructions += '5. Use consistent typography throughout\n';
    instructions += '6. Replace placeholders with actual artwork\n';
    instructions += '7. Review page status indicators for optimal layout\n\n';
    
    instructions += 'KEYBOARD SHORTCUTS:\n';
    instructions += '-'.repeat(20) + '\n';
    instructions += '- Ctrl+Z: Undo last action\n';
    instructions += '- Ctrl+Y: Redo last undone action\n';
    instructions += '- Ctrl+S: Save project (if available)\n';
    instructions += '- Escape: Clear focus/selection\n\n';
    
    instructions += 'PAGE-BY-PAGE CONTENT:\n';
    instructions += '='.repeat(80) + '\n\n';

    for (var i = 0; i < processedPages.length; i++) {
        var page = processedPages[i];
        var heightStatus = typeof getPageHeightStatus === 'function' ? 
            getPageHeightStatus(page) : { text: 'Unknown', class: 'unknown' };
        
        instructions += 'PAGE ' + page.number + ' [' + heightStatus.text + ' fill | ' + (page.characterCount || 0) + ' characters]\n';
        instructions += '='.repeat(60) + '\n\n';
        
        // Enhanced image instructions
        if (page.images && page.images.length > 0) {
            instructions += 'IMAGES TO ADD:\n';
            for (var j = 0; j < page.images.length; j++) {
                var img = page.images[j];
                var imgDetails = img.type === 'half' ? 
                    'Half-page image (~180px height, reduces text by ~200 chars)' :
                    'Full-page image (~350px height, reduces text by ~400 chars)';
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
        instructions += '- Content Type: ' + (page.content && page.content.trim() ? 'Text' : 'Empty') + '\n';
        
        // Add recommendations based on page status
        var recommendations = [];
        if (heightStatus.class === 'optimal') {
            recommendations.push('Good text density - consider adding content or images');
        } else if (heightStatus.class === 'near-full') {
            recommendations.push('Optimal text density - good as is');
        } else if (heightStatus.class === 'overflow') {
            recommendations.push('Page is full - content may have flowed to next page');
        }
        
        if (recommendations.length > 0) {
            instructions += '- Recommendations: ' + recommendations.join(', ') + '\n';
        }
        
        instructions += '\n';
        
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
    a.download = 'canva-instructions-fixed-semi-independence-flow.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    showStatus('Enhanced Canva instructions with all features generated!', 'success');
}

// =======================================================================
// PDF GENERATION
// =======================================================================

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
// EXPORT DEBUGGING AND TESTING
// =======================================================================

function testExportFunctions() {
    console.log('Testing export functions...');
    
    if (!processedPages || processedPages.length === 0) {
        console.log('No pages available for testing exports');
        return;
    }
    
    console.log('Available export functions:');
    console.log('1. copyFormattedPage(0, "text") - Copy first page as text');
    console.log('2. copyFormattedPage(0, "formatted") - Copy first page as Canva format');
    console.log('3. copyAllPages() - Copy all pages');
    console.log('4. exportToText() - Export to downloadable text file');
    console.log('5. generateCanvaInstructions() - Generate Canva instructions file');
    console.log('6. generatePDF() - Open print dialog for PDF');
    
    // Test basic copy function
    if (processedPages[0]) {
        console.log('Testing basic copy function...');
        var testFormat = convertToCanvaFormat(processedPages[0]);
        console.log('Canva format preview:', testFormat.substring(0, 100) + '...');
    }
}

function debugExportSystem() {
    console.log('=== EXPORT SYSTEM DEBUG ===');
    console.log('Browser clipboard support:', !!navigator.clipboard);
    console.log('Pages available:', processedPages ? processedPages.length : 0);
    
    if (processedPages && processedPages.length > 0) {
        var totalChars = processedPages.reduce(function(total, page) {
            return total + page.characterCount;
        }, 0);
        var pagesWithImages = processedPages.filter(function(page) {
            return page.images && page.images.length > 0;
        }).length;
        
        console.log('Total characters:', totalChars);
        console.log('Pages with images:', pagesWithImages);
        console.log('Average chars per page:', Math.round(totalChars / processedPages.length));
    }
    
    console.log('Available functions: copyFormattedPage, copyAllPages, exportToText, generateCanvaInstructions, generatePDF');
    console.log('Test function: testExportFunctions()');
}

// =======================================================================
// GLOBAL EXPORTS
// =======================================================================

// Main export functions
window.copyFormattedPage = copyFormattedPage;
window.copyAllPages = copyAllPages;
window.exportToText = exportToText;
window.generateCanvaInstructions = generateCanvaInstructions;
window.generatePDF = generatePDF;

// Utility functions
window.convertToCanvaFormat = convertToCanvaFormat;

// Debug functions
window.testExportFunctions = testExportFunctions;
window.debugExportSystem = debugExportSystem;

console.log('App-Export.js loaded - Copy and export functions ready');
