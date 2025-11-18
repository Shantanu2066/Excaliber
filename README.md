# Canvas Sketching App

A high-performance web-based canvas application built with Next.js, featuring freehand sketching with minimal latency, shape drawing tools, and an infinite canvas with pan and zoom capabilities.

## Features

### ✏️ Freehand Sketching
- Low-latency drawing optimized for pen tablets and touch devices
- Smooth, responsive pen strokes using HTML5 Canvas
- Support for pressure-sensitive input devices
- Optimized rendering with `desynchronized` context for minimal latency

### 🎨 Drawing Tools
- **Select Tool**: Click to select elements, drag to move them, or resize using corner/edge handles
- **Pen Tool**: Freehand sketching with customizable size and color
- **Line Tool**: Draw straight lines by dragging from start to end point
- **Circle Tool**: Create circles/ellipses by dragging from corner to corner (like most paint apps)
- **Rectangle Tool**: Draw rectangles by dragging from one corner to the opposite corner
- **Text Tool**: Click to add text with real-time input, customizable color and size
- **Pan Tool**: Move around the infinite canvas

### ✨ Element Manipulation
- **Select and Move**: Click any element with the Select tool to select it, then drag to reposition
- **Resize**: Select an element to reveal 8 resize handles (corners and edges)
- **Visual Feedback**: Selected elements show blue bounding boxes with interactive handles
- Works with all element types: freehand drawings, shapes, lines, and text

### 🎯 Infinite Canvas
- Unlimited drawing space similar to Excalidraw
- **Pan**: Shift+Click and drag, middle mouse button, or use the Pan tool
- **Zoom**: Scroll to zoom in/out (10% - 500% zoom range)
- Default zoom set at 100%
- Dynamic grid background that adapts to zoom level

### 🎨 Customization Options
- **Pen Sizes**: Choose from 2px, 4px, 6px, 8px, 12px, 16px, 20px, or 24px
- **Color Palette**: 11 predefined colors including:
  - Black, White, Red, Green, Blue
  - Yellow, Magenta, Cyan
  - Orange, Purple, Gray
- **Background Themes**:
  - ☀️ Light Mode (white background)
  - 🌙 Dark Mode (dark background) - perfect for night work or presentations

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Excaliber
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Usage Guide

### Basic Drawing
1. Select the **Pen** tool from the toolbar
2. Choose your desired pen size and color
3. Click and drag on the canvas to draw
4. Release to finish the stroke

### Drawing Shapes
1. Select a shape tool (**Line**, **Circle**, or **Rectangle**)
2. Click and drag from one corner to the opposite corner
3. Release to complete the shape
4. **Note**: Circle and Rectangle now use corner-to-corner drawing (like Paint/Photoshop)

### Adding Text
1. Select the **Text** tool
2. Click anywhere on the canvas
3. Type your text in the input box that appears
4. Press **Enter** to confirm or **Escape** to cancel

### Selecting and Moving Elements
1. Click the **Select** tool (arrow icon)
2. Click on any element to select it
3. Selected elements show a blue bounding box with 8 resize handles
4. **To Move**: Click and drag the element to a new position
5. **To Resize**: Click and drag any of the 8 handles (corners or edges)
6. Click on empty space to deselect

### Navigation
- **Pan**: Shift+Click and drag, middle mouse button, or select the Pan tool
- **Zoom**: Use mouse wheel to zoom in/out (zoom level shown in toolbar)
- **Background**: Toggle between Light and Dark modes using the BG buttons

## Technical Details

### Performance Optimizations
1. **Low-Latency Rendering**:
   - Uses `desynchronized: true` canvas context option
   - Direct canvas manipulation without React state for drawing points
   - RequestAnimationFrame for smooth updates

2. **Efficient Drawing**:
   - Pointer events for unified mouse/touch/pen support
   - Immediate canvas updates during drawing
   - Optimized redraw only when necessary

3. **Infinite Canvas**:
   - Transform-based rendering for pan and zoom
   - Dynamic grid rendering based on viewport
   - Efficient coordinate transformation

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Canvas**: HTML5 Canvas API
- **Build Tool**: Turbopack (Next.js)

### Project Structure
```
Excaliber/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout with metadata
│   └── globals.css       # Global styles
├── components/
│   ├── Canvas.tsx        # Main canvas component
│   └── Toolbar.tsx       # Top toolbar component
├── types/
│   └── canvas.ts         # TypeScript type definitions
├── package.json
└── README.md
```

## Browser Compatibility

This application works best on modern browsers with full HTML5 Canvas support:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

For best performance with pen/tablet input, use Chrome or Edge.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Shift + Click & Drag | Pan the canvas |
| Middle Mouse Button + Drag | Pan the canvas |
| Mouse Wheel | Zoom in/out |
| Enter (in text mode) | Confirm text input |
| Escape (in text mode) | Cancel text input |
| Click + Drag (Select mode) | Move selected element |

## Recent Updates (v2.0)

### New Features
- ✨ **Select Tool**: Click to select, drag to move, resize with handles
- 🎨 **Improved Shape Drawing**: Circle and Rectangle now use corner-to-corner drawing (more intuitive)
- 🌓 **Dark Mode**: Toggle between light and dark backgrounds
- 🎯 **Text Rendering**: Text now properly renders on canvas and can be selected/moved
- 💅 **Enhanced UI**: Redesigned toolbar with better aesthetics, gradients, and visual feedback
- 🎨 **Expanded Color Palette**: Added white color option
- 📏 **More Pen Sizes**: Extended range up to 24px

### Bug Fixes
- Fixed text tool not rendering text on canvas
- Improved element selection hit detection
- Better cursor feedback for different tools and resize handles

## Future Enhancements

Potential features for future versions:
- Undo/Redo functionality (Ctrl+Z, Ctrl+Y)
- Save/Load drawings (JSON export/import)
- Image export (PNG, SVG, PDF)
- Eraser tool
- Fill tool for shapes
- Multi-select (select multiple elements at once)
- Layers support
- More shape options (polygon, star, arrow, etc.)
- Custom color picker with RGB/HSL values
- Drawing templates and stencils
- Keyboard shortcuts for tool switching

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

Built with inspiration from [Excalidraw](https://excalidraw.com/), focusing on adding robust freehand sketching capabilities with minimal latency for digital artists and note-takers.
