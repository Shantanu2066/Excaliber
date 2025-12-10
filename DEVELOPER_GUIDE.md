# Canvas Sketching App - Developer Guide

## 🎯 Quick Start for Developers

### Understanding the Codebase Structure

This is a **fully client-side drawing application** with three main layers:

1. **UI Layer** (Toolbar.tsx) - User controls
2. **Logic Layer** (Canvas.tsx) - Drawing engine and state
3. **Orchestration** (page.tsx) - Glue that connects everything

### Key Principles

- ✅ **No backend** - Everything runs in the browser
- ✅ **Low latency** - Canvas context optimized for fast rendering
- ✅ **Minimal state updates** - Direct canvas manipulation during drawing
- ✅ **Type safe** - Full TypeScript support
- ✅ **Responsive UI** - Tailwind CSS for styling

---

## 📝 File-by-File Breakdown

### app/page.tsx - Application Container

**What it does**: Acts as the main orchestrator and state container

**State it manages**:
```typescript
selectedTool          // Which tool is active
penSize              // Current pen/font size (2-24px)
color                // Current drawing color
zoom                 // Current zoom level (0.1-5.0)
backgroundColor      // Canvas background (#ffffff or #1a1a1a)
canUndo/canRedo      // Button enable states
undoTrigger/redoTrigger  // Trigger counters for undo/redo
```

**Key patterns**:
```typescript
// Callback pattern for state updates
onToolChange={(tool) => setSelectedTool(tool)}
onColorChange={(color) => setColor(color)}

// Trigger-based communication
// (why? Because we can't pass functions to undo/redo in useEffect dependencies)
setUndoTrigger(prev => prev + 1)  // Increment to notify Canvas

// Keyboard shortcut handling
useEffect(() => {
  window.addEventListener('keydown', handleKeyDown);
  // Check for Ctrl+Z, Ctrl+Y combinations
}, []);

// Global function exposure (hacky but works)
(window as any).__canvasSnapshot = takeSnapshot;
```

**When to modify**: 
- Adding new toolbar controls → Add state
- Adding global keyboard shortcuts → Modify useEffect
- Changing how undo/redo works → Modify handlers

---

### components/Toolbar.tsx - UI Control Panel

**What it does**: Renders all user interface controls

**Main sections**:
```
Row 1: Tool buttons (8 tools)
Row 2: Controls (Undo/Redo, Size, Color, BG, Snapshot, Zoom)
```

**Key UI components**:

```typescript
// Tool button with active state styling
<button
  onClick={() => onToolChange(tool.id)}
  className={selectedTool === tool.id ? 'active' : 'inactive'}
>
  {tool.icon} {tool.label}
</button>

// Color picker with 11 colors
{colors.map((c) => (
  <button
    onClick={() => onColorChange(c)}
    style={{ backgroundColor: c }}
    className={color === c ? 'active' : ''}
  />
))}

// Size dropdown
<select value={penSize} onChange={(e) => onPenSizeChange(Number(e.target.value))}>
  {penSizes.map(size => <option>{size}px</option>)}
</select>
```

**Styling approach**:
- Uses Tailwind CSS utility classes
- Fixed positioning (stays at top)
- High z-index (9999) to stay above canvas
- Gradient backgrounds and shadows for depth
- Responsive button states with transitions

**When to modify**:
- Adding new tools → Add to tools array
- Changing colors → Modify colors array
- Adding new controls → Add new section in Row 2
- Styling changes → Modify className strings

---

### components/Canvas.tsx - Drawing Engine (843 lines)

**What it does**: Everything related to drawing, rendering, and interaction

This is the most complex component. Breaking it down:

#### State Management

```typescript
// Drawing state
elements: DrawingElement[]        // All finished elements
currentElement: DrawingElement    // Element being drawn right now
isDrawing: boolean               // Is user currently drawing

// History state
history: DrawingElement[][]      // 2D array of snapshots
historyIndex: number             // Current position in history

// Pan/Zoom state
pan: Point                       // {x, y} offset
zoom: number                     // Scale factor

// Selection state
selectedElements: DrawingElement[]  // Selected for move/resize
isDragging: boolean              // Moving selection
isResizing: boolean              // Resizing selection
resizeHandle: ResizeHandle       // Which handle being dragged

// Text mode state
isEditingText: boolean           // Text input active
textValue: string                // Text being typed
textPosition: Point              // Screen coords for input overlay

// Rectangular selection state
isRectSelecting: boolean         // Drawing selection box
selectionRect: { start, end }    // Selection rectangle bounds
```

