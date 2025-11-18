'use client';

import { useState } from 'react';
import Canvas from '@/components/Canvas';
import Toolbar from '@/components/Toolbar';
import { Tool } from '@/types/canvas';

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [penSize, setPenSize] = useState(4);
  const [color, setColor] = useState('#000000');
  const [zoom, setZoom] = useState(1.0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');

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
      />
      <div className="pt-20">
        <Canvas
          selectedTool={selectedTool}
          penSize={penSize}
          color={color}
          zoom={zoom}
          onZoomChange={setZoom}
          backgroundColor={backgroundColor}
        />
      </div>
    </div>
  );
}
