'use client';

import { useState } from 'react';
import Canvas from '@/components/Canvas';
import Toolbar from '@/components/Toolbar';
import { Tool } from '@/types/canvas';

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<Tool>('pen');
  const [penSize, setPenSize] = useState(4);
  const [color, setColor] = useState('#000000');
  const [zoom, setZoom] = useState(1.0);

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
      />
      <div className="pt-16">
        <Canvas
          selectedTool={selectedTool}
          penSize={penSize}
          color={color}
          zoom={zoom}
          onZoomChange={setZoom}
        />
      </div>
    </div>
  );
}
