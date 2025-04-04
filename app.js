// Register extended fonts and sizes
let Font = Quill.import('formats/font');
Font.whitelist = [
  'sans-serif', 'serif', 'monospace', 'arial', 'times-new-roman',
  'comic-sans-ms', 'courier-new', 'georgia', 'tahoma', 'trebuchet-ms',
  'verdana', 'impact', 'helvetica', 'roboto', 'calibri'
];
Quill.register(Font, true);

let Size = Quill.import('formats/size');
Size.whitelist = ['6px','7px','8px','9px','10px','11px','12px','14px','18px','24px','36px','48px','64px','72px'];
Quill.register(Size, true);

// Custom Image Resize Handler for Quill 2.0
class ImageResizeHandler {
  constructor(quill) {
    this.quill = quill;
    this.currentImage = null;
    this.overlay = null;
    this.resizeHandles = [];
    
    // Initialize the module
    this.initialize();
  }
  
  initialize() {
    // Listen for image clicks in the editor
    this.quill.root.addEventListener('click', (event) => {
      const image = event.target.closest('img');
      if (image) {
        this.selectImage(image);
      } else if (this.currentImage && !event.target.closest('.image-resize-overlay')) {
        this.deselect();
      }
    });
  }
  
  selectImage(image) {
    if (this.currentImage === image) return;
    
    // Deselect any currently selected image
    this.deselect();
    
    // Set current image
    this.currentImage = image;
    
    // Create overlay and resize handles
    this.createOverlay();
  }
  
  deselect() {
    if (!this.currentImage) return;
    
    // Remove overlay and handles
    if (this.overlay) {
      document.body.removeChild(this.overlay);
      this.overlay = null;
    }
    
    this.currentImage = null;
  }
  
  createOverlay() {
    // Get image position and dimensions
    const rect = this.currentImage.getBoundingClientRect();
    
    // Create overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'image-resize-overlay';
    this.overlay.style.position = 'absolute';
    this.overlay.style.top = `${rect.top + window.scrollY}px`;
    this.overlay.style.left = `${rect.left + window.scrollX}px`;
    this.overlay.style.width = `${rect.width}px`;
    this.overlay.style.height = `${rect.height}px`;
    this.overlay.style.border = '1px dashed #3498db';
    this.overlay.style.pointerEvents = 'none';
    this.overlay.style.zIndex = '100';
    
    // Create resize handle
    const handle = document.createElement('div');
    handle.className = 'image-resize-handle';
    handle.style.position = 'absolute';
    handle.style.bottom = '-10px';
    handle.style.right = '-10px';
    handle.style.width = '20px';
    handle.style.height = '20px';
    handle.style.backgroundColor = '#3498db';
    handle.style.cursor = 'nwse-resize';
    handle.style.borderRadius = '50%';
    handle.style.pointerEvents = 'all';
    
    // Add resize functionality
    handle.addEventListener('mousedown', this.startResize.bind(this));
    
    this.overlay.appendChild(handle);
    document.body.appendChild(this.overlay);
  }
  
  startResize(event) {
    event.preventDefault();
    
    const startX = event.clientX;
    const startY = event.clientY;
    const startWidth = this.currentImage.width;
    const startHeight = this.currentImage.height;
    
    const moveHandler = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Calculate new dimensions while maintaining aspect ratio
      const aspectRatio = startWidth / startHeight;
      let newWidth = startWidth + deltaX;
      let newHeight = newWidth / aspectRatio;
      
      // Update image size
      this.currentImage.width = newWidth;
      this.currentImage.height = newHeight;
      
      // Update overlay position and size
      this.overlay.style.width = `${newWidth}px`;
      this.overlay.style.height = `${newHeight}px`;
    };
    
    const upHandler = () => {
      document.removeEventListener('mousemove', moveHandler);
      document.removeEventListener('mouseup', upHandler);
    };
    
    document.addEventListener('mousemove', moveHandler);
    document.addEventListener('mouseup', upHandler);
  }
}

// Initialize Quill editor with history
let quill = new Quill('#editor', {
  modules: {
    toolbar: '#toolbar',
    history: { delay: 1000, maxStack: 50, userOnly: true }
  },
  theme: 'snow'
});

// Initialize custom image resize handler
const imageResizeHandler = new ImageResizeHandler(quill);

// Add keyboard event handler for deleting images and tables with Delete key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Delete') {
    const range = quill.getSelection();
    if (!range) return;
    
    // Check if an image is currently selected
    if (imageResizeHandler.currentImage) {
      // Remove the image
      imageResizeHandler.currentImage.remove();
      imageResizeHandler.deselect();
      e.preventDefault();
      return;
    }
    
    // Check if a table or inside a table
    const [table, tableCell] = findTableOrCell(range.index);
    if (table) {
      // If inside a table cell with text selected, let the default behavior handle it
      if (tableCell && range.length > 0) return;
      
      // Otherwise, remove the entire table
      table.remove();
      e.preventDefault();
    }
  }
});

// Helper function to find a table or table cell at a given position
function findTableOrCell(index) {
  const [leaf, offset] = quill.getLeaf(index);
  if (!leaf) return [null, null];
  
  let node = leaf.domNode;
  let table = null;
  let cell = null;
  
  // Traverse up the DOM to find table or cell
  while (node && node !== quill.root) {
    if (node.tagName === 'TABLE') {
      table = node;
    }
    if (node.tagName === 'TD' || node.tagName === 'TH') {
      cell = node;
    }
    node = node.parentNode;
  }
  
  return [table, cell];
}

const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');

if (undoBtn) {
  undoBtn.addEventListener('click', () => {    
    quill.history.undo();    
  });
}

if (redoBtn) {
  redoBtn.addEventListener('click', () => {
    quill.history.redo();
  });
}

document.getElementById('themeToggle').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const editorEl = document.getElementById('editor');
  
  // Apply appropriate text colors based on theme
  updateEditorColors();
});

// Page background color via hidden color input triggered by "Page Color" button
document.getElementById('pageColorBtn').addEventListener('click', () => {
  const colorInput = document.getElementById('hiddenPageColor');
  // Position offscreen and trigger native color picker
  colorInput.style.position = 'absolute';
  colorInput.style.left = '-9999px';
  colorInput.style.opacity = '0';
  colorInput.click();
});

document.getElementById('hiddenPageColor').addEventListener('change', (e) => {
  const color = e.target.value;
  document.getElementById('paper').style.background = color;
});

// Margin adjustment
const pxPerMm = 3.78;
let marginTop = 10, marginBottom = 10, marginLeft = 10, marginRight = 10;
const paper = document.getElementById('paper');
const editorContainer = document.getElementById('editorContainer');
const paperWidthPx = 210 * pxPerMm;
const paperHeightPx = 297 * pxPerMm;
const handleTop = document.getElementById('handleTop');
const handleBottom = document.getElementById('handleBottom');
const handleLeft = document.getElementById('handleLeft');
const handleRight = document.getElementById('handleRight');

