# Canvas Sketching App - Architecture Diagrams & Visual Guides

## 🏗️ Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS 16 APP ROUTER                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │             app/page.tsx - Main Container              │   │
│  │  - Central state management                            │   │
│  │  - Keyboard shortcut handling                          │   │
│  │  - Child prop orchestration                            │   │
│  └────────────┬──────────────────────────────┬────────────┘   │
│               │                              │                 │
│     ┌─────────▼─────────┐         ┌──────────▼──────────┐    │
│     │  Toolbar.tsx      │         │   Canvas.tsx       │    │
│     │  (UI Controls)    │         │ (Drawing Engine)   │    │
│     │                   │         │                    │    │
│     │ • Tool selection  │         │ • Drawing logic    │    │
│     │ • Pen size        │         │ • Rendering        │    │
│     │ • Color picker    │         │ • Selection        │    │
│     │ • Zoom display    │         │ • Pan/Zoom         │    │
│     │ • Snapshot button │         │ • History          │    │
│     │ • Undo/Redo       │         │ • Text input       │    │
│     └───────────────────┘         └────────────────────┘    │
│               △                              △                │
│               │                              │                │
│               └──────────┬───────────────────┘                │
│                          │                                     │
│                    types/canvas.ts                             │
│           (Type definitions & interfaces)                      │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │            Configuration & Assets                       │   │
│  │  • tsconfig.json  • postcss.config.mjs                 │   │
│  │  • next.config.ts • eslint.config.mjs                  │   │
│  │  • globals.css    • package.json                        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 State Management Flow

```
                        PAGE STATE
        ┌───────────────────────────────────┐
        │   app/page.tsx                    │
        │                                   │
        │   • selectedTool: Tool            │
        │   • penSize: number               │
        │   • color: string                 │
        │   • zoom: number                  │
        │   • backgroundColor: string       │
        │   • canUndo/canRedo: boolean      │
        │   • undoTrigger/redoTrigger       │
        └───────────────┬───────────────────┘
                        │
        ┌───────────────┼───────────────────┐
        │               │                   │
        ▼               ▼                   ▼
    TOOLBAR STATE   CANVAS STATE     KEYBOARD STATE
    
    ┌──────────┐  ┌────────────────────────────┐  ┌───────────────┐
    │ Toolbar  │  │     Canvas (Local)         │  │ Keyboard      │
    │          │  │                            │  │ Listeners     │
    │ Display: │  │ • elements[]               │  │               │
    │• Tools   │  │ • history[][]              │  │ Ctrl+Z: Undo  │
    │• Colors  │  │ • selectedElements[]       │  │ Ctrl+Y: Redo  │
    │• Sizes   │  │ • currentElement           │  │               │
    │• Zoom    │  │ • pan: {x, y}              │  └───────────────┘
    │• BG      │  │ • isDrawing: boolean       │
    └──────────┘  │ • isEditingText: boolean   │
                  │ • textValue: string        │
                  │ • selectedElements[]       │
                  │ • isDragging: boolean      │
                  │ • isResizing: boolean      │
                  └────────────────────────────┘
```

---

## 🎯 Tool Pipeline

```
TOOL SELECTION → EVENT HANDLING → ACTION → STATE UPDATE → REDRAW

┌─────────────────────────────────────────────────────────────────┐
│                    SELECTED TOOL                                │
└──────────┬──────────┬─────────┬────────┬─────────┬──────┬───────┘
           │          │         │        │         │      │
      ┌────▼──┐  ┌───▼──┐ ┌────▼─┐ ┌───▼──┐  ┌──▼──┐  ┌─▼──┐
      │SELECT │  │ PEN  │ │LINE  │ │CIRCLE│  │TEXT │  │PAN │
      └────┬──┘  └───┬──┘ └────┬─┘ └───┬──┘  └──┬──┘  └─┬──┘
           │         │         │       │         │      │
      ┌────▼──┐  ┌───▼──┐ ┌────▼─┐ ┌───▼──┐  ┌──▼──┐  └──►│
      │Checks │  │Adds  │ │Draws │ │Draws │  │Shows│  Pan/ 
      │bounds,│  │points│ │2-pt  │ │2-pt  │  │Text │  Zoom
      │handles│  │cont. │ │line  │ │ellip.│  │Box  │
      │      │  │      │ │      │ │      │  │    │
      │Move/ │  │      │ │      │ │      │  │    │
      │Resize│  │      │ │      │ │      │  │    │
      └───┬──┘  └───┬──┘ └────┬─┘ └───┬──┘  └──┬──┘
          │         │         │       │         │
          └─────────┴─────────┴───────┴─────────┘
                    │
            ┌───────▼────────┐
            │  addToHistory  │
            │  redrawCanvas  │
            └─────────────────┘
```