#### Key Functions

**Coordinate Transformation**:
```typescript
// Screen (from mouse) → Canvas (for drawing)
screenToCanvas(screenX: number, screenY: number): Point {
  return {
    x: (screenX - pan.x) / zoom,
    y: (screenY - pan.y) / zoom,
  };
}
```

**Bounds Calculation** (for hit detection):
```typescript
calculateBounds(element): Bounds {
  // Different logic for each element type:
  // - Text: Width from char count, height from font size
  // - Freehand: Min/max of all points
  // - Shapes: Min/max of two endpoints
}
```

**Rendering**:
```typescript
redrawCanvas() {
  // 1. Clear canvas
  ctx.fillRect(0, 0, width, height);
  
  // 2. Apply transformations
  ctx.translate(pan.x, pan.y);
  ctx.scale(zoom, zoom);
  
  // 3. Draw grid
  // 4. Draw all elements
  // 5. Draw selection UI
}
```

**Event Handlers**:
```typescript
handlePointerDown(e) {
  // Determine action based on tool
  // Set up state for operation
}

handlePointerMove(e) {
  // Update element/position in real-time
  // Trigger redraw
}

handlePointerUp(e) {
  // Finalize operation
  // Add to history if needed
}

handleWheel(e) {
  // Update zoom
  // Adjust pan to keep cursor position
}
```

#### Pattern: How Drawing Works

```typescript
// POINTER DOWN
if (tool === 'pen') {
  currentElement = {
    id: Date.now(),
    type: 'freehand',
    points: [startPoint],
    color, size
  };
  setCurrentElement(currentElement);
  setIsDrawing(true);
}

// POINTER MOVE (happens many times per second!)
if (isDrawing) {
  currentElement.points.push(newPoint);
  setCurrentElement({...currentElement}); // Trigger redraw
  redrawCanvas(); // This happens via useEffect
}

// POINTER UP
if (isDrawing) {
  const newElements = [...elements, currentElement];
  addToHistory(newElements);  // Adds to history array
  setElements(newElements);
  setCurrentElement(null);
  setIsDrawing(false);
}
```

#### Pattern: How Selection Works

```typescript
// CLICK TO SELECT
if (selectedTool === 'select') {
  // Check for resize handle first
  if (resizeHandleFound) {
    setIsResizing(true);
  }
  // Then check if inside selection
  else if (insideSelectedElements) {
    setIsDragging(true);
  }
  // Then check element under click
  else if (elementUnderClick) {
    setSelectedElements([elementUnderClick]);
  }
  // Otherwise start rectangular selection
  else {
    setIsRectSelecting(true);
  }
}

// DRAG TO MOVE
if (isDragging) {
  // Calculate offset
  const dx = currentMouse.x - dragStart.x;
  const dy = currentMouse.y - dragStart.y;
  
  // Apply to all selected elements
  updatedElements = elements.map(el => ({
    ...el,
    points: el.points.map(p => ({
      x: p.x + dx,
      y: p.y + dy
    }))
  }));
}

// DRAG TO RESIZE
if (isResizing) {
  // Get old bounds
  oldBounds = calculateCombinedBounds(selectedElements);
  
  // Calculate new bounds based on which handle
  // Calculate scale factors
  scaleX = newWidth / oldWidth;
  scaleY = newHeight / oldHeight;
  
  // Apply scaling to all selected elements
}
```

#### Pattern: How History Works

```typescript
// WHEN ACTION COMPLETES
addToHistory(newElements) {
  setHistory(prevHistory => {
    newHistory = prevHistory.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    return newHistory;
  });
  setHistoryIndex(prevIndex => prevIndex + 1);
  
  // Tell parent so buttons update
  onHistoryChange(canUndo, canRedo);
}

// WHEN UNDO TRIGGERED
useEffect(() => {
  if (undoRequested && historyIndex > 0) {
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    setElements(history[newIndex]);
    onHistoryChange(newIndex > 0, newIndex < history.length - 1);
  }
}, [undoRequested]);
```

**When to modify**:
- Changing drawing behavior → Modify pointer event handlers
- Adding new element type → Add case in redrawCanvas()
- Changing selection behavior → Modify select tool logic
- Performance tuning → Optimize redrawCanvas() or event handlers

---

### types/canvas.ts - Type Definitions

