# Canvas Sketching App - Quick Reference Guide

## 🎯 30-Second Overview

A Next.js 16 drawing app built for **low-latency sketching** with freehand drawing, shapes, text, selection, pan/zoom, and undo/redo. Everything runs client-side in the browser.

---

## 📁 Where is What?

| What | Where |
|------|-------|
| Main app entry | `app/page.tsx` |
| Drawing engine | `components/Canvas.tsx` |
| UI toolbar | `components/Toolbar.tsx` |
| Type definitions | `types/canvas.ts` |
| Global styles | `app/globals.css` |
| Config | `tsconfig.json`, `next.config.ts`, `package.json` |

---

## 🔧 Main Components at a Glance

```
page.tsx (89 lines)
├─ Holds: selectedTool, penSize, color, zoom, backgroundColor
├─ Handles: Keyboard shortcuts (Ctrl+Z, Ctrl+Y)
└─ Does: Routes state to children, coordinates undo/redo

Toolbar.tsx (210 lines)
├─ Renders: Tool buttons, color picker, size selector, zoom display
├─ Accepts: All props for state
└─ Calls: Callbacks like onToolChange, onColorChange

Canvas.tsx (843 lines)
├─ Manages: Drawing, elements[], selection, history[], pan, zoom
├─ Handles: All pointer events (mouse/touch/pen)
├─ Renders: Canvas with grid, elements, selection UI
└─ Exposes: __canvasSnapshot() global function
```

---

## 🎨 Element Types

| Type | Points | How to Draw | Used By |
|------|--------|-----------|---------|
| Freehand | Many | Click & drag, adds point on each move | Pen tool |
| Line | 2 | Click start, drag to end | Line tool |
| Circle | 2 | Click corner, drag to opposite corner | Circle tool |
| Rectangle | 2 | Click corner, drag to opposite corner | Rectangle tool |
| Text | 1 | Click position, type in overlay | Text tool |

---

## 🎯 State Structure

```typescript
// Page-level (app/page.tsx)
selectedTool: Tool
penSize: number (2-24)
color: string (hex)
zoom: number (0.1-5.0)
backgroundColor: string (#ffffff or #1a1a1a)
canUndo: boolean
canRedo: boolean
undoTrigger: number (counter)
redoTrigger: number (counter)

// Canvas-level (components/Canvas.tsx)
elements: DrawingElement[]        // All finished drawings
currentElement: DrawingElement    // Being drawn now
isDrawing: boolean
history: DrawingElement[][]       // Snapshots for undo/redo
historyIndex: number
pan: { x, y }                    // View offset
selectedElements: DrawingElement[] // Selected for move/resize
// ... + many other temporary state flags
```

---

## 🔄 Data Flow

```
User Action
    ↓
Canvas.tsx (handlePointerDown/Move/Up)
    ↓
Update local state (elements, currentElement, etc.)
    ↓
redrawCanvas() via useEffect
    ↓
Canvas renders (ctx.draw... calls)
    ↓
User sees visual feedback
    ↓
(Optional) addToHistory() and notify parent
    ↓
page.tsx updates canUndo/canRedo
    ↓
Toolbar buttons enable/disable
```

---

## ⌨️ How Tools Work

### Drawing Tools (Pen, Line, Circle, Rectangle)
```
pointerdown → Create DrawingElement with type
pointermove → Add points or update endpoint
pointerup → Add to elements[], call addToHistory()
```

### Select Tool
```
pointerdown → Check resize handle, check selection bounds, or check element
pointermove → Move selected elements OR resize OR rectangular select
pointerup → Finalize and addToHistory()
```

### Text Tool
```
pointerdown → Show text input overlay at click position
Input change → Update textValue
pointerup/Enter → Convert screen→canvas coords, create text element
```

### Pan Tool / Shift+Click
```
pointerdown → Set isPanning, record last position
pointermove → Update pan offset based on mouse delta
pointerup → Stop panning
```

### Eraser Tool
```
pointerdown → Check if any freehand element nearby
pointermove → Continue checking and removing
pointerup → addToHistory()
```

---

## 🧮 Important Formulas

### Screen → Canvas Transformation
```typescript
canvasPoint = {
  x: (screenX - pan.x) / zoom,
  y: (screenY - pan.y) / zoom
}
```