---

## 🎨 Drawing Element Types

```
                    DrawingElement
         ┌──────────────────────────────┐
         │  All have:                   │
         │  • id: string                │
         │  • type: ElementType         │
         │  • points: Point[]           │
         │  • color: string             │
         │  • size: number              │
         └──────────────────────────────┘
                    │
        ┌───────────┼───────────┬──────────────┐
        │           │           │              │
    ┌───▼──┐  ┌────▼───┐  ┌───▼───┐  ┌──────▼──┐
    │FREEHAND│  │SHAPES │  │TEXT   │  │Reserved │
    └───┬──┘  └────┬───┘  └───┬───┘  └──────┬──┘
        │          │          │             │
    ┌───▼──┐   ┌──┴─┬─┬─┐  ┌──▼───┐   ┌────▼──┐
    │Many  │   │   │ │ │  │Single │   │ERASER │
    │points│   │Line││ │  │point  │   │(special
    │      │   │Circ│ │  │+ text │   │tool)
    │      │   │Rect│ │  │+ size │   │
    │      │   │    │ │  │       │   │
    └──────┘   └──2 points┘  └───────┘   └────────┘
                   (start,
                    end)
```

---

## 🖱️ Pointer Event Flow

```
POINTER DOWN
    │
    ├─► Pan Tool? ──► Start Panning
    │
    ├─► Select Tool? ──┬─► Has selected elements? 
    │                   │   ├─► Check resize handle
    │                   │   │   ├─ YES: Start Resize
    │                   │   │   └─ NO: Check if in bounds
    │                   │   │       ├─ YES: Start Drag
    │                   │   │       └─ NO: Check click hit
    │                   │   │
    │                   └─► Check for element under click
    │                       ├─ YES: Select it
    │                       └─ NO: Start Rectangle Select
    │
    ├─► Text Tool? ──► Show Text Input Overlay
    │
    ├─► Eraser Tool? ──► Check freehand elements nearby
    │                    └─► Remove if in radius
    │
    └─► Drawing Tool (Pen/Line/Circle/Rect)
        └─► Create new DrawingElement
            └─► Start drawing


POINTER MOVE
    │
    ├─► Panning? ──► Update pan offset
    │
    ├─► Rectangle Selecting? ──► Update selection rectangle
    │
    ├─► Dragging? ──► Update selected elements position
    │
    ├─► Resizing? ──► Update selected elements size
    │
    ├─► Drawing?
    │   ├─► Freehand? ──► Add point to currentElement
    │   └─► Shape? ──► Update endpoint of currentElement
    │
    └─► Update cursor based on context


POINTER UP
    │
    ├─► Panning? ──► Stop panning
    │
    ├─► Rectangle Selecting? ──► Finalize selection
    │
    ├─► Dragging? ──► addToHistory()
    │
    ├─► Resizing? ──► addToHistory()
    │
    ├─► Drawing? ──► Add to elements, addToHistory()
    │
    └─► Clear state flags
```

---

## 📜 History & Undo/Redo

```
HISTORY ARRAY VISUALIZATION

history = [
  [],                                  ← historyIndex = 0 (Initial)
  [[element1]],                        ← historyIndex = 1
  [[element1, element2]],              ← historyIndex = 2
  [[element1, element2, element3]],    ← historyIndex = 3 ← CURRENT
]

User clicks UNDO (Ctrl+Z)
    ↓
historyIndex--  (3 → 2)
    ↓
setElements(history[2])
    ↓
Canvas redraws with 2 elements


User clicks REDO (Ctrl+Y)
    ↓
historyIndex++  (2 → 3)
    ↓
setElements(history[3])
    ↓
Canvas redraws with 3 elements


User draws new element after UNDO
    ↓
history = history.slice(0, historyIndex + 1)  // Remove future states
    ↓
history.push(newState)  // Add new state
    ↓
historyIndex = history.length - 1
    ↓
Future history branch abandoned!
```

---

## 🎯 Selection System