function updateLayout() {
  const tPx = marginTop * pxPerMm;
  const bPx = marginBottom * pxPerMm;
  const lPx = marginLeft * pxPerMm;
  const rPx = marginRight * pxPerMm;

  // Set inner padding on #editorContainer
  editorContainer.style.paddingTop    = tPx + "px";
  editorContainer.style.paddingBottom = bPx + "px";
  editorContainer.style.paddingLeft   = lPx + "px";
  editorContainer.style.paddingRight  = rPx + "px";

  // Position handles relative to the paper
  handleTop.style.position = "absolute";
  handleTop.style.left   = "0px";
  handleTop.style.right  = "0px";
  handleTop.style.top    = tPx + "px";

  handleBottom.style.position = "absolute";
  handleBottom.style.left   = "0px";
  handleBottom.style.right  = "0px";
  handleBottom.style.bottom = bPx + "px";

  handleLeft.style.position = "absolute";
  handleLeft.style.top    = "0px";
  handleLeft.style.bottom = "0px";
  handleLeft.style.left   = lPx + "px";

  handleRight.style.position = "absolute";
  handleRight.style.top    = "0px";
  handleRight.style.bottom = "0px";
  handleRight.style.right  = rPx + "px";

  // Adjust drawingCanvas size
  const canvas = document.getElementById('drawingCanvas');
  if (canvas) {
    canvas.width = paper.offsetWidth;
    canvas.height = paper.offsetHeight;
  }
}

let activeHandle = null, startMouseX = 0, startMouseY = 0;
let startMarginTop, startMarginBottom, startMarginLeft, startMarginRight;

function onMouseMove(e) {
  if (!activeHandle) return;
  const deltaY = e.clientY - startMouseY;
  const deltaX = e.clientX - startMouseX;
  switch(activeHandle) {
    case 'top':
      let newTopPx = (startMarginTop * pxPerMm) + deltaY;
      if (newTopPx < 0) newTopPx = 0;
      marginTop = newTopPx / pxPerMm;
      break;
    case 'bottom':
      let newBottomPx = (startMarginBottom * pxPerMm) - deltaY;
      if (newBottomPx < 0) newBottomPx = 0;
      marginBottom = newBottomPx / pxPerMm;
      break;
    case 'left':
      let newLeftPx = (startMarginLeft * pxPerMm) + deltaX;
      if (newLeftPx < 0) newLeftPx = 0;
      marginLeft = newLeftPx / pxPerMm;
      break;
    case 'right':
      let newRightPx = (startMarginRight * pxPerMm) - deltaX;
      if (newRightPx < 0) newRightPx = 0;
      marginRight = newRightPx / pxPerMm;
      break;
  }
  updateLayout();
}

function onMouseUp() {
  activeHandle = null;
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);
}

function initHandle(elem, name) {
  elem.addEventListener('mousedown', (e) => {
    e.preventDefault();
    activeHandle = name;
    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startMarginTop = marginTop;
    startMarginBottom = marginBottom;
    startMarginLeft = marginLeft;
    startMarginRight = marginRight;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });
}

initHandle(handleTop, 'top');
initHandle(handleBottom, 'bottom');
initHandle(handleLeft, 'left');
initHandle(handleRight, 'right');
updateLayout();

// ---------------------- Drawing Functionality ----------------------

// Global drawing variables
let drawingMode = false;
let currentShape = 'freehand'; // 'freehand', 'line', 'eraser', 'rectangle', 'circle', etc.
let isDrawing = false;
let startX = 0, startY = 0;
let currentPath = [];
let shapes = [];
let drawingHistory = [];
let redoStack = [];
let selectedShapeIndex = -1; // Track the currently selected shape
let isDragging = false; // Flag indicating if we're dragging a shape
let dragStartX = 0, dragStartY = 0; // Starting position for drag

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// Advanced drawing settings
let penSettings = {
  size: 2,
  color: "#000000",
  opacity: 100,
  style: "solid"
};

let lineSettings = {
  size: 2,
  color: "#000000",
  opacity: 100,
  style: "solid",
  arrow: "none"
};

let eraserSettings = {
  size: 10,
  precise: false
};

let shapeSettings = {
  type: "rectangle",
  strokeSize: 2,
  strokeColor: "#000000",
  fillColor: "#ffffff",
  filled: true
};

// Function to update UI based on current settings
function updateDrawingPanelUI() {
  // Pen tab
  document.getElementById('penSize').value = penSettings.size;
  document.getElementById('penSizeValue').textContent = penSettings.size + 'px';
  document.getElementById('penColor').value = penSettings.color;
  document.getElementById('penOpacity').value = penSettings.opacity;
  document.getElementById('penOpacityValue').textContent = penSettings.opacity + '%';
  document.getElementById('penStyle').value = penSettings.style;
  
  // Line tab
  document.getElementById('lineSize').value = lineSettings.size;
  document.getElementById('lineSizeValue').textContent = lineSettings.size + 'px';
  document.getElementById('lineColor').value = lineSettings.color;
  document.getElementById('lineOpacity').value = lineSettings.opacity;
  document.getElementById('lineOpacityValue').textContent = lineSettings.opacity + '%';
  document.getElementById('lineStyle').value = lineSettings.style;
  document.getElementById('lineArrow').value = lineSettings.arrow;
  
  // Eraser tab
  document.getElementById('eraserSize').value = eraserSettings.size;
  document.getElementById('eraserSizeValue').textContent = eraserSettings.size + 'px';
  document.getElementById('preciseEraser').checked = eraserSettings.precise;
  
  // Shapes tab
  document.querySelectorAll('.shape-option').forEach(option => {
    option.classList.remove('active');
    if (option.getAttribute('data-shape') === shapeSettings.type) {
      option.classList.add('active');
    }
  });
  document.getElementById('shapeStrokeSize').value = shapeSettings.strokeSize;
  document.getElementById('shapeStrokeSizeValue').textContent = shapeSettings.strokeSize + 'px';
  document.getElementById('shapeStrokeColor').value = shapeSettings.strokeColor;
  document.getElementById('shapeFillColor').value = shapeSettings.fillColor;
  document.getElementById('shapeFilled').checked = shapeSettings.filled;
}

// Function to read values from UI and update settings
function readDrawingPanelValues() {
  // Determine which tab is active to update the appropriate settings
  const activeTab = document.querySelector('.drawing-panel .tab-btn.active').getAttribute('data-tab');
  
  if (activeTab === 'pen') {
    penSettings.size = parseInt(document.getElementById('penSize').value);
    penSettings.color = document.getElementById('penColor').value;
    penSettings.opacity = parseInt(document.getElementById('penOpacity').value);
    penSettings.style = document.getElementById('penStyle').value;
    currentShape = 'freehand';
    customFreehandLineWidth = penSettings.size;
    customFreehandLineColor = penSettings.color;
  } 
  else if (activeTab === 'line') {
    lineSettings.size = parseInt(document.getElementById('lineSize').value);
    lineSettings.color = document.getElementById('lineColor').value;
    lineSettings.opacity = parseInt(document.getElementById('lineOpacity').value);
    lineSettings.style = document.getElementById('lineStyle').value;
    lineSettings.arrow = document.getElementById('lineArrow').value;
    currentShape = 'line';
    customLineWidth = lineSettings.size;
    customLineColor = lineSettings.color;
  } 
  else if (activeTab === 'eraser') {
    eraserSettings.size = parseInt(document.getElementById('eraserSize').value);
    eraserSettings.precise = document.getElementById('preciseEraser').checked;
    currentShape = 'eraser';
    eraserLineWidth = eraserSettings.size;
  } 
  else if (activeTab === 'shapes') {
    shapeSettings.strokeSize = parseInt(document.getElementById('shapeStrokeSize').value);
    shapeSettings.strokeColor = document.getElementById('shapeStrokeColor').value;
    shapeSettings.fillColor = document.getElementById('shapeFillColor').value;
    shapeSettings.filled = document.getElementById('shapeFilled').checked;
    
    // Get the active shape type
    const activeShapeOption = document.querySelector('.shape-option.active');
    if (activeShapeOption) {
      shapeSettings.type = activeShapeOption.getAttribute('data-shape');
      currentShape = shapeSettings.type;
    }
  }
}

