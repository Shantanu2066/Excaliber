'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingElement, Point, Tool, Bounds } from '@/types/canvas';

interface CanvasProps {
  selectedTool: Tool;
  penSize: number;
  color: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  backgroundColor: string;
  onSnapshotRequest: () => void;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export default function Canvas({
  selectedTool,
  penSize,
  color,
  zoom,
  onZoomChange,
  backgroundColor,
  onSnapshotRequest
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [history, setHistory] = useState<DrawingElement[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [isEditingText, setIsEditingText] = useState(false);
  const [textPosition, setTextPosition] = useState<Point>({ x: 0, y: 0 });
  const [textValue, setTextValue] = useState('');

  // Selection state
  const [selectedElements, setSelectedElements] = useState<DrawingElement[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);

  // Rectangular selection
  const [isRectSelecting, setIsRectSelecting] = useState(false);
  const [selectionRect, setSelectionRect] = useState<{ start: Point; end: Point } | null>(null);

  // Add to history
  const addToHistory = useCallback((newElements: DrawingElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setElements(newElements);
  }, [history, historyIndex]);

  // Undo/Redo handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        // Undo
        if (historyIndex > 0) {
          setHistoryIndex(historyIndex - 1);
          setElements(history[historyIndex - 1]);
        }
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        // Redo
        if (historyIndex < history.length - 1) {
          setHistoryIndex(historyIndex + 1);
          setElements(history[historyIndex + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [history, historyIndex]);

  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Calculate bounds for an element
  const calculateBounds = useCallback((element: DrawingElement): Bounds => {
    if (element.type === 'text' && element.points.length > 0) {
      const fontSize = element.fontSize || 24;
      const textWidth = Math.max((element.text || '').length * fontSize * 0.6, 20);
      return {
        x: element.points[0].x,
        y: element.points[0].y,
        width: textWidth,
        height: fontSize * 1.2,
      };
    }

    if (element.type === 'freehand') {
      if (element.points.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
      const xs = element.points.map(p => p.x);
      const ys = element.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const padding = element.size / 2;
      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2
      };
    }

    if (element.points.length < 2) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    if (element.type === 'line') {
      const minX = Math.min(element.points[0].x, element.points[1].x);
      const maxX = Math.max(element.points[0].x, element.points[1].x);
      const minY = Math.min(element.points[0].y, element.points[1].y);
      const maxY = Math.max(element.points[0].y, element.points[1].y);
      const padding = element.size / 2;
      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2
      };
    }

    // For circle and rectangle
    const minX = Math.min(element.points[0].x, element.points[1].x);
    const maxX = Math.max(element.points[0].x, element.points[1].x);
    const minY = Math.min(element.points[0].y, element.points[1].y);
    const maxY = Math.max(element.points[0].y, element.points[1].y);

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, []);

  // Calculate combined bounds for multiple elements
  const calculateCombinedBounds = useCallback((elements: DrawingElement[]): Bounds => {
    if (elements.length === 0) return { x: 0, y: 0, width: 0, height: 0 };

    const bounds = elements.map(calculateBounds);
    const minX = Math.min(...bounds.map(b => b.x));
    const minY = Math.min(...bounds.map(b => b.y));
    const maxX = Math.max(...bounds.map(b => b.x + b.width));
    const maxY = Math.max(...bounds.map(b => b.y + b.height));

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, [calculateBounds]);

  // Check if a point is inside element bounds
  const isPointInBounds = useCallback((point: Point, bounds: Bounds): boolean => {
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }, []);

  // Check if two rectangles intersect
  const doRectsIntersect = useCallback((rect1: Bounds, rect2: Bounds): boolean => {
    return !(rect1.x + rect1.width < rect2.x ||
             rect2.x + rect2.width < rect1.x ||
             rect1.y + rect1.height < rect2.y ||
             rect2.y + rect2.height < rect1.y);
  }, []);

  // Get resize handle at point
  const getResizeHandleAtPoint = useCallback((point: Point, bounds: Bounds): ResizeHandle => {
    const handleSize = 10 / zoom;
    const { x, y, width, height } = bounds;

    // Check corners first
    if (Math.abs(point.x - x) < handleSize && Math.abs(point.y - y) < handleSize) return 'nw';
    if (Math.abs(point.x - (x + width)) < handleSize && Math.abs(point.y - y) < handleSize) return 'ne';
    if (Math.abs(point.x - x) < handleSize && Math.abs(point.y - (y + height)) < handleSize) return 'sw';
    if (Math.abs(point.x - (x + width)) < handleSize && Math.abs(point.y - (y + height)) < handleSize) return 'se';

    // Check edges
    if (Math.abs(point.y - y) < handleSize && point.x >= x && point.x <= x + width) return 'n';
    if (Math.abs(point.y - (y + height)) < handleSize && point.x >= x && point.x <= x + width) return 's';
    if (Math.abs(point.x - x) < handleSize && point.y >= y && point.y <= y + height) return 'w';
    if (Math.abs(point.x - (x + width)) < handleSize && point.y >= y && point.y <= y + height) return 'e';

    return null;
  }, [zoom]);

  // Draw all elements on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) return;

    // Clear canvas with background color
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    ctx.strokeStyle = backgroundColor === '#1a1a1a' ? '#333' : '#e5e7eb';
    ctx.lineWidth = 1 / zoom;
    const gridSize = 50;
    const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize;
    const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize;
    const endX = Math.ceil((canvas.width - pan.x) / zoom / gridSize) * gridSize;
    const endY = Math.ceil((canvas.height - pan.y) / zoom / gridSize) * gridSize;

    for (let x = startX; x <= endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }
    for (let y = startY; y <= endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw all elements
    [...elements, ...(currentElement ? [currentElement] : [])].forEach((element) => {
      ctx.strokeStyle = element.color;
      ctx.fillStyle = element.color;
      ctx.lineWidth = element.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (element.type === 'freehand') {
        if (element.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        for (let i = 1; i < element.points.length; i++) {
          ctx.lineTo(element.points[i].x, element.points[i].y);
        }
        ctx.stroke();
      } else if (element.type === 'line') {
        if (element.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(element.points[0].x, element.points[0].y);
        ctx.lineTo(element.points[1].x, element.points[1].y);
        ctx.stroke();
      } else if (element.type === 'circle') {
        if (element.points.length < 2) return;
        const bounds = calculateBounds(element);
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const radiusX = bounds.width / 2;
        const radiusY = bounds.height / 2;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.abs(radiusX), Math.abs(radiusY), 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (element.type === 'rectangle') {
        if (element.points.length < 2) return;
        const bounds = calculateBounds(element);
        ctx.beginPath();
        ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.stroke();
      } else if (element.type === 'text' && element.text) {
        const fontSize = element.fontSize || 24;
        ctx.font = `bold ${fontSize}px Arial, sans-serif`;
        ctx.fillStyle = element.color;
        ctx.textBaseline = 'top';
        ctx.fillText(element.text, element.points[0].x, element.points[0].y);
      }
    });

    // Draw selection rectangle (during rectangular selection)
    if (isRectSelecting && selectionRect) {
      const minX = Math.min(selectionRect.start.x, selectionRect.end.x);
      const minY = Math.min(selectionRect.start.y, selectionRect.end.y);
      const width = Math.abs(selectionRect.end.x - selectionRect.start.x);
      const height = Math.abs(selectionRect.end.y - selectionRect.start.y);

      ctx.strokeStyle = '#3b82f6';
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);

      ctx.fillRect(minX, minY, width, height);
      ctx.strokeRect(minX, minY, width, height);
      ctx.setLineDash([]);
    }

    // Draw selection handles for selected elements
    if (selectedElements.length > 0 && selectedTool === 'select' && !isRectSelecting) {
      const bounds = calculateCombinedBounds(selectedElements);

      // Draw bounding box
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.setLineDash([]);

      // Draw resize handles
      const handleSize = 8 / zoom;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / zoom;

      const handles = [
        { x: bounds.x, y: bounds.y }, // nw
        { x: bounds.x + bounds.width, y: bounds.y }, // ne
        { x: bounds.x, y: bounds.y + bounds.height }, // sw
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height }, // se
        { x: bounds.x + bounds.width / 2, y: bounds.y }, // n
        { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height }, // s
        { x: bounds.x, y: bounds.y + bounds.height / 2 }, // w
        { x: bounds.x + bounds.width, y: bounds.y + bounds.height / 2 }, // e
      ];

      handles.forEach(handle => {
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
        ctx.strokeRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
      });
    }

    ctx.restore();
  }, [elements, currentElement, pan, zoom, selectedElements, selectedTool, backgroundColor, calculateBounds, calculateCombinedBounds, isRectSelecting, selectionRect]);

  // Snapshot function to download current canvas view
  const takeSnapshot = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      canvas.toBlob((blob) => {
        if (!blob) return;

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' +
                          new Date().toLocaleTimeString('en-US', { hour12: false }).replace(/:/g, '-');
        link.download = `canvas-snapshot-${timestamp}.png`;
        link.href = url;
        link.click();

        setTimeout(() => URL.revokeObjectURL(url), 100);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
    }
  }, []);

  // Expose snapshot function via callback
  useEffect(() => {
    (window as any).__canvasSnapshot = takeSnapshot;
  }, [takeSnapshot]);

  // Resize canvas to window size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      redrawCanvas();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawCanvas]);

  // Redraw when dependencies change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const handlePointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const canvasPoint = screenToCanvas(screenX, screenY);

    // Pan mode
    if (selectedTool === 'pan' || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setLastPanPoint({ x: screenX, y: screenY });
      canvas.style.cursor = 'grabbing';
      return;
    }

    // Select mode
    if (selectedTool === 'select') {
      if (selectedElements.length > 0) {
        const bounds = calculateCombinedBounds(selectedElements);
        const handle = getResizeHandleAtPoint(canvasPoint, bounds);

        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStart(canvasPoint);
          return;
        }

        if (isPointInBounds(canvasPoint, bounds)) {
          setIsDragging(true);
          setDragStart(canvasPoint);
          return;
        }
      }

      let clickedElement: DrawingElement | null = null;
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        const bounds = calculateBounds(element);
        if (isPointInBounds(canvasPoint, bounds)) {
          clickedElement = element;
          break;
        }
      }

      if (clickedElement) {
        setSelectedElements([clickedElement]);
        setDragStart(canvasPoint);
        return;
      }

      setIsRectSelecting(true);
      setSelectionRect({ start: canvasPoint, end: canvasPoint });
      setSelectedElements([]);
      return;
    }

    // Text mode
    if (selectedTool === 'text') {
      setIsEditingText(true);
      setTextPosition({ x: screenX, y: screenY });
      setTextValue('');
      setTimeout(() => textInputRef.current?.focus(), 100);
      return;
    }

    // Drawing mode
    setIsDrawing(true);
    setSelectedElements([]);

    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: selectedTool === 'pen' ? 'freehand' : selectedTool,
      points: [canvasPoint],
      color,
      size: penSize,
    };

    setCurrentElement(newElement);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const canvasPoint = screenToCanvas(screenX, screenY);

    if (isPanning) {
      const dx = screenX - lastPanPoint.x;
      const dy = screenY - lastPanPoint.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setLastPanPoint({ x: screenX, y: screenY });
      return;
    }

    if (isRectSelecting && selectionRect) {
      setSelectionRect({ ...selectionRect, end: canvasPoint });
      return;
    }

    if (isDragging && selectedElements.length > 0) {
      const dx = canvasPoint.x - dragStart.x;
      const dy = canvasPoint.y - dragStart.y;

      const updatedElements = elements.map(el => {
        const isSelected = selectedElements.some(sel => sel.id === el.id);
        if (isSelected) {
          return {
            ...el,
            points: el.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
          };
        }
        return el;
      });

      setElements(updatedElements);
      setSelectedElements(selectedElements.map(sel => ({
        ...sel,
        points: sel.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
      })));
      setDragStart(canvasPoint);
      return;
    }

    if (isResizing && selectedElements.length > 0 && resizeHandle) {
      const oldBounds = calculateCombinedBounds(selectedElements);
      let newBounds = { ...oldBounds };

      if (resizeHandle.includes('n')) {
        newBounds.height = oldBounds.y + oldBounds.height - canvasPoint.y;
        newBounds.y = canvasPoint.y;
      }
      if (resizeHandle.includes('s')) {
        newBounds.height = canvasPoint.y - oldBounds.y;
      }
      if (resizeHandle.includes('w')) {
        newBounds.width = oldBounds.x + oldBounds.width - canvasPoint.x;
        newBounds.x = canvasPoint.x;
      }
      if (resizeHandle.includes('e')) {
        newBounds.width = canvasPoint.x - oldBounds.x;
      }

      const scaleX = newBounds.width / oldBounds.width;
      const scaleY = newBounds.height / oldBounds.height;

      const updatedElements = elements.map(el => {
        const isSelected = selectedElements.some(sel => sel.id === el.id);
        if (isSelected) {
          return {
            ...el,
            points: el.points.map(p => ({
              x: newBounds.x + (p.x - oldBounds.x) * scaleX,
              y: newBounds.y + (p.y - oldBounds.y) * scaleY,
            })),
          };
        }
        return el;
      });

      setElements(updatedElements);
      setSelectedElements(selectedElements.map(sel => ({
        ...sel,
        points: sel.points.map(p => ({
          x: newBounds.x + (p.x - oldBounds.x) * scaleX,
          y: newBounds.y + (p.y - oldBounds.y) * scaleY,
        })),
      })));
      return;
    }

    if (selectedTool === 'select' && selectedElements.length > 0 && !isRectSelecting) {
      const bounds = calculateCombinedBounds(selectedElements);
      const handle = getResizeHandleAtPoint(canvasPoint, bounds);

      if (handle) {
        const cursors: { [key: string]: string } = {
          'nw': 'nw-resize', 'ne': 'ne-resize', 'sw': 'sw-resize', 'se': 'se-resize',
          'n': 'n-resize', 's': 's-resize', 'w': 'w-resize', 'e': 'e-resize',
        };
        canvas.style.cursor = cursors[handle];
        return;
      } else if (isPointInBounds(canvasPoint, bounds)) {
        canvas.style.cursor = 'move';
        return;
      } else {
        canvas.style.cursor = 'crosshair';
      }
    }

    if (!isDrawing || !currentElement) return;

    if (currentElement.type === 'freehand') {
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, canvasPoint],
      });
    } else {
      setCurrentElement({
        ...currentElement,
        points: [currentElement.points[0], canvasPoint],
      });
    }
  };

  const handlePointerUp = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPanning) {
      setIsPanning(false);
      canvas.style.cursor = selectedTool === 'pan' ? 'grab' : 'default';
      return;
    }

    if (isRectSelecting && selectionRect) {
      const minX = Math.min(selectionRect.start.x, selectionRect.end.x);
      const minY = Math.min(selectionRect.start.y, selectionRect.end.y);
      const maxX = Math.max(selectionRect.start.x, selectionRect.end.x);
      const maxY = Math.max(selectionRect.start.y, selectionRect.end.y);
      const rectBounds = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };

      const selected = elements.filter(el => {
        const bounds = calculateBounds(el);
        return doRectsIntersect(bounds, rectBounds);
      });

      setSelectedElements(selected);
      setIsRectSelecting(false);
      setSelectionRect(null);
      return;
    }

    if (isDragging) {
      setIsDragging(false);
      addToHistory(elements);
      return;
    }

    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      addToHistory(elements);
      return;
    }

    if (isDrawing && currentElement) {
      const newElements = [...elements, currentElement];
      addToHistory(newElements);
      setCurrentElement(null);
    }
    setIsDrawing(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

    const zoomRatio = newZoom / zoom;
    const newPanX = mouseX - (mouseX - pan.x) * zoomRatio;
    const newPanY = mouseY - (mouseY - pan.y) * zoomRatio;

    setPan({ x: newPanX, y: newPanY });
    onZoomChange(newZoom);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.cursor =
      selectedTool === 'pan' ? 'grab' :
      selectedTool === 'select' ? 'default' :
      selectedTool === 'text' ? 'text' :
      'crosshair';
  }, [selectedTool]);

  const handleTextSubmit = () => {
    if (!isEditingText || !textValue.trim()) {
      setIsEditingText(false);
      setTextValue('');
      return;
    }

    const canvasPoint = screenToCanvas(textPosition.x, textPosition.y);
    const newElement: DrawingElement = {
      id: Date.now().toString(),
      type: 'text',
      points: [canvasPoint],
      color,
      size: penSize,
      text: textValue.trim(),
      fontSize: 24,
    };

    const newElements = [...elements, newElement];
    addToHistory(newElements);
    setIsEditingText(false);
    setTextValue('');
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
        className="touch-none"
        style={{ display: 'block' }}
      />
      {isEditingText && (
        <div
          className="fixed z-50"
          style={{
            left: `${textPosition.x}px`,
            top: `${textPosition.y}px`,
          }}
        >
          <input
            ref={textInputRef}
            type="text"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Type text here..."
            className="border-2 border-blue-500 outline-none px-4 py-2 rounded-lg bg-white shadow-lg font-bold text-2xl"
            style={{
              color: color,
              minWidth: '250px',
            }}
            onBlur={handleTextSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTextSubmit();
              } else if (e.key === 'Escape') {
                setIsEditingText(false);
                setTextValue('');
              }
            }}
          />
        </div>
      )}
    </>
  );
}