```
SINGLE SELECTION
    │
    User clicks element with Select tool
    │
    └─► isPointInBounds(click, elementBounds)?
        ├─ YES: selectedElements = [element]
        └─ NO: Check next element (iterate backwards)


RECTANGULAR SELECTION
    │
    User drags on empty area with Select tool
    │
    └─► setIsRectSelecting(true)
        │
        DURING DRAG:
        │
        └─► Update selectionRect
            │
            Canvas draws semi-transparent rectangle
            │
        
        ON RELEASE:
        │
        └─► Find all elements intersecting selectionRect
            │
            ├─► Check each element's bounds
            │   └─► doRectsIntersect(element, selectRect)?
            │       ├─ YES: Add to selectedElements
            │       └─ NO: Skip
            │
            └─► selectedElements now contains multi-select


RESIZE HANDLES
    │
    │  8 Handles Position:
    │
    │   nw ──── n ──── ne
    │   │               │
    │   w               e
    │   │               │
    │   sw ──── s ──── se
    │
    └─► getResizeHandleAtPoint(clickPoint, bounds)
        └─► Check distance from click to each handle
            ├─ If near handle: return handle name
            └─ Otherwise: return null
```

---

## 🔄 Complete Draw & Undo Cycle

```
USER DRAWS A FREEHAND STROKE:

1. pointerdown event
   ├─► screenToCanvas(e.position) → canvasPoint
   ├─► id = Date.now().toString()
   ├─► Create DrawingElement
   │   └─► type: 'freehand'
   │       points: [canvasPoint]
   │       color, size from toolbar
   └─► setCurrentElement(element)
       setIsDrawing(true)

2. pointermove events (continuous, high frequency)
   ├─► screenToCanvas(e.position) → canvasPoint
   ├─► setCurrentElement({...el, points: [...el.points, canvasPoint]})
   ├─► redrawCanvas triggered
   └─► Immediate visual feedback (no lag!)

3. pointerup event
   ├─► newElements = [...elements, currentElement]
   ├─► addToHistory(newElements)
   │   ├─► Calculate new history state
   │   ├─► history.push([...newElements])
   │   ├─► historyIndex++
   │   ├─► Call onHistoryChange(true, false)
   │   │   └─► page.tsx: setCanUndo(true)
   │   └─► Toolbar Undo button becomes enabled
   ├─► setCurrentElement(null)
   └─► setIsDrawing(false)

4. Canvas redraws
   └─► Shows finished stroke


NOW USER PRESSES Ctrl+Z (UNDO):

1. Keyboard event in page.tsx
   └─► setUndoTrigger(prev + 1)

2. Canvas detects undoRequested change
   ├─► historyIndex-- (say 1 → 0)
   ├─► setElements(history[0])  // Restore old state
   ├─► Call onHistoryChange()
   │   └─► page.tsx updates button states
   └─► redrawCanvas()

3. Canvas redraws
   └─► Shows state WITHOUT the stroke


IF USER PRESSES Ctrl+Y (REDO):

1. Keyboard event in page.tsx
   └─► setRedoTrigger(prev + 1)

2. Canvas detects redoRequested change
   ├─► historyIndex++ (0 → 1)
   ├─► setElements(history[1])  // Restore newer state
   ├─► Call onHistoryChange()
   │   └─► page.tsx updates button states
   └─► redrawCanvas()

3. Canvas redraws
   └─► Shows state WITH the stroke again
```

---

## 🔢 Coordinate Transformation

```
SCREEN SPACE (from pointer events)
├─ Origin: (0, 0) at window.top-left
├─ Max: (windowWidth, windowHeight)
└─ Used by: Mouse/Touch/Pen event coordinates

        ↓ TRANSFORM ↓
    screenToCanvas(x, y)
    
    const canvasX = (screenX - pan.x) / zoom;
    const canvasY = (screenY - pan.y) / zoom;

        ↓ RESULT ↓

CANVAS SPACE (for drawing elements)
├─ Origin: (pan.x, pan.y) after transformations
├─ Range: Infinite (can be negative)
└─ Used by: Element coordinates, drawing operations


REVERSE TRANSFORM (Canvas → Screen for rendering):

    ctx.save()
    ctx.translate(pan.x, pan.y)   // Apply pan
    ctx.scale(zoom, zoom)          // Apply zoom
    
    // All subsequent drawing uses canvas coordinates
    // Canvas API automatically transforms to screen
    
    ctx.restore()


VISUAL EXAMPLE:

Before transformation:
  Screen: (400, 300)  Pan: (100, 50)  Zoom: 2
  
  Canvas = ((400 - 100) / 2, (300 - 50) / 2)
         = (300 / 2, 250 / 2)
         = (150, 125)

After pan:
  Screen: (400, 300)  Pan: (200, 100)  Zoom: 2
  
  Canvas = ((400 - 200) / 2, (300 - 100) / 2)
         = (200 / 2, 200 / 2)
         = (100, 100)

After zoom change:
  Screen: (400, 300)  Pan: (200, 100)  Zoom: 1
  
  Canvas = ((400 - 200) / 1, (300 - 100) / 1)
         = (200, 200)
```

