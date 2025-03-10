# Robopol Docs

A web-based document editor application built with **HTML**, **CSS**, and **JavaScript** (using the [Quill](https://quilljs.com/) editor). **Robopol Docs** provides a comprehensive set of text-editing features, including exporting to PDF, DOCX, and JSON, dynamic drawing on the document, and customizable settings for fonts, colors, and layouts.

---

## Features

1. **Rich Text Editing**  
   - Quill-based toolbar with options for fonts, headings, lists, alignment, colors, and more.
   - Insert images, links, or videos directly into the editor.

2. **Document Management**  
   - **New Document**, **Open Document**, and **Save as JSON** functionalities.
   - Export the current document as a **PDF** or **DOCX** file.

3. **Customization & Settings**  
   - Light/Dark mode toggle.
   - Page background color selection.
   - Adjustable heading sizes (H1–H6) and normal text size.
   - Change font color, family, and indentation via the **Settings** panel.

4. **Drawing Tools**  
   - Switch between text mode and draw mode for freehand annotations.
   - **Draw line** and **erase** functionality on the same canvas.
   - Clear drawings without affecting the underlying text.

5. **Word Count & Table Insertion**  
   - Built-in **Word Count** feature.
   - Easily **Insert Table** into the document.

6. **Import DOCX**  
   - Load existing Word documents (`.docx`) into the editor.
   - Use **Mammoth.js** to parse and display Word content.

---

## File Structure

- **index.html**  
  The main HTML file containing the application’s structure, Quill toolbar, settings panel, and canvas elements for drawing.

- **styles.css**  
  The primary stylesheet that manages layout, toolbar design, paper styling, dark/light mode, and overall visual appearance.

- **app.js**  
  The core JavaScript file that initializes Quill, handles user interactions, manages export/import logic, toggles draw mode, and applies settings.

---

## Installation & Setup

1. **Clone the Repository**  
   ```bash
   git clone https://github.com/yourusername/robopol-docs.git

## Usage

### Start Editing
- A blank document is available by default. Type directly into the editor.  
- Use the toolbar to format text, insert images or videos, and adjust styling.

### Customize Settings
- Click the **gear icon** in the top bar to open the Settings panel.  
- Adjust heading sizes, font color, font family, indent level, and text size.  
- Toggle **Light/Dark** mode or change the **Page Color** from the top bar.

### Import / Export
- **New Document**: Clear the current content.  
- **Open Document**: Load a `.json` file (previously saved) or a `.docx` file from your computer.  
- **Save as JSON**: Export your current document (including text formatting) as a `.json` file.  
- **Save as DOCX**: Convert the current content into a Word file and download it.  
- **Export PDF**: Generate a PDF of your current document, preserving formatting.

### Drawing Mode
- Click the **pen icon** to toggle drawing mode.  
- Use the **line tool** to draw straight lines or the **eraser** to remove strokes.  
- **Clear Drawing** only removes the drawing, not the text.

### Word Count & Tables
- Click the **calculator icon** for a word count of the current document.  
- Click the **table icon** to insert a basic table into your document.

## Dependencies
- Quill 2.0 Beta for rich text editing.
- html2canvas and jsPDF for PDF export.
- Mammoth.js for DOCX import.
- FileSaver.js for saving files locally.
- docx.js for DOCX export.
- FontAwesome 6.4.0 for icons.
## Contributing
Issues & Pull Requests:
Feel free to open an issue if you find a bug or have a feature request. Pull requests are welcome for improvements, additional features, or bug fixes.
## License
This project is licensed under the MIT License. You are free to use, modify, and distribute the code under the terms of this license.
