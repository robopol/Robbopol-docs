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


// Initialize Quill editor with history
let quill = new Quill('#editor', {
  modules: {
    toolbar: '#toolbar',
    history: { delay: 1000, maxStack: 50, userOnly: true }
  },
  theme: 'snow'
});

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
  if (document.body.classList.contains("dark")) {
    editorEl.style.color = "#f5f5f5";
  } else {
    editorEl.style.color = editorFontColor || "#000000";
  }
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
let currentShape = 'freehand'; // 'freehand', 'line', or 'eraser'
let isDrawing = false;
let startX = 0, startY = 0;
let currentPath = [];
let shapes = [];

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');

// Global settings for freehand drawing
let customFreehandLineWidth = 2;
let customFreehandLineColor = "#000000";

// Global settings for straight lines
let customLineWidth = 2;
let customLineColor = "#000000";

// Global eraser setting
let eraserLineWidth = 10;

// Function to update active state of drawing buttons
function updateDrawingButtons() {
  const freehandBtn = document.getElementById('toggleDraw');
  const lineBtn = document.getElementById('drawLine');
  const eraserBtn = document.getElementById('clearDrawing');
  // Remove active class from all
  freehandBtn.classList.remove('active');
  lineBtn.classList.remove('active');
  eraserBtn.classList.remove('active');

  if (!drawingMode) return;

  if (currentShape === 'freehand') {
    freehandBtn.classList.add('active');
  } else if (currentShape === 'line') {
    lineBtn.classList.add('active');
  } else if (currentShape === 'eraser') {
    eraserBtn.classList.add('active');
  }
}

// Freehand drawing toggle button – prompts for freehand settings
document.getElementById('toggleDraw').addEventListener('click', () => {
  drawingMode = true;
  canvas.style.pointerEvents = 'auto';
  quill.enable(false);
  const widthInput = prompt("Enter freehand line width (in pixels):", "2");
  const colorInput = prompt("Enter freehand line color (hex, e.g. #000000):", "#000000");
  if (widthInput !== null && !isNaN(widthInput) && widthInput.trim() !== "") {
    customFreehandLineWidth = parseInt(widthInput, 10);
  }
  if (colorInput !== null && colorInput.trim() !== "") {
    customFreehandLineColor = colorInput;
  }
  currentShape = 'freehand';
  updateDrawingButtons();
});

// Straight line button – prompts for line settings
document.getElementById('drawLine').addEventListener('click', () => {
  drawingMode = true;
  canvas.style.pointerEvents = 'auto';
  quill.enable(false);
  const widthInput = prompt("Enter the line width (in pixels):", "2");
  const colorInput = prompt("Enter the line color (hex format, e.g. #ff0000):", "#000000");
  if (widthInput !== null && !isNaN(widthInput) && widthInput.trim() !== "") {
    customLineWidth = parseInt(widthInput, 10);
  }
  if (colorInput !== null && colorInput.trim() !== "") {
    customLineColor = colorInput;
  }
  currentShape = 'line';
  updateDrawingButtons();
});

// Eraser button – toggle eraser mode; if a stroke is in progress, finish it
document.getElementById('clearDrawing').addEventListener('click', () => {
  if (isDrawing) {
    isDrawing = false;
    // Save the current stroke before switching modes
    shapes.push({
      type: currentShape,
      path: currentPath.slice(),
      lineWidth: (currentShape === 'eraser') ? eraserLineWidth : undefined
    });
    currentPath = [];
  }
  drawingMode = true;
  canvas.style.pointerEvents = 'auto';
  quill.enable(false);
  // Toggle eraser mode
  currentShape = (currentShape === 'eraser') ? 'freehand' : 'eraser';
  updateDrawingButtons();
});

// Toggle text mode – disables drawing mode and re-enables Quill
document.getElementById('toggleTextMode').addEventListener('click', () => {
  drawingMode = false;
  canvas.style.pointerEvents = 'none';
  quill.enable(true);
  updateDrawingButtons();
});

