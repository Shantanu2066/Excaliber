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
  backgroundColor: string;
  onBackgroundColorChange: (color: string) => void;
  onSnapshot: () => void;
  onOCR: () => void;
}

const tools: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '⬆️' },
  { id: 'pen', label: 'Pen', icon: '✏️' },
  { id: 'line', label: 'Line', icon: '📏' },
  { id: 'circle', label: 'Circle', icon: '⭕' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'text', label: 'Text', icon: '📝' },
  { id: 'pan', label: 'Pan', icon: '✋' },
];

const penSizes = [2, 4, 6, 8, 12, 16, 20, 24];

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
  '#FFFFFF', // White
];

export default function Toolbar({
  selectedTool,
  onToolChange,
  penSize,
  onPenSizeChange,
  color,
  onColorChange,
  zoom,
  backgroundColor,
  onBackgroundColorChange,
  onSnapshot,
  onOCR,
}: ToolbarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-50 to-slate-100 shadow-lg border-b-2 border-slate-200 z-[9999]">
      <div className="flex items-center justify-between gap-6 px-6 py-4">
        {/* Left side - Tools */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-md p-2">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => onToolChange(tool.id)}
                className={`group relative px-4 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  selectedTool === tool.id
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:scale-102'
                }`}
                title={tool.label}
              >
                <span className="text-lg mr-1.5">{tool.icon}</span>
                <span className="text-xs font-bold tracking-wide">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center - Controls */}
        <div className="flex items-center gap-6">
          {/* Pen Size */}
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-md px-4 py-2.5">
            <label className="text-sm font-bold text-slate-700 tracking-wide">SIZE</label>
            <select
              value={penSize}
              onChange={(e) => onPenSizeChange(Number(e.target.value))}
              className="px-3 py-1.5 border-2 border-slate-200 rounded-lg font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 cursor-pointer hover:border-blue-300 transition-colors"
            >
              {penSizes.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-md px-4 py-2.5">
            <label className="text-sm font-bold text-slate-700 tracking-wide">COLOR</label>
            <div className="flex gap-1.5">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={`w-9 h-9 rounded-lg border-3 transition-all duration-200 hover:scale-110 ${
                    color === c
                      ? 'border-blue-500 ring-2 ring-blue-300 scale-110 shadow-lg'
                      : 'border-slate-300 hover:border-slate-400'
                  }`}
                  style={{
                    backgroundColor: c,
                    boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #e2e8f0' : undefined
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {/* Background Toggle */}
          <div className="flex items-center gap-3 bg-white rounded-xl shadow-md px-4 py-2.5">
            <label className="text-sm font-bold text-slate-700 tracking-wide">BG</label>
            <div className="flex gap-2">
              <button
                onClick={() => onBackgroundColorChange('#ffffff')}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                  backgroundColor === '#ffffff'
                    ? 'bg-slate-100 text-slate-900 ring-2 ring-slate-300'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ☀️ Light
              </button>
              <button
                onClick={() => onBackgroundColorChange('#1a1a1a')}
                className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                  backgroundColor === '#1a1a1a'
                    ? 'bg-slate-800 text-white ring-2 ring-slate-600'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🌙 Dark
              </button>
            </div>
          </div>
        </div>

        {/* Right side - Info */}
        <div className="flex items-center gap-4">
          {/* Snapshot Button */}
          <button
            onClick={onSnapshot}
            className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 font-bold text-sm"
            title="Download current view as image"
          >
            <span className="text-lg">📸</span>
            <span>Snapshot</span>
          </button>

          {/* OCR Button */}
          <button
            onClick={onOCR}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 font-bold text-sm"
            title="Extract text from handwriting (OCR)"
          >
            <span className="text-lg">🔍</span>
            <span>OCR</span>
          </button>

          {/* Zoom Display */}
          <div className="flex items-center gap-2 bg-white rounded-xl shadow-md px-4 py-2.5">
            <label className="text-sm font-bold text-slate-700 tracking-wide">ZOOM</label>
            <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg font-mono text-sm font-bold text-blue-700">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Quick Tips */}
          <div className="hidden xl:flex items-center gap-2 text-xs text-slate-600 bg-white rounded-xl shadow-md px-4 py-2.5">
            <span className="font-bold text-slate-700">💡</span>
            <span className="font-medium">
              <kbd className="px-2 py-0.5 bg-slate-100 rounded font-mono text-xs">Shift+Click</kbd> or{' '}
              <kbd className="px-2 py-0.5 bg-slate-100 rounded font-mono text-xs">Scroll</kbd> to navigate
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