```typescript
type Tool = 
  | 'select'     // Select and move elements
  | 'pen'        // Freehand drawing
  | 'eraser'     // Erase freehand strokes
  | 'line'       // Draw lines
  | 'circle'     // Draw circles/ellipses
  | 'rectangle'  // Draw rectangles
  | 'text'       // Add text
  | 'pan';       // Pan canvas

interface Point {
  x: number;
  y: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface DrawingElement {
  id: string;                    // Unique ID
  type: 'freehand' | 'line' | 'circle' | 'rectangle' | 'text';
  points: Point[];              // Coordinates
  color: string;                // Hex color code
  size: number;                 // Stroke width or font size
  text?: string;                // Text content (optional)
  fontSize?: number;            // Font size (optional)
  bounds?: Bounds;              // Cached bounds (optional)
}
```

**When to modify**:
- Adding new tool → Add to Tool type
- Adding new element type → Add to type union
- Adding element properties → Add to DrawingElement interface

---

## 🔄 Common Development Tasks

### Task 1: Add a New Tool

1. **Add to types** (types/canvas.ts):
```typescript
type Tool = 'select' | 'pen' | ... | 'yourTool';
```

2. **Add to toolbar** (components/Toolbar.tsx):
```typescript
const tools = [
  // ... existing tools
  { id: 'yourTool', label: 'YourTool', icon: '🎨' },
];
```

3. **Implement logic** (components/Canvas.tsx):
```typescript
if (selectedTool === 'yourTool') {
  // Handle pointer down
  // Handle pointer move
  // Handle pointer up
}
```

4. **Add to drawing** (redrawCanvas function):
```typescript
if (element.type === 'yourType') {
  // Draw this element type
}
```

### Task 2: Change Colors or Pen Sizes

**Colors** (Toolbar.tsx):
```typescript
const colors = [
  '#000000', // Black
  '#FF0000', // Red
  // Add your colors here
];
```

**Sizes** (Toolbar.tsx):
```typescript
const penSizes = [2, 4, 6, 8, 12, 16, 20, 24];
// Modify this array
```

### Task 3: Add Keyboard Shortcut

In `app/page.tsx`:
```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'your-key') {
      e.preventDefault();
      // Do something
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, []);
```

### Task 4: Add UI Control

1. **Add state** (page.tsx):
```typescript
const [newOption, setNewOption] = useState(defaultValue);
```

2. **Pass to Toolbar** (page.tsx):
```typescript
<Toolbar newOption={newOption} onNewOptionChange={setNewOption} {...props} />
```

3. **Add UI** (Toolbar.tsx):
```typescript
<button onClick={() => onNewOptionChange(newValue)}>
  Label
</button>
```

4. **Use in Canvas** (Canvas.tsx):
```typescript
const Canvas = ({ newOption, ... }) => {
  // Use newOption in logic
}
```

### Task 5: Modify Drawing Appearance

In `Canvas.tsx` redrawCanvas function:
```typescript
ctx.strokeStyle = element.color;
ctx.lineWidth = element.size;
ctx.lineCap = 'round';        // Change line end style
ctx.lineJoin = 'round';       // Change line join style
ctx.globalAlpha = 0.8;        // Change transparency
```

### Task 6: Add Element Property

1. **Update type** (types/canvas.ts):
```typescript
interface DrawingElement {
  // ... existing properties
  newProperty?: string;
}
```

2. **Store when creating** (Canvas.tsx):
```typescript
const newElement: DrawingElement = {
  // ... existing properties
  newProperty: someValue,
};
```

3. **Use when drawing** (Canvas.tsx redrawCanvas):
```typescript
// Use element.newProperty in your drawing logic
```

---

## 🐛 Debugging Tips

### Common Issues & Solutions

**Drawing has lag/latency**:
- Check if pointer events are being handled efficiently
- Ensure redrawCanvas() isn't doing unnecessary work
- Verify `desynchronized: true` is set in canvas context

**Selection not working**:
- Check calculateBounds() for element type
- Verify hit detection logic in isPointInBounds()
- Ensure selectedElements state is updating

**History not working**:
- Check if addToHistory() is being called
- Verify historyIndex is updating correctly
- Ensure onHistoryChange() is being called

**Undo/Redo buttons not enabling**:
- Check page.tsx useEffect listening to historyIndex
- Verify Canvas is calling onHistoryChange() with correct values
- Check Toolbar button disabled prop

**Text not rendering**:
- Verify element.type === 'text' check in redrawCanvas()
- Check textBaseline is set to 'top'
- Ensure font string is valid

**Zoom not working**:
- Check handleWheel() event handler
- Verify zoom limits (0.1 to 5.0)
- Ensure pan adjustment formula is correct