### Canvas → Screen Transformation (for rendering)
```typescript
ctx.translate(pan.x, pan.y);
ctx.scale(zoom, zoom);
// All subsequent drawing uses canvas coordinates
```

### Zoom with Mouse Position Fixed
```typescript
zoomRatio = newZoom / oldZoom;
newPanX = mouseX - (mouseX - oldPan.x) * zoomRatio;
newPanY = mouseY - (mouseY - oldPan.y) * zoomRatio;
```

### Resize with Scaling
```typescript
scaleX = newWidth / oldWidth;
scaleY = newHeight / oldHeight;
newPointX = newBounds.x + (oldPointX - oldBounds.x) * scaleX;
newPointY = newBounds.y + (oldPointY - oldBounds.y) * scaleY;
```

---

## 🔐 How History Works

```typescript
// Structure: 2D array + index
history = [
  [],                                  // [0] Initial
  [[elem1]],                          // [1] After 1st action
  [[elem1, elem2]],                   // [2] After 2nd action
  [[elem1, elem2, elem3]],            // [3] After 3rd action ← historyIndex
]

// When drawing finishes:
addToHistory([elem1, elem2, elem3])
  → history[historyIndex + 1] = [elem1, elem2, elem3]
  → historyIndex++
  → notify parent: onHistoryChange(true, false)

// When undo pressed (Ctrl+Z):
historyIndex--
setElements(history[historyIndex])

// When redo pressed (Ctrl+Y):
historyIndex++
setElements(history[historyIndex])

// If new action after undo:
Discard all future states
Add new state
```

---

## 🎨 Drawing Pipeline

```
redrawCanvas()
├─ 1. Clear canvas with backgroundColor
├─ 2. Save context, apply transformations (translate, scale)
├─ 3. Draw grid (50px spacing)
├─ 4. For each element:
│  ├─ Freehand: lineTo each point
│  ├─ Line: lineTo from start to end
│  ├─ Circle: ellipse from bounds center
│  ├─ Rectangle: rect from bounds
│  └─ Text: fillText at position
├─ 5. If rectangular selecting: draw selection rect
├─ 6. If elements selected: draw bounding box + 8 handles
└─ 7. Restore context
```

---

## 🖱️ Pointer Event Flow

```
pointerdown
  ├─ Pan tool or Shift+Click? → Start pan
  ├─ Select tool? → Check handle/bounds/element/rectangle
  ├─ Text tool? → Show input
  ├─ Eraser tool? → Check for freehand nearby
  └─ Drawing tool? → Create element, set isDrawing=true

pointermove (continuous, ~60Hz)
  ├─ Panning? → Update pan
  ├─ Drawing? → Add point or update endpoint
  ├─ Dragging selection? → Update positions
  ├─ Resizing selection? → Update bounds
  ├─ Rectangular selecting? → Update selection rect
  └─ Update cursor

pointerup
  ├─ Finalize operation
  ├─ addToHistory() if needed
  └─ Clear state flags
```

---

## 🎨 Colors & Styling

### Available Colors (11 total)
```
Black (#000000)      Red (#FF0000)       Green (#00FF00)
Blue (#0000FF)       Yellow (#FFFF00)    Magenta (#FF00FF)
Cyan (#00FFFF)       Orange (#FFA500)    Purple (#800080)
Gray (#808080)       White (#FFFFFF)
```

### Background Modes
```
Light: #ffffff (white bg, light gray grid)
Dark:  #1a1a1a (dark bg, dark gray grid)
```

### Pen Sizes
```
2px, 4px, 6px, 8px, 12px, 16px, 20px, 24px
```

---

## 🎯 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+Shift+Z | Redo (alternative) |
| Shift+Click+Drag | Pan |
| Middle Mouse+Drag | Pan |
| Mouse Wheel | Zoom |
| Enter (text mode) | Confirm text |
| Escape (text mode) | Cancel text |

---

## 🔍 Hit Detection

### Point in Bounds
```typescript
isPointInBounds(point, bounds): boolean {
  return point.x >= bounds.x &&
         point.x <= bounds.x + bounds.width &&
         point.y >= bounds.y &&
         point.y <= bounds.y + bounds.height;
}
```

### Rectangle Intersection
```typescript
doRectsIntersect(r1, r2): boolean {
  return !(r1.x + r1.width < r2.x ||
           r2.x + r2.width < r1.x ||
           r1.y + r1.height < r2.y ||
           r2.y + r2.height < r1.y);
}
```

