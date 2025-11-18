'use client';

import { useState } from 'react';
import Canvas from '@/components/Canvas';
import Toolbar from '@/components/Toolbar';
import { Tool } from '@/types/canvas';
import { createWorker } from 'tesseract.js';

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<Tool>('select');
  const [penSize, setPenSize] = useState(4);
  const [color, setColor] = useState('#000000');
  const [zoom, setZoom] = useState(1.0);
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [ocrText, setOcrText] = useState<string>('');
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);

  const handleSnapshot = () => {
    if ((window as any).__canvasSnapshot) {
      (window as any).__canvasSnapshot();
    }
  };

  const handleOCR = async () => {
    setIsProcessingOCR(true);
    setOcrText('Processing OCR... Please wait...');

    try {
      // Get canvas data
      const canvas = document.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) {
        setOcrText('Error: Canvas not found');
        setIsProcessingOCR(false);
        return;
      }

      // Create Tesseract worker
      const worker = await createWorker('eng');

      // Process the canvas image
      const { data: { text } } = await worker.recognize(canvas);

      await worker.terminate();

      if (text.trim()) {
        setOcrText(`Recognized Text:\n\n${text}`);
        // Also copy to clipboard
        navigator.clipboard.writeText(text).then(() => {
          alert(`OCR Complete!\n\nText copied to clipboard:\n\n${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
        });
      } else {
        setOcrText('No text recognized. Try writing larger or clearer text.');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setOcrText('OCR failed. Please try again.');
    } finally {
      setIsProcessingOCR(false);
    }
  };

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
        onOCR={handleOCR}
      />
      <div className="pt-20">
        <Canvas
          selectedTool={selectedTool}
          penSize={penSize}
          color={color}
          zoom={zoom}
          onZoomChange={setZoom}
          backgroundColor={backgroundColor}
          onSnapshotRequest={handleSnapshot}
        />
      </div>

      {/* OCR Loading Indicator */}
      {isProcessingOCR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-xl p-8 shadow-2xl max-w-md">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
              <p className="text-xl font-bold text-gray-800">Processing OCR...</p>
              <p className="text-sm text-gray-600 mt-2">Reading text from canvas...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