// Canvas event listeners
canvas.addEventListener('mousedown', (e) => {
  if (!drawingMode) return;
  isDrawing = true;
  const rect = canvas.getBoundingClientRect();
  startX = e.clientX - rect.left;
  startY = e.clientY - rect.top;
  if (currentShape === 'freehand' || currentShape === 'eraser') {
    currentPath = [{ x: startX, y: startY }];
  }
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawingMode || !isDrawing) return;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  redrawCanvas();
  if (currentShape === 'freehand' || currentShape === 'eraser') {
    currentPath.push({ x, y });
    drawFreehand(currentPath, currentShape);
  } else if (currentShape === 'line') {
    drawPreviewShape(startX, startY, x, y, 'line');
  }
});

canvas.addEventListener('mouseup', (e) => {
  if (!drawingMode || !isDrawing) return;
  isDrawing = false;
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  let shape;
  if (currentShape === 'freehand') {
    shape = { type: 'freehand', path: currentPath.slice(), lineWidth: customFreehandLineWidth, lineColor: customFreehandLineColor };
  } else if (currentShape === 'line') {
    shape = { type: 'line', startX, startY, endX: x, endY: y, lineWidth: customLineWidth, lineColor: customLineColor };
  } else if (currentShape === 'eraser') {
    shape = { type: 'eraser', path: currentPath.slice(), lineWidth: eraserLineWidth };
  }
  shapes.push(shape);
  redrawCanvas();
});

canvas.addEventListener('mouseleave', (e) => {
  if (isDrawing) {
    isDrawing = false;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let shape;
    if (currentShape === 'freehand') {
      shape = { type: 'freehand', path: currentPath.slice(), lineWidth: customFreehandLineWidth, lineColor: customFreehandLineColor };
    } else if (currentShape === 'line') {
      shape = { type: 'line', startX, startY, endX: x, endY: y, lineWidth: customLineWidth, lineColor: customLineColor };
    } else if (currentShape === 'eraser') {
      shape = { type: 'eraser', path: currentPath.slice(), lineWidth: eraserLineWidth };
    }
    shapes.push(shape);
    redrawCanvas();
  }
});