### Resize Handle Detection
```typescript
getResizeHandleAtPoint(point, bounds): ResizeHandle {
  handleSize = 10 / zoom;
  // Check distance from point to 8 handle positions
  if (near nw corner) return 'nw';
  if (near ne corner) return 'ne';
  // ... etc for all 8 handles
  return null;
}
```

---

## 📊 Common Props Patterns

### Page → Toolbar
```typescript
<Toolbar
  selectedTool={selectedTool}
  onToolChange={setSelectedTool}
  penSize={penSize}
  onPenSizeChange={setPenSize}
  color={color}
  onColorChange={setColor}
  zoom={zoom}
  backgroundColor={backgroundColor}
  onBackgroundColorChange={setBackgroundColor}
  onSnapshot={handleSnapshot}
  onUndo={handleUndo}
  onRedo={handleRedo}
  canUndo={canUndo}
  canRedo={canRedo}
/>
```

### Page → Canvas
```typescript
<Canvas
  selectedTool={selectedTool}
  penSize={penSize}
  color={color}
  zoom={zoom}
  onZoomChange={setZoom}
  backgroundColor={backgroundColor}
  onSnapshotRequest={handleSnapshot}
  onHistoryChange={handleHistoryChange}
  undoRequested={undoTrigger}
  redoRequested={redoTrigger}
/>
```

---

## 🐛 Quick Debugging

| Problem | Check |
|---------|-------|
| Drawing is laggy | Is `desynchronized: true` in canvas context? |
| Selection not working | Is calculateBounds() correct for element type? |
| Undo/Redo broken | Is addToHistory() being called? Is historyIndex updating? |
| Buttons not enabling | Is onHistoryChange() being called from Canvas? |
| Text not showing | Is textBaseline set to 'top'? Is font string valid? |
| Zoom not working | Is handleWheel preventing default? Is pan adjustment correct? |

---

## 🚀 Quick Start for Development

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm start            # Run production server
npm run lint         # Run linter
```

---

## 📝 Adding New Features Checklist

### To Add a New Tool
- [ ] Add to Tool type (types/canvas.ts)
- [ ] Add button to Toolbar.tsx
- [ ] Add logic in Canvas.tsx pointerdown/move/up
- [ ] Add drawing code in redrawCanvas()

### To Change Colors
- [ ] Modify colors array in Toolbar.tsx

### To Change Pen Sizes
- [ ] Modify penSizes array in Toolbar.tsx

### To Add Keyboard Shortcut
- [ ] Add condition to handleKeyDown in page.tsx useEffect

### To Modify Drawing Style
- [ ] Update canvas context properties (color, lineWidth, etc.)
- [ ] Update drawing commands in redrawCanvas()

---

## 🎓 Key Learning Points

1. **Low-latency drawing** uses `desynchronized: true` + direct canvas updates
2. **Coordinate transformation** is essential: screenToCanvas for input, canvas context for rendering
3. **History as 2D array** is simple but effective for undo/redo
4. **Bounds-based hit detection** works well for selection
5. **Props + callbacks** is sufficient state management (no Context/Redux needed)
6. **Transform-based pan/zoom** is efficient (no DOM changes)
7. **TypeScript types** help prevent bugs in a visual app

---

## 📚 File You'll Edit Most Often

| Task | File |
|------|------|
| Change colors/sizes/tools | Toolbar.tsx |
| Fix drawing logic | Canvas.tsx |
| Add keyboard shortcut | page.tsx |
| Modify types | types/canvas.ts |
| Change styles | Toolbar.tsx or globals.css |

---

## 🔗 Key Functions to Know

| Function | Purpose | Location |
|----------|---------|----------|
| `screenToCanvas()` | Transform pointer to drawing coords | Canvas.tsx |
| `calculateBounds()` | Get bounding box for hit detection | Canvas.tsx |
| `redrawCanvas()` | Render everything | Canvas.tsx |
| `addToHistory()` | Save state for undo/redo | Canvas.tsx |
| `getResizeHandleAtPoint()` | Check if pointer is on handle | Canvas.tsx |
| `isPointInBounds()` | Check if point is inside bounds | Canvas.tsx |
| `doRectsIntersect()` | Check if rectangles overlap | Canvas.tsx |

---

This quick reference should help you navigate and modify the codebase quickly!
