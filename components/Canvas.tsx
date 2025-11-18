'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingElement, Point, Tool } from '@/types/canvas';

interface CanvasProps {
  selectedTool: Tool;
  penSize: number;
  color: string;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export default function Canvas({ selectedTool, penSize, color, zoom, onZoomChange }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [elements, setElements] = useState<DrawingElement[]>([]);
  const [currentElement, setCurrentElement] = useState<DrawingElement | null>(null);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [lastPanPoint, setLastPanPoint] = useState<Point>({ x: 0, y: 0 });
  const [textElements, setTextElements] = useState<Array<{ element: DrawingElement; isEditing: boolean }>>([]);

  // Transform screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
    return {
      x: (screenX - pan.x) / zoom,
      y: (screenY - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Draw all elements on canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true, // Reduces latency
    });
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Apply transformations
    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
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
        const radius = Math.sqrt(
          Math.pow(element.points[1].x - element.points[0].x, 2) +
          Math.pow(element.points[1].y - element.points[0].y, 2)
        );
        ctx.beginPath();
        ctx.arc(element.points[0].x, element.points[0].y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (element.type === 'rectangle') {
        if (element.points.length < 2) return;
        const width = element.points[1].x - element.points[0].x;
        const height = element.points[1].y - element.points[0].y;
        ctx.beginPath();
        ctx.rect(element.points[0].x, element.points[0].y, width, height);
        ctx.stroke();
      }
    });

    ctx.restore();
  }, [elements, currentElement, pan, zoom]);

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

    if (selectedTool === 'pan' || e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true);
      setLastPanPoint({ x: screenX, y: screenY });
      canvas.style.cursor = 'grabbing';
      return;
    }

    if (selectedTool === 'text') {
      const canvasPoint = screenToCanvas(screenX, screenY);
      const newTextElement: DrawingElement = {
        id: Date.now().toString(),
        type: 'text',
        points: [canvasPoint],
        color,
        size: penSize,
        text: '',
        fontSize: 16,
      };
      setTextElements([...textElements, { element: newTextElement, isEditing: true }]);
      return;
    }

    setIsDrawing(true);
    const canvasPoint = screenToCanvas(screenX, screenY);

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

    if (isPanning) {
      const dx = screenX - lastPanPoint.x;
      const dy = screenY - lastPanPoint.y;
      setPan({ x: pan.x + dx, y: pan.y + dy });
      setLastPanPoint({ x: screenX, y: screenY });
      return;
    }

    if (!isDrawing || !currentElement) return;

    const canvasPoint = screenToCanvas(screenX, screenY);

    if (currentElement.type === 'freehand') {
      // For freehand, add points continuously for smooth drawing
      setCurrentElement({
        ...currentElement,
        points: [...currentElement.points, canvasPoint],
      });
    } else {
      // For shapes, update the second point
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
      canvas.style.cursor = selectedTool === 'pan' ? 'grab' : 'crosshair';
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

    // Zoom in/out
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * delta));

    // Adjust pan to zoom towards mouse position
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
      selectedTool === 'text' ? 'text' :
      'crosshair';
  }, [selectedTool]);

  const handleTextSubmit = (textElement: DrawingElement, text: string) => {
    if (text.trim()) {
      setElements([...elements, { ...textElement, text }]);
    }
    setTextElements(textElements.filter(t => t.element.id !== textElement.id));
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
      {textElements.map(({ element, isEditing }) => (
        isEditing && (
          <input
            key={element.id}
            type="text"
            autoFocus
            className="fixed z-50 border-2 border-blue-500 outline-none px-2 py-1"
            style={{
              left: `${element.points[0].x * zoom + pan.x}px`,
              top: `${element.points[0].y * zoom + pan.y}px`,
              fontSize: `${(element.fontSize || 16) * zoom}px`,
              color: element.color,
            }}
            onBlur={(e) => handleTextSubmit(element, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleTextSubmit(element, e.currentTarget.value);
              } else if (e.key === 'Escape') {
                setTextElements(textElements.filter(t => t.element.id !== element.id));
              }
            }}
          />
        )
      ))}
    </>
  );
}