// Setup event listeners for drawing panel
function setupDrawingPanelListeners() {
  // Pen size slider
  document.getElementById('penSize').addEventListener('input', (e) => {
    document.getElementById('penSizeValue').textContent = e.target.value + 'px';
  });
  
  // Pen opacity slider
  document.getElementById('penOpacity').addEventListener('input', (e) => {
    document.getElementById('penOpacityValue').textContent = e.target.value + '%';
  });
  
  // Line size slider
  document.getElementById('lineSize').addEventListener('input', (e) => {
    document.getElementById('lineSizeValue').textContent = e.target.value + 'px';
  });
  
  // Line opacity slider
  document.getElementById('lineOpacity').addEventListener('input', (e) => {
    document.getElementById('lineOpacityValue').textContent = e.target.value + '%';
  });
  
  // Eraser size slider
  document.getElementById('eraserSize').addEventListener('input', (e) => {
    document.getElementById('eraserSizeValue').textContent = e.target.value + 'px';
  });
  
  // Shape stroke size slider
  document.getElementById('shapeStrokeSize').addEventListener('input', (e) => {
    document.getElementById('shapeStrokeSizeValue').textContent = e.target.value + 'px';
  });
  
  // Shape options click handlers
  document.querySelectorAll('.shape-option').forEach(option => {
    option.addEventListener('click', () => {
      document.querySelectorAll('.shape-option').forEach(o => o.classList.remove('active'));
      option.classList.add('active');
      shapeSettings.type = option.getAttribute('data-shape');
    });
  });
  
  // Tab switching for drawing panel
  document.querySelectorAll('.drawing-panel .tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all tabs
      document.querySelectorAll('.drawing-panel .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.drawing-panel .tab-content').forEach(c => c.classList.remove('active'));
      
      // Add active class to current tab
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(tabId + 'Tab').classList.add('active');
    });
  });
  
  // Clear all drawings button
  document.getElementById('clearAllDrawing').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear all drawings?')) {
      // Save current state to history before clearing
      drawingHistory.push([...shapes]);
      redoStack = [];
      
      shapes = [];
      redrawCanvas();
    }
  });
  
  // Undo drawing action
  document.getElementById('undoDrawing').addEventListener('click', () => {
    if (drawingHistory.length > 0) {
      redoStack.push([...shapes]);
      shapes = drawingHistory.pop();
      redrawCanvas();
    }
  });
  
  // Redo drawing action
  document.getElementById('redoDrawing').addEventListener('click', () => {
    if (redoStack.length > 0) {
      drawingHistory.push([...shapes]);
      shapes = redoStack.pop();
      redrawCanvas();
    }
  });
  
  // Apply drawing settings and close panel
  document.getElementById('applyDrawingSettings').addEventListener('click', () => {
    readDrawingPanelValues();
    drawingMode = true;
    canvas.style.pointerEvents = 'auto';
    quill.enable(false);
    document.getElementById('drawingPanel').style.display = 'none';
    updateDrawingButtons();
  });
  
  // Close drawing panel without applying
  document.getElementById('closeDrawingPanel').addEventListener('click', () => {
    document.getElementById('drawingPanel').style.display = 'none';
  });
}

// Function to update active state of drawing buttons
function updateDrawingButtons() {
  const freehandBtn = document.getElementById('toggleDraw');
  const lineBtn = document.getElementById('drawLine');
  const eraserBtn = document.getElementById('clearDrawing');
  const textBtn = document.getElementById('toggleTextMode');
  
  // Remove active class from all
  freehandBtn.classList.remove('active');
  lineBtn.classList.remove('active');
  eraserBtn.classList.remove('active');
  textBtn.classList.remove('active');

  if (!drawingMode) {
    textBtn.classList.add('active');
    return;
  }

  if (currentShape === 'freehand') {
    freehandBtn.classList.add('active');
  } else if (currentShape === 'line') {
    lineBtn.classList.add('active');
  } else if (currentShape === 'eraser') {
    eraserBtn.classList.add('active');
  }
}

// Call setup when the page loads
window.addEventListener('load', setupDrawingPanelListeners);

// Update the existing drawing button event listeners to open the panel

// Replace existing toggleDraw event listener
document.getElementById('toggleDraw').addEventListener('click', () => {
  if (drawingMode && currentShape === 'freehand') {
    // Drawing is already active - turn it off
    drawingMode = false;
    canvas.style.pointerEvents = 'none';
    quill.enable(true);
    updateDrawingButtons();
    return;
  }
  
  // Turn on drawing mode with pen
  currentShape = 'freehand';
  document.getElementById('drawingPanel').style.display = 'block';
  
  // Make sure pen tab is active
  document.querySelectorAll('.drawing-panel .tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === 'pen') {
      btn.classList.add('active');
    }
  });
  
  document.querySelectorAll('.drawing-panel .tab-content').forEach(content => {
    content.classList.remove('active');
    if (content.id === 'penTab') {
      content.classList.add('active');
    }
  });
  
  updateDrawingPanelUI();
});

// Replace existing drawLine event listener
document.getElementById('drawLine').addEventListener('click', () => {
  if (drawingMode && currentShape === 'line') {
    // Line drawing is already active - turn it off
    drawingMode = false;
    canvas.style.pointerEvents = 'none';
    quill.enable(true);
    updateDrawingButtons();
    return;
  }
  
  // Turn on line drawing mode
  currentShape = 'line';
  document.getElementById('drawingPanel').style.display = 'block';
  
  // Make sure line tab is active
  document.querySelectorAll('.drawing-panel .tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === 'line') {
      btn.classList.add('active');
    }
  });
  
  document.querySelectorAll('.drawing-panel .tab-content').forEach(content => {
    content.classList.remove('active');
    if (content.id === 'lineTab') {
      content.classList.add('active');
    }
  });
  
  updateDrawingPanelUI();
});

