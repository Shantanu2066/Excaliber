'use client';

import { useState, useEffect } from 'react';
import Canvas from '@/components/Canvas';
import Toolbar from '@/components/Toolbar';
import { Tool } from '@/types/canvas';

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [penSize, setPenSize] = useState(4);
  const [color, setColor] = useState('#000000');
  const [zoom, setZoom] = useState(1.0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoTrigger, setUndoTrigger] = useState(0);
  const [redoTrigger, setRedoTrigger] = useState(0);

  const handleSnapshot = () => {
    if ((window as any).__canvasSnapshot) {
      (window as any).__canvasSnapshot();
    }
  };

  const handleUndo = () => {
    setUndoTrigger(prev => prev + 1);
  };

  const handleRedo = () => {
    setRedoTrigger(prev => prev + 1);
  };

  const handleHistoryChange = (canUndoNow: boolean, canRedoNow: boolean) => {
    setCanUndo(canUndoNow);
    setCanRedo(canRedoNow);
  };

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-screen h-screen overflow-hidden">
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
      <div className="pt-[110px]">
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
      </div>
    </div>
  );
}
