export type Tool = 'pen' | 'line' | 'circle' | 'rectangle' | 'text' | 'pan';

export interface Point {
  x: number;
  y: number;
}

export interface DrawingElement {
  id: string;
  type: 'freehand' | 'line' | 'circle' | 'rectangle' | 'text';
  points: Point[];
  color: string;
  size: number;
  text?: string;
  fontSize?: number;
  width?: number;
  height?: number;
}

export interface CanvasState {
  elements: DrawingElement[];
  selectedTool: Tool;
  penSize: number;
  color: string;
  zoom: number;
  pan: Point;
}