// Replace existing clearDrawing (eraser) event listener
document.getElementById('clearDrawing').addEventListener('click', () => {
  if (drawingMode && currentShape === 'eraser') {
    // Eraser is already active - turn it off
    drawingMode = false;
    canvas.style.pointerEvents = 'none';
    quill.enable(true);
    updateDrawingButtons();
    return;
  }
  
  if (isDrawing) {
    isDrawing = false;
    // Save the current stroke before switching modes
    shapes.push({
      type: currentShape,
      path: currentPath.slice(),
      lineWidth: (currentShape === 'eraser') ? eraserSettings.size : undefined
    });
    currentPath = [];
    // Save state to history
    drawingHistory.push([...shapes]);
    redoStack = [];
  }
  
  currentShape = 'eraser';
  document.getElementById('drawingPanel').style.display = 'block';
  
  // Make sure eraser tab is active
  document.querySelectorAll('.drawing-panel .tab-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-tab') === 'eraser') {
      btn.classList.add('active');
    }
  });
  
  document.querySelectorAll('.drawing-panel .tab-content').forEach(content => {
    content.classList.remove('active');
    if (content.id === 'eraserTab') {
      content.classList.add('active');
    }
  });
  
  updateDrawingPanelUI();
});

// Enhanced canvas event listeners to handle new shape types
canvas.addEventListener('mousedown', (e) => {
  if (!drawingMode) return;
  
  const rect = canvas.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;
  
  // If not currently drawing, check if we clicked on a shape
  if (!isDrawing) {
    // Check in reverse order (newest shapes first)
    for (let i = shapes.length - 1; i >= 0; i--) {
      if (isPointInShape(clickX, clickY, shapes[i])) {
        selectedShapeIndex = i;
        
        // Initialize dragging
        isDragging = true;
        dragStartX = clickX;
        dragStartY = clickY;
        
        redrawCanvas(); // Redraw to show selection
        return;
      }
    }
    // If we get here, no shape was clicked
    selectedShapeIndex = -1;
  }
  
  if (!isDragging) {
    isDrawing = true;
    startX = clickX;
    startY = clickY;
    
    // Save the current state for undo
    drawingHistory.push([...shapes]);
    redoStack = [];
    
    if (currentShape === 'freehand' || currentShape === 'eraser') {
      currentPath = [{ x: startX, y: startY }];
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawingMode) return;
  
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  // Handle shape dragging
  if (isDragging && selectedShapeIndex !== -1) {
    const deltaX = x - dragStartX;
    const deltaY = y - dragStartY;
    
    // Move the selected shape
    const shape = shapes[selectedShapeIndex];
    moveShape(shape, deltaX, deltaY);
    
    // Update drag start position
    dragStartX = x;
    dragStartY = y;
    
    redrawCanvas();
    return;
  }
  
  // Handle drawing
  if (isDrawing) {
    redrawCanvas();
    
    if (currentShape === 'freehand' || currentShape === 'eraser') {
      currentPath.push({ x, y });
      drawFreehand(currentPath, currentShape);
    } else if (currentShape === 'line') {
      drawLine(startX, startY, x, y, lineSettings);
    } else if (currentShape === 'rectangle') {
      drawRectangle(startX, startY, x, y, shapeSettings);
    } else if (currentShape === 'circle') {
      drawCircle(startX, startY, x, y, shapeSettings);
    } else if (currentShape === 'triangle') {
      drawTriangle(startX, startY, x, y, shapeSettings);
    } else if (currentShape === 'arrow') {
      drawArrow(startX, startY, x, y, shapeSettings);
    }
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (!drawingMode) return;
  
  // Handle drag end
  if (isDragging) {
    isDragging = false;
    
    // Save state to history after drag completion
    drawingHistory.push([...shapes]);
    redoStack = [];
    return;
  }
  
  if (!isDrawing) return;
  isDrawing = false;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  
  let shape;
  
  if (currentShape === 'freehand') {
    shape = { 
      type: 'freehand', 
      path: currentPath.slice(), 
      lineWidth: penSettings.size, 
      lineColor: applyOpacity(penSettings.color, penSettings.opacity),
      style: penSettings.style
    };
  } else if (currentShape === 'line') {
    shape = { 
      type: 'line', 
      startX, startY, 
      endX: x, endY: y, 
      lineWidth: lineSettings.size, 
      lineColor: applyOpacity(lineSettings.color, lineSettings.opacity),
      style: lineSettings.style,
      arrow: lineSettings.arrow
    };
  } else if (currentShape === 'eraser') {
    shape = { 
      type: 'eraser', 
      path: currentPath.slice(), 
      lineWidth: eraserSettings.size,
      precise: eraserSettings.precise
    };
  } else if (currentShape === 'rectangle' || currentShape === 'circle' || 
             currentShape === 'triangle' || currentShape === 'arrow') {
    shape = {
      type: currentShape,
      startX, startY,
      endX: x, endY: y,
      strokeWidth: shapeSettings.strokeSize,
      strokeColor: shapeSettings.strokeColor,
      fillColor: shapeSettings.fillColor,
      filled: shapeSettings.filled
    };
  }
  
  shapes.push(shape);
  redrawCanvas();
});

// Helper function to apply opacity to a color
function applyOpacity(color, opacity) {
  if (opacity === 100) return color;
  
  // Convert hex to rgba
  let r = parseInt(color.substr(1, 2), 16);
  let g = parseInt(color.substr(3, 2), 16);
  let b = parseInt(color.substr(5, 2), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

// Enhanced drawing functions for different shapes and styles
function drawFreehand(path, mode = 'freehand', lineWidth, lineColor, lineStyle, isSelected) {
  if (path.length < 2) return;
  
  ctx.save();
  if (mode === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = lineWidth || eraserSettings.size;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = lineWidth || penSettings.size;
    ctx.strokeStyle = lineColor || applyOpacity(penSettings.color, penSettings.opacity);
    
    // Apply line style
    const style = lineStyle || penSettings.style;
    if (style === 'dashed') {
      ctx.setLineDash([ctx.lineWidth * 2, ctx.lineWidth]);
    } else if (style === 'dotted') {
      ctx.setLineDash([ctx.lineWidth, ctx.lineWidth * 1.5]);
    } else {
      ctx.setLineDash([]);
    }
  }
  
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
  
  // Draw selection indicator if this shape is selected
  if (isSelected) {
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawLine(x1, y1, x2, y2, settings, isSelected) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineWidth = settings.size;
  ctx.strokeStyle = applyOpacity(settings.color, settings.opacity);
  
  // Apply line style
  if (settings.style === 'dashed') {
    ctx.setLineDash([settings.size * 2, settings.size]);
  } else if (settings.style === 'dotted') {
    ctx.setLineDash([settings.size, settings.size * 1.5]);
  } else {
    ctx.setLineDash([]);
  }
  
  ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Draw selection indicator if this shape is selected
  if (isSelected) {
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
  }
  
  // Draw arrow if needed
  if (settings.arrow !== 'none') {
    const arrowSize = settings.size * 5;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    
    if (settings.arrow === 'end' || settings.arrow === 'both') {
      drawArrowhead(x2, y2, angle, arrowSize, settings.color, settings.opacity);
    }
    
    if (settings.arrow === 'start' || settings.arrow === 'both') {
      drawArrowhead(x1, y1, angle + Math.PI, arrowSize, settings.color, settings.opacity);
    }
  }
  
  ctx.restore();
}

function drawArrowhead(x, y, angle, size, color, opacity) {
  ctx.save();
  ctx.fillStyle = applyOpacity(color, opacity);
  
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size / 2);
  ctx.lineTo(-size, size / 2);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

function drawRectangle(x1, y1, x2, y2, settings, isSelected) {
  const width = x2 - x1;
  const height = y2 - y1;
  
  ctx.save();
  ctx.lineWidth = settings.strokeSize;
  ctx.strokeStyle = settings.strokeColor;
  
  if (settings.filled) {
    ctx.fillStyle = settings.fillColor;
  }
  
  ctx.beginPath();
  ctx.rect(x1, y1, width, height);
  
  if (settings.filled) {
    ctx.fill();
  }
  
  ctx.stroke();
  
  // Draw selection indicator if this shape is selected
  if (isSelected) {
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawCircle(x1, y1, x2, y2, settings, isSelected) {
  const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  
  ctx.save();
  ctx.lineWidth = settings.strokeSize;
  ctx.strokeStyle = settings.strokeColor;
  
  if (settings.filled) {
    ctx.fillStyle = settings.fillColor;
  }
  
  ctx.beginPath();
  ctx.arc(x1, y1, radius, 0, Math.PI * 2);
  
  if (settings.filled) {
    ctx.fill();
  }
  
  ctx.stroke();
  
  // Draw selection indicator if this shape is selected
  if (isSelected) {
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawTriangle(x1, y1, x2, y2, settings, isSelected) {
  // Calculate triangle points
  const height = y2 - y1;
  const width = x2 - x1;
  
  ctx.save();
  ctx.lineWidth = settings.strokeSize;
  ctx.strokeStyle = settings.strokeColor;
  
  if (settings.filled) {
    ctx.fillStyle = settings.fillColor;
  }
  
  ctx.beginPath();
  ctx.moveTo(x1, y2); // Bottom-left
  ctx.lineTo(x1 + width / 2, y1); // Top-middle
  ctx.lineTo(x2, y2); // Bottom-right
  ctx.closePath();
  
  if (settings.filled) {
    ctx.fill();
  }
  
  ctx.stroke();
  
  // Draw selection indicator if this shape is selected
  if (isSelected) {
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
  }
  
  ctx.restore();
}

function drawArrow(x1, y1, x2, y2, settings, isSelected) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  const arrowSize = Math.min(settings.strokeSize * 5, length / 3);
  
  ctx.save();
  ctx.lineWidth = settings.strokeSize;
  ctx.strokeStyle = settings.strokeColor;
  
  if (settings.filled) {
    ctx.fillStyle = settings.fillColor;
  }
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  
  // Draw arrowhead
  ctx.translate(x2, y2);
  ctx.rotate(angle);
  
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-arrowSize, -arrowSize / 2);
  ctx.lineTo(-arrowSize, arrowSize / 2);
  ctx.closePath();
  
  if (settings.filled) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
  
  // Draw selection indicator if this shape is selected
  if (isSelected) {
    ctx.strokeStyle = '#4361ee';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
  }
  
  ctx.restore();
}

// Enhanced redrawCanvas function
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw shapes based on their type
  shapes.forEach(shape => {
    if (shape.type === 'freehand') {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = shape.lineWidth || penSettings.size;
      ctx.strokeStyle = shape.lineColor || applyOpacity(penSettings.color, penSettings.opacity);
      
      // Apply line style
      if (shape.style === 'dashed') {
        ctx.setLineDash([shape.lineWidth * 2, shape.lineWidth]);
      } else if (shape.style === 'dotted') {
        ctx.setLineDash([shape.lineWidth, shape.lineWidth * 1.5]);
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.beginPath();
      ctx.moveTo(shape.path[0].x, shape.path[0].y);
      for (let i = 1; i < shape.path.length; i++) {
        ctx.lineTo(shape.path[i].x, shape.path[i].y);
      }
      ctx.stroke();
      ctx.restore();
    } else if (shape.type === 'line') {
      drawLine(
        shape.startX, 
        shape.startY, 
        shape.endX, 
        shape.endY, 
        {
          size: shape.lineWidth || lineSettings.size,
          color: shape.lineColor || lineSettings.color,
          opacity: lineSettings.opacity,
          style: shape.style || lineSettings.style,
          arrow: shape.arrow || lineSettings.arrow
        },
        selectedShapeIndex === shapes.indexOf(shape)
      );
    } else if (shape.type === 'rectangle') {
      drawRectangle(
        shape.startX,
        shape.startY,
        shape.endX,
        shape.endY,
        {
          strokeSize: shape.strokeWidth || shapeSettings.strokeSize,
          strokeColor: shape.strokeColor || shapeSettings.strokeColor,
          fillColor: shape.fillColor || shapeSettings.fillColor,
          filled: shape.filled !== undefined ? shape.filled : shapeSettings.filled
        },
        selectedShapeIndex === shapes.indexOf(shape)
      );
    } else if (shape.type === 'circle') {
      drawCircle(
        shape.startX,
        shape.startY,
        shape.endX,
        shape.endY,
        {
          strokeSize: shape.strokeWidth || shapeSettings.strokeSize,
          strokeColor: shape.strokeColor || shapeSettings.strokeColor,
          fillColor: shape.fillColor || shapeSettings.fillColor,
          filled: shape.filled !== undefined ? shape.filled : shapeSettings.filled
        },
        selectedShapeIndex === shapes.indexOf(shape)
      );
    } else if (shape.type === 'triangle') {
      drawTriangle(
        shape.startX,
        shape.startY,
        shape.endX,
        shape.endY,
        {
          strokeSize: shape.strokeWidth || shapeSettings.strokeSize,
          strokeColor: shape.strokeColor || shapeSettings.strokeColor,
          fillColor: shape.fillColor || shapeSettings.fillColor,
          filled: shape.filled !== undefined ? shape.filled : shapeSettings.filled
        },
        selectedShapeIndex === shapes.indexOf(shape)
      );
    } else if (shape.type === 'arrow') {
      drawArrow(
        shape.startX,
        shape.startY,
        shape.endX,
        shape.endY,
        {
          strokeSize: shape.strokeWidth || shapeSettings.strokeSize,
          strokeColor: shape.strokeColor || shapeSettings.strokeColor,
          fillColor: shape.fillColor || shapeSettings.fillColor,
          filled: shape.filled !== undefined ? shape.filled : shapeSettings.filled
        },
        selectedShapeIndex === shapes.indexOf(shape)
      );
    }
  });
  
  // Apply eraser strokes last
  shapes.forEach(shape => {
    if (shape.type === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = shape.lineWidth || eraserSettings.size;
      ctx.beginPath();
      ctx.moveTo(shape.path[0].x, shape.path[0].y);
      for (let i = 1; i < shape.path.length; i++) {
        ctx.lineTo(shape.path[i].x, shape.path[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  });
}

document.getElementById("exportPDF").addEventListener("click", createPdf);

function createPdf() {
  const paperEl = document.getElementById("paper");
  const handles = [
    document.getElementById('handleTop'),
    document.getElementById('handleBottom'),
    document.getElementById('handleLeft'),
    document.getElementById('handleRight')
  ];
  handles.forEach(h => h.style.display = "none");

  // Save the original background-image and border from paperEl
  const oldBgImage = paperEl.style.backgroundImage;
  paperEl.style.backgroundImage = "none"; // removes gradient

  // Get computed backgroundColor
  const computedBg = window.getComputedStyle(paperEl).backgroundColor;

  // Remove border from editor (as in original code)
  const editorEl = document.querySelector(".ql-container");
  const oldBorder = editorEl.style.border;
  editorEl.style.border = "none";

  setTimeout(() => {
    html2canvas(paperEl, { backgroundColor: computedBg })
      .then(canvas => {
        // Restore original settings
        handles.forEach(h => h.style.display = "");
        editorEl.style.border = oldBorder;
        paperEl.style.backgroundImage = oldBgImage;
        
        if (!canvas.width || !canvas.height) {
          console.error("Canvas dimensions are zero. Screenshot failed.");
          return;
        }
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ orientation: "p", unit: "pt", format: "a4" });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let position = 0;
        let heightLeft = imgHeight;
        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = -(imgHeight - heightLeft);
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.save("Document.pdf");
      })
      .catch(err => {
        handles.forEach(h => h.style.display = "");
        editorEl.style.border = oldBorder;
        paperEl.style.backgroundImage = oldBgImage;
        console.error("Screenshot failed:", err);
      });
  }, 100);
}

document.getElementById('newDocument').addEventListener('click', () => {
  quill.setContents([]);
  shapes = [];
  redrawCanvas();
});

window.addEventListener('load', () => {
  const toolbarButtons = document.querySelectorAll('#toolbar button');
  const altTextMapping = {
    'ql-bold': 'Bold',
    'ql-italic': 'Italic',
    'ql-underline': 'Underline',
    'ql-strike': 'Strike Through',
    'ql-color': 'Text Color',
    'ql-background': 'Background Color',
    'ql-list': 'List',
    'ql-indent': 'Indent',
    'ql-align': 'Text Alignment',
    'ql-link': 'Insert Link',
    'ql-image': 'Insert Image',
    'ql-video': 'Insert Video',
    'ql-clean': 'Clear Formatting'
  };
  toolbarButtons.forEach(btn => {
    for (const key in altTextMapping) {
      if (btn.classList.contains(key) && !btn.title) {
        btn.title = altTextMapping[key];
      }
    }
  });  
});

// Editor settings - Expanded with heading colors
let h1Size = 32, h2Size = 28, h3Size = 24, h4Size = 20, h5Size = 18, h6Size = 16;
let normalSize = 14, indentSize = 20;
let editorFontColor = "#000000";
let h1Color = "#000000", h2Color = "#000000", h3Color = "#000000";
let h4Color = "#000000", h5Color = "#000000", h6Color = "#000000";
let linkColor = "#0000FF";
let fontFamily = "Arial, sans-serif";
let h1Font = "inherit";
let headingWeight = "bold";

// Tab navigation functionality
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    // Remove active class from all tabs
    tabButtons.forEach(b => b.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    
    // Add active class to current tab
    btn.classList.add('active');
    const tabId = btn.getAttribute('data-tab');
    document.getElementById(tabId + 'Tab').classList.add('active');
  });
});

// Settings panel toggle
document.getElementById('settingsBtn').addEventListener('click', () => {
  document.getElementById('settingsPanel').style.display = "block";
  loadSettings();
});

document.getElementById('closeSettings').addEventListener('click', () => {
  document.getElementById('settingsPanel').style.display = "none";
});

// Function to load current settings into the form
function loadSettings() {
  // Set form values from variables
  document.getElementById('h1Size').value = h1Size;
  document.getElementById('h2Size').value = h2Size;
  document.getElementById('h3Size').value = h3Size;
  document.getElementById('h4Size').value = h4Size;
  document.getElementById('h5Size').value = h5Size;
  document.getElementById('h6Size').value = h6Size;
  document.getElementById('normalSize').value = normalSize;
  document.getElementById('indent').value = indentSize;
  
  document.getElementById('fontColor').value = editorFontColor;
  document.getElementById('h1Color').value = h1Color;
  document.getElementById('h2Color').value = h2Color;
  document.getElementById('h3Color').value = h3Color;
  document.getElementById('h4Color').value = h4Color;
  document.getElementById('h5Color').value = h5Color;
  document.getElementById('h6Color').value = h6Color;
  document.getElementById('linkColor').value = linkColor;
  
  document.getElementById('fontFamily').value = fontFamily;
  document.getElementById('h1Font').value = h1Font;
  document.getElementById('headingWeight').value = headingWeight;
}

// Apply editor settings on save
document.getElementById('saveSettings').addEventListener('click', () => {
  // Get values from form
  h1Size = parseInt(document.getElementById('h1Size').value, 10);
  h2Size = parseInt(document.getElementById('h2Size').value, 10);
  h3Size = parseInt(document.getElementById('h3Size').value, 10);
  h4Size = parseInt(document.getElementById('h4Size').value, 10);
  h5Size = parseInt(document.getElementById('h5Size').value, 10);
  h6Size = parseInt(document.getElementById('h6Size').value, 10);
  normalSize = parseInt(document.getElementById('normalSize').value, 10);
  indentSize = parseInt(document.getElementById('indent').value, 10);
  
  editorFontColor = document.getElementById('fontColor').value;
  h1Color = document.getElementById('h1Color').value;
  h2Color = document.getElementById('h2Color').value;
  h3Color = document.getElementById('h3Color').value;
  h4Color = document.getElementById('h4Color').value;
  h5Color = document.getElementById('h5Color').value;
  h6Color = document.getElementById('h6Color').value;
  linkColor = document.getElementById('linkColor').value;
  
  fontFamily = document.getElementById('fontFamily').value;
  h1Font = document.getElementById('h1Font').value;
  headingWeight = document.getElementById('headingWeight').value;
  
  // Apply settings
  updateEditorStyles();
  
  // Save to localStorage
  saveSettingsToStorage();
  
  // Close settings panel
  document.getElementById('settingsPanel').style.display = "none";
});

// Reset settings to defaults
document.getElementById('resetSettings').addEventListener('click', () => {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    // Set default values
    h1Size = 32; h2Size = 28; h3Size = 24; h4Size = 20; h5Size = 18; h6Size = 16;
    normalSize = 14; indentSize = 20;
    editorFontColor = "#000000";
    h1Color = "#000000"; h2Color = "#000000"; h3Color = "#000000";
    h4Color = "#000000"; h5Color = "#000000"; h6Color = "#000000";
    linkColor = "#0000FF";
    fontFamily = "Arial, sans-serif";
    h1Font = "inherit";
    headingWeight = "bold";
    
    // Update form and apply
    loadSettings();
    updateEditorStyles();
    saveSettingsToStorage();
  }
});

// Apply styles to the editor
function updateEditorStyles() {
  const editorEl = document.getElementById('editor');
  
  // Set base editor styles
  editorEl.style.fontFamily = fontFamily;
  editorEl.style.fontSize = normalSize + "px";
  
  // Create style element for custom styles
  let styleEl = document.getElementById('editor-custom-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'editor-custom-styles';
    document.head.appendChild(styleEl);
  }
  
  // Create CSS rules for heading styles
  styleEl.textContent = `
    .ql-editor h1 {
      font-size: ${h1Size}px;
      color: ${h1Color};
      font-family: ${h1Font === 'inherit' ? fontFamily : h1Font};
      font-weight: ${headingWeight};
    }
    .ql-editor h2 {
      font-size: ${h2Size}px;
      color: ${h2Color};
      font-weight: ${headingWeight};
    }
    .ql-editor h3 {
      font-size: ${h3Size}px;
      color: ${h3Color};
      font-weight: ${headingWeight};
    }
    .ql-editor h4 {
      font-size: ${h4Size}px;
      color: ${h4Color};
      font-weight: ${headingWeight};
    }
    .ql-editor h5 {
      font-size: ${h5Size}px;
      color: ${h5Color};
      font-weight: ${headingWeight};
    }
    .ql-editor h6 {
      font-size: ${h6Size}px;
      color: ${h6Color};
      font-weight: ${headingWeight};
    }
    .ql-editor a {
      color: ${linkColor};
    }
    .ql-editor p {
      color: ${editorFontColor};
      font-family: ${fontFamily};
    }
    .ql-editor li {
      color: ${editorFontColor};
    }
  `;
}

// Update colors based on theme
function updateEditorColors() {
  const isDarkMode = document.body.classList.contains("dark");
  const editorEl = document.getElementById('editor');
  
  if (isDarkMode) {
    editorEl.style.color = "#f5f5f5";
    
    // Adjust the heading colors if they're too dark for dark mode
    if (isColorTooDark(h1Color)) document.getElementById('h1Color').value = "#f5f5f5";
    if (isColorTooDark(h2Color)) document.getElementById('h2Color').value = "#f5f5f5";
    if (isColorTooDark(h3Color)) document.getElementById('h3Color').value = "#f5f5f5";
    if (isColorTooDark(h4Color)) document.getElementById('h4Color').value = "#f5f5f5";
    if (isColorTooDark(h5Color)) document.getElementById('h5Color').value = "#f5f5f5";
    if (isColorTooDark(h6Color)) document.getElementById('h6Color').value = "#f5f5f5";
  } else {
    editorEl.style.color = editorFontColor;
  }
  
  updateEditorStyles();
}

// Helper to check if a color is too dark for dark mode
function isColorTooDark(hexColor) {
  // Convert hex to RGB
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  
  // Calculate brightness (Luminance formula)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness < 50; // If brightness is less than 50, color is too dark
}

// Save settings to localStorage
function saveSettingsToStorage() {
  localStorage.setItem('editorSettings', JSON.stringify({
    h1Size, h2Size, h3Size, h4Size, h5Size, h6Size,
    normalSize, indentSize, 
    editorFontColor, h1Color, h2Color, h3Color, h4Color, h5Color, h6Color, linkColor,
    fontFamily, h1Font, headingWeight
  }));
}

// Load settings from localStorage
window.addEventListener('load', () => {
  const savedSettings = localStorage.getItem('editorSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    
    // Load heading sizes
    h1Size = settings.h1Size; h2Size = settings.h2Size; h3Size = settings.h3Size;
    h4Size = settings.h4Size; h5Size = settings.h5Size; h6Size = settings.h6Size;
    normalSize = settings.normalSize; indentSize = settings.indentSize;
    
    // Load colors
    editorFontColor = settings.editorFontColor;
    if (settings.h1Color) h1Color = settings.h1Color;
    if (settings.h2Color) h2Color = settings.h2Color;
    if (settings.h3Color) h3Color = settings.h3Color;
    if (settings.h4Color) h4Color = settings.h4Color;
    if (settings.h5Color) h5Color = settings.h5Color;
    if (settings.h6Color) h6Color = settings.h6Color;
    if (settings.linkColor) linkColor = settings.linkColor;
    
    // Load fonts
    fontFamily = settings.fontFamily;
    if (settings.h1Font) h1Font = settings.h1Font;
    if (settings.headingWeight) headingWeight = settings.headingWeight;
    
    // Load form and apply styles
    loadSettings();
    updateEditorStyles();
  }
  
  // Tool tooltips
  const toolbarButtons = document.querySelectorAll('#toolbar button');
  const altTextMapping = {
    'ql-bold': 'Bold',
    'ql-italic': 'Italic',
    'ql-underline': 'Underline',
    'ql-strike': 'Strike Through',
    'ql-color': 'Text Color',
    'ql-background': 'Background Color',
    'ql-list': 'List',
    'ql-indent': 'Indent',
    'ql-align': 'Text Alignment',
    'ql-link': 'Insert Link',
    'ql-image': 'Insert Image',
    'ql-video': 'Insert Video',
    'ql-clean': 'Clear Formatting'
  };
  toolbarButtons.forEach(btn => {
    for (const key in altTextMapping) {
      if (btn.classList.contains(key) && !btn.title) {
        btn.title = altTextMapping[key];
      }
    }
  });
});

// Save as JSON
document.getElementById('saveAsJSON').addEventListener('click', () => {
  const delta = quill.getContents();
  const canvasData = document.getElementById('drawingCanvas').toDataURL();
  const saveData = { delta, canvas: canvasData };
  const json = JSON.stringify(saveData);
  const blob = new Blob([json], { type: "application/json" });
  saveAs(blob, "document.json");
});

// Open Document
document.getElementById('openDocument').addEventListener('click', () => {
  document.getElementById('jsonInput').click();
});

document.getElementById('jsonInput').addEventListener('change', function(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const content = JSON.parse(e.target.result);
      
      // Load document content (delta)
      if (content.delta) {
        quill.setContents(content.delta);
      }
      
      // Load drawings from canvas
      if (content.canvas) {
        // Create temporary image for canvas loading
        const img = new Image();
        img.onload = function() {
          // Clear shapes array to prevent duplication
          shapes = [];
          
          // Set canvas to correct size
          const canvas = document.getElementById('drawingCanvas');
          const ctx = canvas.getContext('2d');
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Add drawings from loaded image
          ctx.drawImage(img, 0, 0);
        };
        img.src = content.canvas;
      }
      
      console.log("Document loaded successfully");
    } catch (err) {
      console.error("Error parsing JSON:", err);
      alert("Error opening document. File may be corrupted.");
    }
  };
  reader.readAsText(file);
  // Reset file input value so the same file can be selected again if needed
  this.value = '';
});

document.getElementById('insertTable').addEventListener('click', () => {
  // Initialize table modal
  const tableModal = document.getElementById('tableModal');
  const customRows = document.getElementById('customRows');
  const customCols = document.getElementById('customCols');
  const tableHeaderRow = document.getElementById('tableHeaderRow');
  
  // Set default values
  customRows.value = 3;
  customCols.value = 3;
  tableHeaderRow.checked = false;
  
  // Display the modal
  tableModal.style.display = 'flex';
  
  // Function to insert the table and close modal
  function insertSelectedTable() {
    const rows = parseInt(customRows.value);
    const cols = parseInt(customCols.value);
    const includeHeader = tableHeaderRow.checked;
    
    if (isNaN(rows) || isNaN(cols) || rows <= 0 || cols <= 0) {
      alert("Please enter valid numbers greater than 0 for both columns and rows.");
      return;
    }
    
    // Build table HTML
    let tableHTML = `<table border="1" style="border-collapse: collapse; width: 100%;">`;
    
    for (let r = 0; r < rows; r++) {
      tableHTML += "<tr>";
      for (let c = 0; c < cols; c++) {
        // Use th for header row if checked
        if (r === 0 && includeHeader) {
          tableHTML += `<th>Header ${c + 1}</th>`;
        } else {
          tableHTML += `<td>${includeHeader ? 'Cell ' + (r) + '-' + (c + 1) : 'Cell ' + (r + 1) + '-' + (c + 1)}</td>`;
        }
      }
      tableHTML += "</tr>";
    }
    tableHTML += "</table><p></p>";
    
    // Insert the table HTML into the Quill editor at the current selection
    const range = quill.getSelection(true);
    quill.clipboard.dangerouslyPasteHTML(range ? range.index : quill.getLength(), tableHTML);
    
    // Close the modal
    tableModal.style.display = 'none';
  }
  
  // Handle modal buttons
  const insertTableBtn = document.getElementById('insertTableBtn');
  const cancelTableBtn = document.getElementById('cancelTableBtn');
  const closeTableModal = document.getElementById('closeTableModal');
  
  // Remove any existing event listeners to prevent duplicates
  const newInsertBtn = insertTableBtn.cloneNode(true);
  const newCancelBtn = cancelTableBtn.cloneNode(true);
  const newCloseBtn = closeTableModal.cloneNode(true);
  
  insertTableBtn.parentNode.replaceChild(newInsertBtn, insertTableBtn);
  cancelTableBtn.parentNode.replaceChild(newCancelBtn, cancelTableBtn);
  closeTableModal.parentNode.replaceChild(newCloseBtn, closeTableModal);
  
  // Add event listeners to the new buttons
  newInsertBtn.addEventListener('click', insertSelectedTable);
  
  newCancelBtn.addEventListener('click', () => {
    tableModal.style.display = 'none';
  });
  
  newCloseBtn.addEventListener('click', () => {
    tableModal.style.display = 'none';
  });
  
  // Close modal when clicking outside
  tableModal.addEventListener('click', (e) => {
    if (e.target === tableModal) {
      tableModal.style.display = 'none';
    }
  });
  
  // Add keyboard event listeners for accessibility
  tableModal.addEventListener('keydown', (e) => {
    // Close on Escape key
    if (e.key === 'Escape') {
      tableModal.style.display = 'none';
    }
    // Insert on Enter key if focus is in the form
    if (e.key === 'Enter' && 
        (document.activeElement === customRows || 
         document.activeElement === customCols ||
         document.activeElement === tableHeaderRow)) {
      insertSelectedTable();
    }
  });
});

// Add back the Toggle Text Mode event listener
document.getElementById('toggleTextMode').addEventListener('click', () => {
  drawingMode = false;
  canvas.style.pointerEvents = 'none';
  quill.enable(true);
  updateDrawingButtons();
});

// Word count function
function countWords() {
  const text = quill.getText().trim();
  const words = text.split(/\s+/).filter(word => word.length > 0);
  const characters = text.replace(/\s/g, '').length;
  const paragraphs = quill.getText().split('\n').filter(line => line.trim().length > 0).length;
  
  return {
    words: words.length,
    characters: characters,
    paragraphs: paragraphs
  };
}

// Connect function to word count button
document.getElementById('wordCountBtn').addEventListener('click', () => {
  const stats = countWords();
  const message = `Word count: ${stats.words}\nCharacter count: ${stats.characters}\nParagraph count: ${stats.paragraphs}`;
  alert(message);
});

// Function to check if a point is inside a shape
function isPointInShape(x, y, shape) {
  // Handle different shape types
  if (shape.type === 'freehand' || shape.type === 'eraser') {
    // For path-based shapes, check if point is near any line segment
    for (let i = 1; i < shape.path.length; i++) {
      const p1 = shape.path[i-1];
      const p2 = shape.path[i];
      const distance = distanceToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
      if (distance < shape.lineWidth + 5) {
        return true;
      }
    }
    return false;
  } 
  else if (shape.type === 'line') {
    // For lines, check distance to the line segment
    return distanceToSegment(x, y, shape.startX, shape.startY, shape.endX, shape.endY) < shape.lineWidth + 5;
  } 
  else if (shape.type === 'rectangle') {
    // For rectangles, check if point is inside
    const minX = Math.min(shape.startX, shape.endX);
    const maxX = Math.max(shape.startX, shape.endX);
    const minY = Math.min(shape.startY, shape.endY);
    const maxY = Math.max(shape.startY, shape.endY);
    return x >= minX && x <= maxX && y >= minY && y <= maxY;
  } 
  else if (shape.type === 'circle') {
    // For circles, check distance to center
    const distance = Math.sqrt(
      Math.pow(x - shape.startX, 2) + 
      Math.pow(y - shape.startY, 2)
    );
    const radius = Math.sqrt(
      Math.pow(shape.endX - shape.startX, 2) + 
      Math.pow(shape.endY - shape.startY, 2)
    );
    return distance <= radius;
  } 
  // Add other shape types as needed
  
  return false;
}

// Helper function to calculate distance from point to line segment
function distanceToSegment(px, py, x1, y1, x2, y2) {
  const A = px - x1;
  const B = py - y1;
  const C = x2 - x1;
  const D = y2 - y1;

  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  let param = -1;
  
  if (len_sq !== 0) {
    param = dot / len_sq;
  }

  let xx, yy;

  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }

  const dx = px - xx;
  const dy = py - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
}

// Add keyboard event listener for Delete key to remove selected shape
document.addEventListener('keydown', function(e) {
  if (e.key === 'Delete') {
    if (drawingMode && selectedShapeIndex !== -1) {
      // Save current state for undo
      drawingHistory.push([...shapes]);
      redoStack = [];
      
      // Remove the selected shape
      shapes.splice(selectedShapeIndex, 1);
      selectedShapeIndex = -1;
      
      // Redraw
      redrawCanvas();
      e.preventDefault(); // Prevent any default behavior
    }
  }
});

// Function to move a shape by delta values
function moveShape(shape, deltaX, deltaY) {
  if (shape.type === 'freehand' || shape.type === 'eraser') {
    // Move each point in the path
    for (let i = 0; i < shape.path.length; i++) {
      shape.path[i].x += deltaX;
      shape.path[i].y += deltaY;
    }
  } else if (shape.type === 'line' || shape.type === 'rectangle' || 
             shape.type === 'circle' || shape.type === 'triangle' || 
             shape.type === 'arrow') {
    // Move start and end points
    shape.startX += deltaX;
    shape.startY += deltaY;
    shape.endX += deltaX;
    shape.endY += deltaY;
  }
}
