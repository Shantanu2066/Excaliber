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
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const tools: { id: Tool; label: string; icon: string }[] = [
  { id: 'select', label: 'Select', icon: '⬆️' },
  { id: 'pen', label: 'Pen', icon: '✏️' },
  { id: 'eraser', label: 'Eraser', icon: '🧹' },
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
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: ToolbarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-slate-50 to-slate-100 shadow-lg border-b-2 border-slate-200 z-[9999]">
      {/* Row 1 - Tools */}
      <div className="flex items-center justify-center gap-3 px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2 bg-white rounded-xl shadow-md p-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => onToolChange(tool.id)}
              className={`group relative px-3 py-2 rounded-lg font-semibold text-xs transition-all duration-200 ${
                selectedTool === tool.id
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
              title={tool.label}
            >
              <span className="text-base mr-1">{tool.icon}</span>
              <span className="text-xs font-bold">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 2 - Controls */}
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left - Undo/Redo */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
              canUndo
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <span className="text-base">↩️</span>
            <span>Undo</span>
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs transition-all ${
              canRedo
                ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg hover:scale-105'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <span className="text-base">↪️</span>
            <span>Redo</span>
          </button>
        </div>

        {/* Center - Size, Color, Background */}
        <div className="flex items-center gap-3">
          {/* Pen Size */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-md px-3 py-2">
            <label className="text-xs font-bold text-slate-700">SIZE</label>
            <select
              value={penSize}
              onChange={(e) => onPenSizeChange(Number(e.target.value))}
              className="px-2 py-1 border-2 border-slate-200 rounded-md font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer"
            >
              {penSizes.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>
          </div>

          {/* Color Picker */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-md px-3 py-2">
            <label className="text-xs font-bold text-slate-700">COLOR</label>
            <div className="flex gap-1">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => onColorChange(c)}
                  className={`w-7 h-7 rounded-md border-2 transition-all duration-200 hover:scale-110 ${
                    color === c
                      ? 'border-blue-500 ring-2 ring-blue-300 scale-110'
                      : 'border-slate-300'
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

          {/* Background */}
          <div className="flex items-center gap-2 bg-white rounded-lg shadow-md px-3 py-2">
            <label className="text-xs font-bold text-slate-700">BG</label>
            <button
              onClick={() => onBackgroundColorChange('#ffffff')}
              className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                backgroundColor === '#ffffff'
                  ? 'bg-slate-100 text-slate-900 ring-2 ring-slate-300'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              ☀️
            </button>
            <button
              onClick={() => onBackgroundColorChange('#1a1a1a')}
              className={`px-2 py-1 rounded-md text-xs font-bold transition-all ${
                backgroundColor === '#1a1a1a'
                  ? 'bg-slate-800 text-white ring-2 ring-slate-600'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              🌙
            </button>
          </div>
        </div>

        {/* Right - Snapshot, Zoom */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSnapshot}
            className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all font-bold text-xs"
            title="Download snapshot"
          >
            <span className="text-base">📸</span>
            <span>Snapshot</span>
          </button>

          <div className="flex items-center gap-2 bg-white rounded-lg shadow-md px-3 py-2">
            <label className="text-xs font-bold text-slate-700">ZOOM</label>
            <span className="px-2 py-1 bg-blue-50 rounded-md font-mono text-xs font-bold text-blue-700">
              {Math.round(zoom * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