// drawFreehand: uses custom freehand settings or, in eraser mode, destination-out.
function drawFreehand(path, mode = 'freehand') {
  if (path.length < 2) return;
  ctx.save();
  if (mode === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineWidth = eraserLineWidth;
  } else {
    ctx.globalCompositeOperation = 'source-over';
    ctx.lineWidth = customFreehandLineWidth;
    ctx.strokeStyle = customFreehandLineColor;
  }
  ctx.beginPath();
  ctx.moveTo(path[0].x, path[0].y);
  for (let i = 1; i < path.length; i++) {
    ctx.lineTo(path[i].x, path[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

// drawShape: draws straight lines with given settings.
function drawShape(x1, y1, x2, y2, type, lineWidth, lineColor) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  ctx.lineWidth = lineWidth || 2;
  ctx.strokeStyle = lineColor || "#000";
  ctx.beginPath();
  if (type === 'line') {
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.stroke();
  ctx.restore();
}

// drawPreviewShape: for straight line preview.
function drawPreviewShape(x1, y1, x2, y2, type) {
  drawShape(x1, y1, x2, y2, type, customLineWidth, customLineColor);
}

// redrawCanvas: clear canvas and draw shapes in order.
// It first draws freehand and line shapes, then applies eraser strokes.
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Draw freehand and line shapes in the order added
  shapes.forEach(shape => {
    if (shape.type === 'freehand') {
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.lineWidth = shape.lineWidth || customFreehandLineWidth;
      ctx.strokeStyle = shape.lineColor || customFreehandLineColor;
      ctx.beginPath();
      ctx.moveTo(shape.path[0].x, shape.path[0].y);
      for (let i = 1; i < shape.path.length; i++) {
        ctx.lineTo(shape.path[i].x, shape.path[i].y);
      }
      ctx.stroke();
      ctx.restore();
    } else if (shape.type === 'line') {
      drawShape(shape.startX, shape.startY, shape.endX, shape.endY, 'line', shape.lineWidth, shape.lineColor);
    }
  });
  // Then apply eraser strokes
  shapes.forEach(shape => {
    if (shape.type === 'eraser') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = shape.lineWidth;
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

  // Uložte pôvodné background-image a border z paperEl
  const oldBgImage = paperEl.style.backgroundImage;
  paperEl.style.backgroundImage = "none"; // odstráni gradient

  // Získajte computed backgroundColor
  const computedBg = window.getComputedStyle(paperEl).backgroundColor;

  // Odstráňte border z editora (ako v pôvodnom kóde)
  const editorEl = document.querySelector(".ql-container");
  const oldBorder = editorEl.style.border;
  editorEl.style.border = "none";

  setTimeout(() => {
    html2canvas(paperEl, { backgroundColor: computedBg })
      .then(canvas => {
        // Obnovte pôvodné nastavenia
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

// Editor settings
let h1Size = 32, h2Size = 28, h3Size = 24, h4Size = 20, h5Size = 18, h6Size = 16;
let normalSize = 14, indentSize = 20;
let editorFontColor = "#000000", fontFamily = "Arial, sans-serif";

document.getElementById('settingsBtn').addEventListener('click', () => {
  document.getElementById('settingsPanel').style.display = "block";
});

document.getElementById('closeSettings').addEventListener('click', () => {
  document.getElementById('settingsPanel').style.display = "none";
});

document.getElementById('saveSettings').addEventListener('click', () => {
  h1Size = parseInt(document.getElementById('h1Size').value, 10);
  h2Size = parseInt(document.getElementById('h2Size').value, 10);
  h3Size = parseInt(document.getElementById('h3Size').value, 10);
  h4Size = parseInt(document.getElementById('h4Size').value, 10);
  h5Size = parseInt(document.getElementById('h5Size').value, 10);
  h6Size = parseInt(document.getElementById('h6Size').value, 10);
  normalSize = parseInt(document.getElementById('normalSize').value, 10);
  indentSize = parseInt(document.getElementById('indent').value, 10);
  editorFontColor = document.getElementById('fontColor').value;
  fontFamily = document.getElementById('fontFamily').value;
  const editorEl = document.getElementById('editor');
  editorEl.style.color = editorFontColor;
  editorEl.style.fontFamily = fontFamily;
  editorEl.style.fontSize = normalSize + "px";
  localStorage.setItem('editorSettings', JSON.stringify({
    h1Size, h2Size, h3Size, h4Size, h5Size, h6Size,
    normalSize, indentSize, editorFontColor, fontFamily
  }));
  document.getElementById('settingsPanel').style.display = "none";
});

window.addEventListener('load', () => {
  const savedSettings = localStorage.getItem('editorSettings');
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    h1Size = settings.h1Size; h2Size = settings.h2Size; h3Size = settings.h3Size;
    h4Size = settings.h4Size; h5Size = settings.h5Size; h6Size = settings.h6Size;
    normalSize = settings.normalSize; indentSize = settings.indentSize;
    editorFontColor = settings.editorFontColor; fontFamily = settings.fontFamily;
    document.getElementById('h1Size').value = h1Size;
    document.getElementById('h2Size').value = h2Size;
    document.getElementById('h3Size').value = h3Size;
    document.getElementById('h4Size').value = h4Size;
    document.getElementById('h5Size').value = h5Size;
    document.getElementById('h6Size').value = h6Size;
    document.getElementById('normalSize').value = normalSize;
    document.getElementById('indent').value = indentSize;
    document.getElementById('fontColor').value = editorFontColor;
    document.getElementById('fontFamily').value = fontFamily;
    const editorEl = document.getElementById('editor');
    editorEl.style.color = editorFontColor;
    editorEl.style.fontFamily = fontFamily;
    editorEl.style.fontSize = normalSize + "px";
  }
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

document.getElementById('saveAsDocument').addEventListener('click', async () => {
  const delta = quill.getContents();
  const paragraphs = [];
  
  for (const op of delta.ops) {
    if (typeof op.insert === "string") {
      const lines = op.insert.split('\n');
      lines.forEach((line, index) => {
        if (line.length > 0 || index < lines.length - 1) {
          paragraphs.push(new docx.Paragraph({
            children: [new docx.TextRun(line)]
          }));
        }
      });
    } else if (op.insert.image) {
      const base64Image = op.insert.image;
      const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
      const binaryString = atob(base64Data);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const img = new Image();
      img.src = base64Image;
      await new Promise(resolve => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      
      const origWidth = img.naturalWidth;
      const origHeight = img.naturalHeight;
      
      // A4 paper (približne)
      const maxWidth = 210 * 3;   
      const maxHeight = 297 * 3;  
      
      let scale = 1;
      if (origWidth > maxWidth || origHeight > maxHeight) {
        scale = Math.min(maxWidth / origWidth, maxHeight / origHeight);
      }
      const scaledWidth = Math.floor(origWidth * scale);
      const scaledHeight = Math.floor(origHeight * scale);
      
      paragraphs.push(new docx.Paragraph({
        children: [
          new docx.ImageRun({
            data: bytes,
            transformation: { width: scaledWidth, height: scaledHeight }
          })
        ]
      }));
    }
  }
  
  // Vypočítame bounding box nakresleného obsahu v canvas-e
  const canvasElem = document.getElementById('drawingCanvas');
  function getDrawingBoundingBox() {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    shapes.forEach(shape => {
      if (shape.type === 'freehand' || shape.type === 'eraser') {
        shape.path.forEach(point => {
          if (point.x < minX) minX = point.x;
          if (point.y < minY) minY = point.y;
          if (point.x > maxX) maxX = point.x;
          if (point.y > maxY) maxY = point.y;
        });
      } else if (shape.type === 'line') {
        [shape.startX, shape.endX].forEach(x => {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
        });
        [shape.startY, shape.endY].forEach(y => {
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        });
      }
    });
    if (minX === Infinity) return null;
    return { minX, minY, width: maxX - minX, height: maxY - minY };
  }
  
  const bbox = getDrawingBoundingBox();
  let exportCanvas;
  if (bbox && bbox.width > 0 && bbox.height > 0) {
    exportCanvas = document.createElement('canvas');
    exportCanvas.width = bbox.width;
    exportCanvas.height = bbox.height;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.drawImage(canvasElem, bbox.minX, bbox.minY, bbox.width, bbox.height, 0, 0, bbox.width, bbox.height);
  } else {
    exportCanvas = canvasElem;
  }
  
  // Konvertujeme vyrezaný (cropnutý) canvas na obrázok
  const canvasDataUrl = exportCanvas.toDataURL();
  const canvasBase64Data = canvasDataUrl.includes(',') ? canvasDataUrl.split(',')[1] : canvasDataUrl;
  const canvasBinaryString = atob(canvasBase64Data);
  const canvasLen = canvasBinaryString.length;
  const canvasBytes = new Uint8Array(canvasLen);
  for (let i = 0; i < canvasLen; i++) {
    canvasBytes[i] = canvasBinaryString.charCodeAt(i);
  }
  
  // Skalovanie vyrezaného canvasu
  const croppedWidth = exportCanvas.width;
  const croppedHeight = exportCanvas.height;
  const maxCanvasWidth = 210 * 3;
  const maxCanvasHeight = 297 * 3;
  let canvasScale = 1;
  if (croppedWidth > maxCanvasWidth || croppedHeight > maxCanvasHeight) {
    canvasScale = Math.min(maxCanvasWidth / croppedWidth, maxCanvasHeight / croppedHeight);
  }
  const scaledCanvasWidth = Math.floor(croppedWidth * canvasScale);
  const scaledCanvasHeight = Math.floor(croppedHeight * canvasScale);
  
  paragraphs.push(new docx.Paragraph({
    children: [
      new docx.ImageRun({
        data: canvasBytes,
        transformation: { width: scaledCanvasWidth, height: scaledCanvasHeight }
      })
    ]
  }));
  
  const doc = new docx.Document({
    sections: [{ children: paragraphs }]
  });
  
  docx.Packer.toBlob(doc)
    .then(blob => { saveAs(blob, "document.docx"); })
    .catch(error => { console.error("Error generating DOCX:", error); });
});

// Open Document
document.getElementById('openDocument').addEventListener('click', () => {
  const openInput = document.createElement('input');
  openInput.type = 'file';
  openInput.accept = ".json,.docx";
  openInput.style.display = 'none';
  document.body.appendChild(openInput);
  openInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    if (extension === "json") {
      const reader = new FileReader();
      reader.onload = function(event) {
        try {
          const savedData = JSON.parse(event.target.result);
          if (savedData.delta) {
            quill.setContents(savedData.delta);
          }
          if (savedData.canvas) {
            const canvasElem = document.getElementById('drawingCanvas');
            const ctx = canvasElem.getContext('2d');
            const img = new Image();
            img.src = savedData.canvas;
            img.onload = function() {
              ctx.clearRect(0, 0, canvasElem.width, canvasElem.height);
              ctx.drawImage(img, 0, 0);
            };
          }
        } catch (err) {
          console.error("Error parsing JSON:", err);
          alert("Failed to open JSON document.");
        }
      };
      reader.readAsText(file);
    } else if (extension === "docx") {
      const reader = new FileReader();
      reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        mammoth.convertToHtml({ arrayBuffer: arrayBuffer })
          .then(function(result) {
            const html = result.value;
            const range = quill.getSelection(true);
            quill.clipboard.dangerouslyPasteHTML(range ? range.index : quill.getLength(), html);
          })
          .catch(function(err) {
            console.error("Error converting DOCX to HTML:", err);
          });
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("Unsupported file format.");
    }
    document.body.removeChild(openInput);
  });
  openInput.click();
});


// Inject a style into the document head to force the resizer to have red background
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .resizer {
      background: red !important;
      position: absolute;
      right: 0;
      top: 0;
      width: 5px;
      height: 100%;
      cursor: col-resize;
      user-select: none;
      z-index: 10;
    }
  `;
  document.head.appendChild(style);
})();

document.getElementById('insertTable').addEventListener('click', () => {
  // Prompt for number of columns and rows
  let cols = prompt("Enter number of columns", "3");
  let rows = prompt("Enter number of rows", "2");

  cols = parseInt(cols);
  rows = parseInt(rows);
  if (isNaN(cols) || isNaN(rows) || cols <= 0 || rows <= 0) {
    alert("Please enter valid numbers greater than 0 for both columns and rows.");
    return;
  }

  // Build table HTML without any resizer elements; table-layout remains default
  let tableHTML = `<table border="1" style="border-collapse: collapse; width: 100%;">`;
  for (let r = 0; r < rows; r++) {
    tableHTML += "<tr>";
    for (let c = 0; c < cols; c++) {
      tableHTML += `<td>Cell ${r + 1}-${c + 1}</td>`;
    }
    tableHTML += "</tr>";
  }
  tableHTML += "</table><p></p>";

  // Insert the table HTML into the Quill editor at the current selection
  const range = quill.getSelection(true);
  quill.clipboard.dangerouslyPasteHTML(range ? range.index : quill.getLength(), tableHTML);
});