---

## 📊 Canvas Rendering Pipeline

```
┌──────────────────────────────┐
│   redrawCanvas() Triggered   │
│   (dependency change)        │
└──────────────┬───────────────┘
               │
    ┌──────────▼─────────────┐
    │ Get 2D Context with    │
    │ • alpha: false         │
    │ • desynchronized: true │
    └──────────┬─────────────┘
               │
    ┌──────────▼─────────────┐
    │ Clear Canvas           │
    │ ctx.fillStyle = bg     │
    │ ctx.fillRect(0,0,w,h)  │
    └──────────┬─────────────┘
               │
    ┌──────────▼─────────────┐
    │ Save Context State     │
    │ Apply Transformations: │
    │ • translate(pan.x,y)   │
    │ • scale(zoom, zoom)    │
    └──────────┬─────────────┘
               │
    ┌──────────▼──────────────────┐
    │ Draw Grid Background        │
    │ Lines every 50 canvas units │
    │ Color adapts to BG theme    │
    └──────────┬──────────────────┘
               │
    ┌──────────▼──────────────────────┐
    │ Draw All Elements               │
    │ For each in [...elements, ..]:  │
    │                                 │
    │ Freehand: ─────────────────     │
    │   ctx.moveTo(start)             │
    │   ctx.lineTo(each point)        │
    │                                 │
    │ Line: ──────────────────────    │
    │   ctx.moveTo(p[0])              │
    │   ctx.lineTo(p[1])              │
    │                                 │
    │ Circle: ────────────────────    │
    │   ctx.ellipse(center,r,r)       │
    │                                 │
    │ Rectangle: ─────────────────    │
    │   ctx.rect(bounds)              │
    │                                 │
    │ Text: ──────────────────────    │
    │   ctx.fillText(text, x, y)      │
    └──────────┬──────────────────────┘
               │
    ┌──────────▼──────────────────────┐
    │ Draw Selection Rectangle        │
    │ (if isRectSelecting = true)     │
    │ • Semi-transparent fill         │
    │ • Dashed blue border            │
    └──────────┬──────────────────────┘
               │
    ┌──────────▼──────────────────────┐
    │ Draw Selection Handles          │
    │ (if elements selected)          │
    │ • Blue dashed bounding box      │
    │ • 8 white square handles        │
    │   (corners + edge midpoints)    │
    └──────────┬──────────────────────┘
               │
    ┌──────────▼──────────────────────┐
    │ Restore Canvas State            │
    │ ctx.restore()                   │
    └──────────┬──────────────────────┘
               │
    ┌──────────▼──────────────────────┐
    │ Rendering Complete              │
    │ Visual Update Displayed          │
    └──────────────────────────────────┘
```

---

## 🎮 Tool Usage Decision Tree

```
                        USER ACTION
                            │
                ┌───────────┴───────────┐
                │                       │
            CLICK                   CLICK + DRAG
            │                           │
            │                       ┌───┴────┬─────────────┐
            │                       │        │             │
            │                   SHORT    LONG       VERY LONG
            │                   DRAG     DRAG           DRAG
            │                   │        │             │
    ┌───────┼───────────────┬───▼──┬────▼────┬─────────▼──────┐
    │       │               │      │         │                │
    ▼       ▼               ▼      ▼         ▼                ▼
  SELECT  TEXT           SELECT  DRAW    RECTANGULAR    PAN
  TOOL    TOOL           TOOL    TOOL    SELECTION      TOOL
    │       │              │       │         │            │
    │   Show         ┌─────┼───┐   │         │            │
    │   Text    Has  │         │   │         │            │
    │   Input  Sel?  │ DRAG    RESIZE   MULTI-SELECT    PAN
    │         │      │ MOVE    │        │
    │      ┌──┴──┬──▼─┐       ▼        │
    │      │     │    │      YES       │
    │    YES    NO   RESIZE          │
    │     │      │    │              │
    │     │   NEW     └──►Add to      │
    │     │  SELECT       Selected    │
    │     │   │                       │
    │     │   ▼                       │
    │   MOVE │                        │
    │ SELECTED├─► addToHistory()      │
    │     │   │                       │
    │     └───┴────────┬──────────────┘
    │                  │
    │                  ▼
    │          redrawCanvas()
    │                  │
    │                  ▼
    └─► USER SEES RESULT
```

