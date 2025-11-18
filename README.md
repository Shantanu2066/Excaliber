# Canvas Sketching App

A high-performance web-based canvas application built with Next.js, featuring freehand sketching with minimal latency, shape drawing tools, and an infinite canvas with pan and zoom capabilities.

## Features

### ✏️ Freehand Sketching
- Low-latency drawing optimized for pen tablets and touch devices
- Smooth, responsive pen strokes using HTML5 Canvas
- Support for pressure-sensitive input devices
- Optimized rendering with `desynchronized` context for minimal latency

### 🎨 Drawing Tools
- **Pen Tool**: Freehand sketching with customizable size and color
- **Line Tool**: Draw straight lines between two points
- **Circle Tool**: Create circles by clicking center and dragging to set radius
- **Rectangle Tool**: Draw rectangles by defining opposite corners
- **Text Tool**: Add text annotations with customizable color

### 🎯 Infinite Canvas
- Unlimited drawing space similar to Excalidraw
- **Pan**: Click and drag with Shift+Click, middle mouse button, or using the Pan tool
- **Zoom**: Scroll to zoom in/out (10% - 500% zoom range)
- Default zoom set at 100%
- Grid background for spatial reference

### 🎨 Customization Options
- **Pen Sizes**: Choose from 2px, 4px, 6px, 8px, 12px, or 16px
- **Color Palette**: 10 predefined colors including:
  - Black, Red, Green, Blue
  - Yellow, Magenta, Cyan
  - Orange, Purple, Gray

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
2. Click to set the starting point
3. Drag to define the shape
4. Release to complete

### Adding Text
1. Select the **Text** tool
2. Click anywhere on the canvas
3. Type your text
4. Press **Enter** to confirm or **Escape** to cancel

### Navigation
- **Pan**: Shift+Click and drag, or use middle mouse button, or select Pan tool
- **Zoom**: Use mouse wheel to zoom in/out
- Current zoom level is displayed in the toolbar

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
| Mouse Wheel | Zoom in/out |
| Enter (in text mode) | Confirm text input |
| Escape (in text mode) | Cancel text input |

## Future Enhancements

Potential features for future versions:
- Undo/Redo functionality
- Save/Load drawings (JSON export/import)
- Image export (PNG, SVG)
- Eraser tool
- Fill tool for shapes
- Layers support
- More shape options (ellipse, polygon, etc.)
- Custom color picker
- Drawing templates

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Acknowledgments

Built with inspiration from [Excalidraw](https://excalidraw.com/), focusing on adding robust freehand sketching capabilities with minimal latency for digital artists and note-takers.