### Debugging Techniques

**Log element creation**:
```typescript
console.log('Creating element:', newElement);
console.log('Total elements:', elements.length);
```

**Log state changes**:
```typescript
useEffect(() => {
  console.log('Selected tool changed:', selectedTool);
}, [selectedTool]);
```

**Inspect canvas**:
```typescript
// In browser console
const canvas = document.querySelector('canvas');
canvas.toDataURL(); // Shows what's rendered
```

**Check history state**:
```typescript
// Add temporary display
<div>historyIndex: {historyIndex}, total: {history.length}</div>
```

---

## 📊 Performance Considerations

### Optimization Techniques Used

1. **Canvas Context Options**:
   - `alpha: false` - Disables alpha blending (faster)
   - `desynchronized: true` - Low-latency rendering

2. **Efficient Rendering**:
   - Single redrawCanvas function (called once per frame)
   - Grid only draws visible cells
   - Transform-based pan/zoom (no DOM manipulation)

3. **Event Handling**:
   - Pointer Events API (unified interface)
   - Direct canvas updates during drawing
   - No state updates during continuous motion

4. **Memory**:
   - History array could have max limit
   - Canvas contexts properly managed
   - Event listeners cleaned up

### Potential Bottlenecks

**Large number of elements** (1000+):
- Rendering all elements on each frame
- Hit detection checking all elements
- Solution: Spatial partitioning (quadtree)

**Complex paths** (10000+ points):
- Rendering very long freehand strokes
- Solution: Path simplification/decimation

**Deep history** (100+ states):
- Memory usage from storing all states
- Solution: Limit history or compress

### Monitoring Performance

```typescript
// Measure draw time
const start = performance.now();
redrawCanvas();
const time = performance.now() - start;
console.log(`Render time: ${time.toFixed(2)}ms`);
```

---

## 🧪 Testing Approach

### Manual Testing Checklist

- [ ] Freehand drawing works without lag
- [ ] Line, circle, rectangle draw correctly
- [ ] Text input and rendering work
- [ ] Selection single element works
- [ ] Rectangular selection works
- [ ] Move selected elements works
- [ ] Resize with handles works
- [ ] Undo/redo work with keyboard and buttons
- [ ] Pan works with shift+click and middle mouse
- [ ] Zoom works with scroll
- [ ] Colors change correctly
- [ ] Pen sizes change correctly
- [ ] Background toggle works
- [ ] Snapshot downloads PNG
- [ ] Eraser removes freehand strokes

### Unit Test Ideas

- Coordinate transformation (screenToCanvas)
- Bounds calculation for each element type
- Hit detection (isPointInBounds)
- Rectangle intersection (doRectsIntersect)
- History management (addToHistory)

---

## 📚 Code Style Guidelines

### Naming Conventions

```typescript
// Variables
const elementCount = 5;           // camelCase for variables
const isDrawing = true;           // Boolean vars start with 'is'
const handlePointerDown = () => {}; // Event handlers start with 'handle'
const screenToCanvas = () => {};   // Utility functions are descriptive

// Files
Canvas.tsx                         // PascalCase for components
canvas.ts                          // camelCase for utilities
```

### Patterns Used

**State setters with callbacks**:
```typescript
setSelectedElements(prevElements => [...prevElements, newElement]);
```

**Dependency arrays in useEffect**:
```typescript
useEffect(() => { /* code */ }, [dependency1, dependency2]);
// List ALL dependencies to avoid stale closures
```

**TypeScript typing**:
```typescript
const func = (param: Type): ReturnType => {
  return value;
};
```

### Comments

- Add comments for complex algorithms (e.g., bounds calculation)
- Explain WHY, not WHAT (code should be clear what it does)
- Use JSDoc for exported functions

---

## 🚀 Deployment

### Build Steps

```bash
npm install      # Install dependencies
npm run build    # Build for production
npm start        # Start production server
```

### Environment

- Node.js 18+ required
- Runs entirely in browser (no backend)
- No environment variables needed

### Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Requires HTML5 Canvas and Pointer Events

---

## 📖 Additional Resources

**Canvas API Documentation**:
- [MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

**React Hooks**:
- [React Hooks Documentation](https://react.dev/reference/react)

**Next.js**:
- [Next.js 16 Documentation](https://nextjs.org/docs)

**Tailwind CSS**:
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

This guide should help you understand and modify the Canvas Sketching App! Start with small changes and gradually work your way up to larger features.
