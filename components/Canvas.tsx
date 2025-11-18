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
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null;

export default function Canvas({
  selectedTool,
  penSize,
  color,
  zoom,
  onZoomChange,
  backgroundColor
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [textInput, setTextInput] = useState<{ element: DrawingElement; position: Point } | null>(null);

  // Selection state
  const [selectedElement, setSelectedElement] = useState<DrawingElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);

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
      const fontSize = element.fontSize || 16;
      const textWidth = (element.text || '').length * fontSize * 0.6;
      return {
        x: element.points[0].x,
        y: element.points[0].y - fontSize,
        width: textWidth,
        height: fontSize * 1.2,
      };
    }

    if (element.type === 'freehand') {
      const xs = element.points.map(p => p.x);
      const ys = element.points.map(p => p.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    if (element.points.length < 2) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    if (element.type === 'line') {
      const minX = Math.min(element.points[0].x, element.points[1].x);
      const maxX = Math.max(element.points[0].x, element.points[1].x);
      const minY = Math.min(element.points[0].y, element.points[1].y);
      const maxY = Math.max(element.points[0].y, element.points[1].y);
      return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
    }

    // For circle and rectangle (now both use corner-to-corner)
    const minX = Math.min(element.points[0].x, element.points[1].x);
    const maxX = Math.max(element.points[0].x, element.points[1].x);
    const minY = Math.min(element.points[0].y, element.points[1].y);
    const maxY = Math.max(element.points[0].y, element.points[1].y);

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }, []);

  // Check if a point is inside element bounds
  const isPointInBounds = useCallback((point: Point, bounds: Bounds): boolean => {
    return point.x >= bounds.x &&
           point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y &&
           point.y <= bounds.y + bounds.height;
  }, []);

  // Get resize handle at point
  const getResizeHandleAtPoint = useCallback((point: Point, bounds: Bounds): ResizeHandle => {
    const handleSize = 8 / zoom;
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

    // Draw grid (adjust color based on background)
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
        // Draw circle using bounding box
        const bounds = calculateBounds(element);
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const radiusX = bounds.width / 2;
        const radiusY = bounds.height / 2;

        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (element.type === 'rectangle') {
        if (element.points.length < 2) return;
        const bounds = calculateBounds(element);
        ctx.beginPath();
        ctx.rect(bounds.x, bounds.y, bounds.width, bounds.height);
        ctx.stroke();
      } else if (element.type === 'text' && element.text) {
        const fontSize = element.fontSize || 16;
        ctx.font = `${fontSize}px Arial, sans-serif`;
        ctx.fillText(element.text, element.points[0].x, element.points[0].y);
      }
    });

    // Draw selection handles
    if (selectedElement && selectedTool === 'select') {
      const bounds = calculateBounds(selectedElement);

      // Draw bounding box
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);
      ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
      ctx.setLineDash([]);

      // Draw resize handles
      const handleSize = 6 / zoom;
      ctx.fillStyle = '#3b82f6';
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
      });
    }

    ctx.restore();
  }, [elements, currentElement, pan, zoom, selectedElement, selectedTool, backgroundColor, calculateBounds]);

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
      // Check if clicking on selected element's resize handle
      if (selectedElement) {
        const bounds = calculateBounds(selectedElement);
        const handle = getResizeHandleAtPoint(canvasPoint, bounds);

        if (handle) {
          setIsResizing(true);
          setResizeHandle(handle);
          setDragStart(canvasPoint);
          return;
        }

        // Check if clicking inside selected element to drag
        if (isPointInBounds(canvasPoint, bounds)) {
          setIsDragging(true);
          setDragStart(canvasPoint);
          return;
        }
      }

      // Check if clicking on any element to select it
      for (let i = elements.length - 1; i >= 0; i--) {
        const element = elements[i];
        const bounds = calculateBounds(element);
        if (isPointInBounds(canvasPoint, bounds)) {
          setSelectedElement(element);
          setDragStart(canvasPoint);
          return;
        }
      }

      // Clicked on empty space, deselect
      setSelectedElement(null);
      return;
    }

    // Text mode
    if (selectedTool === 'text') {
      setTextInput({
        element: {
          id: Date.now().toString(),
          type: 'text',
          points: [canvasPoint],
          color,
          size: penSize,
          text: '',
          fontSize: 20,
        },
        position: { x: screenX, y: screenY }
      });
      return;
    }

    // Drawing mode
    setIsDrawing(true);
    setSelectedElement(null);

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

    // Panning
    if (isPanning) {
      const dx = screenX - lastPanPoint.x;
      const dy = screenY - lastPanPoint.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setLastPanPoint({ x: screenX, y: screenY });
      return;
    }

    // Dragging selected element
    if (isDragging && selectedElement) {
      const dx = canvasPoint.x - dragStart.x;
      const dy = canvasPoint.y - dragStart.y;

      const updatedElement = {
        ...selectedElement,
        points: selectedElement.points.map(p => ({ x: p.x + dx, y: p.y + dy })),
      };

      setElements(elements.map(el => el.id === selectedElement.id ? updatedElement : el));
      setSelectedElement(updatedElement);
      setDragStart(canvasPoint);
      return;
    }

    // Resizing selected element
    if (isResizing && selectedElement && resizeHandle) {
      const bounds = calculateBounds(selectedElement);
      let newBounds = { ...bounds };

      // Update bounds based on resize handle
      if (resizeHandle.includes('n')) newBounds.y = canvasPoint.y;
      if (resizeHandle.includes('s')) newBounds.height = canvasPoint.y - bounds.y;
      if (resizeHandle.includes('w')) newBounds.x = canvasPoint.x;
      if (resizeHandle.includes('e')) newBounds.width = canvasPoint.x - bounds.x;

      // Adjust width/height if we moved top-left corner
      if (resizeHandle.includes('n')) newBounds.height = bounds.y + bounds.height - newBounds.y;
      if (resizeHandle.includes('w')) newBounds.width = bounds.x + bounds.width - newBounds.x;

      // Update element based on type
      let updatedElement = { ...selectedElement };

      if (selectedElement.type === 'rectangle' || selectedElement.type === 'circle') {
        updatedElement.points = [
          { x: newBounds.x, y: newBounds.y },
          { x: newBounds.x + newBounds.width, y: newBounds.y + newBounds.height }
        ];
      } else if (selectedElement.type === 'line') {
        if (resizeHandle === 'nw' || resizeHandle === 'w' || resizeHandle === 'sw') {
          updatedElement.points[0] = { x: newBounds.x, y: updatedElement.points[0].y };
        }
        if (resizeHandle === 'ne' || resizeHandle === 'e' || resizeHandle === 'se') {
          updatedElement.points[1] = { x: newBounds.x + newBounds.width, y: updatedElement.points[1].y };
        }
        if (resizeHandle === 'nw' || resizeHandle === 'n' || resizeHandle === 'ne') {
          updatedElement.points[0] = { x: updatedElement.points[0].x, y: newBounds.y };
        }
        if (resizeHandle === 'sw' || resizeHandle === 's' || resizeHandle === 'se') {
          updatedElement.points[1] = { x: updatedElement.points[1].x, y: newBounds.y + newBounds.height };
        }
      }

      setElements(elements.map(el => el.id === selectedElement.id ? updatedElement : el));
      setSelectedElement(updatedElement);
      return;
    }

    // Update cursor for select mode
    if (selectedTool === 'select' && selectedElement) {
      const bounds = calculateBounds(selectedElement);
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
      }
    }

    // Drawing
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

    if (isDragging) {
      setIsDragging(false);
      return;
    }

    if (isResizing) {
      setIsResizing(false);
      setResizeHandle(null);
      return;
    }

    if (isDrawing && currentElement) {
      setElements([...elements, currentElement]);
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

  // Update cursor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.style.cursor =
      selectedTool === 'pan' ? 'grab' :
      selectedTool === 'select' ? 'default' :
      selectedTool === 'text' ? 'text' :
      'crosshair';
  }, [selectedTool]);

  const handleTextSubmit = (text: string) => {
    if (!textInput) return;

    if (text.trim()) {
      setElements([...elements, { ...textInput.element, text }]);
    }
    setTextInput(null);
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
      {textInput && (
        <input
          key={textInput.element.id}
          type="text"
          autoFocus
          className="fixed z-50 border-2 border-blue-500 outline-none px-3 py-2 rounded bg-white"
          style={{
            left: `${textInput.position.x}px`,
            top: `${textInput.position.y}px`,
            fontSize: `${(textInput.element.fontSize || 20)}px`,
            color: textInput.element.color,
          }}
          onBlur={(e) => handleTextSubmit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleTextSubmit(e.currentTarget.value);
            } else if (e.key === 'Escape') {
              setTextInput(null);
            }
          }}
        />
      )}
    </>
  );
}