---

## 🚀 Performance Strategy

```
LOW-LATENCY DRAWING APPROACH:

┌────────────────────────────────────────────────────┐
│ Minimize Input-to-Visual Feedback Delay            │
│                                                    │
│ User moves pen → Visual update on screen           │
│ Target: < 50ms (ideally < 20ms for tablets)       │
└────────────┬───────────────────────────────────────┘
             │
    ┌────────▼────────┬──────────┬──────────┐
    │                 │          │          │
    │           Canvas  │  No React│  Direct │
    │         Options  │  Batching│ Canvas  │
    │                 │          │          │
    │   alpha: false  │ pointermove events  │
    │   desynced: true│ don't trigger state │ DOM
    │                │ updates, just canvas│ updates
    │                │ context updates     │
    │                │                     │
    └────────────────┴─────────┬────────────┘
                              │
                    ┌─────────▼────────┐
                    │  requestAnimFrame │
                    │   redrawCanvas()  │
                    │                   │
                    │  Batches updates  │
                    │  at 60 FPS        │
                    └───────────────────┘
```

---

## 📱 Event System

```
POINTER EVENTS UNIFIED API:
(Mouse, Touch, Pen - all through one interface)

Browser Pointer Event
    │
    ├─► onPointerDown
    │   ├─► Get client position
    │   ├─► Transform to canvas coords
    │   ├─► Check tool & context
    │   └─► Set initial state
    │
    ├─► onPointerMove (high frequency, ~60Hz)
    │   ├─► Get client position
    │   ├─► Transform to canvas coords
    │   ├─► Update element/selection
    │   ├─► Update cursor
    │   └─► Trigger redraw (via dependency)
    │
    ├─► onPointerUp
    │   ├─► Finalize operation
    │   ├─► Add to history if needed
    │   ├─► Clear temporary state
    │   └─► Trigger final redraw
    │
    └─► onPointerLeave
        └─► Same as onPointerUp (safety)
        
        
ADDITIONAL EVENTS:

onWheel
    ├─► e.preventDefault()
    ├─► Calculate zoom delta
    ├─► Calculate pan adjustment
    │   (keep mouse point centered)
    └─► Update zoom & pan

Keyboard (Global in page.tsx)
    ├─► Ctrl+Z: Undo
    ├─► Ctrl+Y: Redo
    ├─► Shift+Click: Pan mode
    └─► Text input: Enter, Escape
```

---

## 💾 File I/O Operations

```
SNAPSHOT (Download):

Take Snapshot button clicked
    │
    ├─► Canvas reference
    │   └─► canvas.toBlob()
    │
    ├─► Create blob URL
    │   └─► URL.createObjectURL(blob)
    │
    ├─► Create link element
    │   ├─► filename = canvas-snapshot-YYYY-MM-DD_HH-MM-SS.png
    │   ├─► link.download = filename
    │   ├─► link.href = blobURL
    │
    ├─► Trigger download
    │   └─► link.click()
    │
    └─► Cleanup
        └─► URL.revokeObjectURL(blobURL)
```

---

## 📈 Complexity Metrics

```
CODE DISTRIBUTION:

Canvas.tsx: 843 lines (69%)
├─ Type definitions: ~50 lines
├─ State declarations: ~60 lines
├─ Utility functions: ~200 lines (bounds, transforms, hit-detection)
├─ Event handlers: ~400 lines (pointer, wheel, text)
└─ Rendering: ~100 lines

Toolbar.tsx: 210 lines (17%)
├─ Component definition: ~180 lines
└─ Styling/JSX: ~30 lines

page.tsx: 89 lines (7%)
├─ State management: ~30 lines
├─ Callbacks: ~20 lines
└─ Keyboard handling: ~39 lines

Types: 34 lines (3%)

Others: 50 lines (4%)

TOTAL: ~1,226 lines


CYCLOMATIC COMPLEXITY:
- Canvas.tsx: HIGH (many conditional branches)
- Toolbar.tsx: LOW (mostly presentational)
- page.tsx: LOW (simple orchestration)

FUNCTIONAL AREAS:
- Rendering: 15% of code
- Event Handling: 30% of code
- State Management: 20% of code
- Geometry/Math: 20% of code
- UI/Layout: 15% of code
```

---

These diagrams provide visual representations of how all the code components work together in the Canvas Sketching App!
