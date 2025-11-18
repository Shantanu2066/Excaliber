'use client';

import React from 'react';
import { Tool } from '@/types/canvas';

interface ToolbarProps {
  selectedTool: Tool;
  onToolChange: (tool: Tool) => void;
  penSize: number;
  onPenSizeChange: (size: number) => void;
  color: string;
  onColorChange: (color: string) => void;
  zoom: number;
}

const tools: { id: Tool; label: string; icon: string }[] = [
  { id: 'pen', label: 'Pen', icon: '✏️' },
  { id: 'line', label: 'Line', icon: '📏' },
  { id: 'circle', label: 'Circle', icon: '⭕' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'text', label: 'Text', icon: '📝' },
  { id: 'pan', label: 'Pan', icon: '✋' },
];

const penSizes = [2, 4, 6, 8, 12, 16];

const colors = [
  '#000000', // Black
  '#FF0000', // Red
  '#00FF00', // Green
  '#0000FF', // Blue
  '#FFFF00', // Yellow
  '#FF00FF', // Magenta
  '#00FFFF', // Cyan
  '#FFA500', // Orange
  '#800080', // Purple
  '#808080', // Gray
];

export default function Toolbar({
  selectedTool,
  onToolChange,
  penSize,
  onPenSizeChange,
  color,
  onColorChange,
  zoom,
}: ToolbarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-white shadow-md border-b border-gray-300 z-40">
      <div className="flex items-center gap-6 px-4 py-3">
        {/* Tools */}
        <div className="flex items-center gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`px-3 py-2 rounded-lg font-medium transition-all ${
                selectedTool === tool.id
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title={tool.label}
            >
              <span className="mr-1">{tool.icon}</span>
              {tool.label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300" />

        {/* Pen Size */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Size:</label>
          <select
            value={penSize}
            onChange={(e) => onPenSizeChange(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {penSizes.map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300" />

        {/* Color Picker */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Color:</label>
          <div className="flex gap-1">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  color === c ? 'border-blue-500 scale-110' : 'border-gray-300'
                }`}
                style={{ backgroundColor: c }}
                title={c}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gray-300" />

        {/* Zoom Display */}
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Zoom:</label>
          <span className="px-3 py-2 bg-gray-100 rounded-lg font-mono text-sm">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* Instructions */}
        <div className="ml-auto text-sm text-gray-500">
          <span className="font-medium">Tips:</span> Shift+Click or Middle-Click to pan | Scroll to zoom
        </div>
      </div>
    </div>
  );
}
