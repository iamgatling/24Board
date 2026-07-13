import { create } from 'zustand';

interface Point {
  x: number;
  y: number;
}

export interface Camera {
  x: number;
  y: number;
  z: number;
}

export interface StrokeData {
  type?: 'draw' | 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow';
  points: Point[];
  color: string;
  size?: number;
  isEraser?: boolean;
}

export type Stroke = Point[] | StrokeData;

export interface Note {
  id: string;
  x: number;
  y: number;
  text: string;
  color?: string;
  size?: number;
  isTextOnly?: boolean;
}

export type Tool = 'cursor' | 'pen' | 'eraser' | 'sticky' | 'text' | 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow';

interface BoardState {
  camera: Camera;
  pointer: Point;
  strokes: Stroke[];
  currentStroke: StrokeData | null;
  notes: Note[];
  activeTool: Tool;
  activeColor: string;
  activeSize: number;
  editingNoteId: string | null;
  setCamera: (camera: Partial<Camera>) => void;
  setPointer: (pointer: Point) => void;
  setStrokes: (strokes: Stroke[]) => void;
  setCurrentStroke: (stroke: StrokeData | null) => void;
  updateCurrentStroke: (point: Point) => void;
  setNotes: (notes: Note[]) => void;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setSize: (size: number) => void;
  setEditingNoteId: (id: string | null) => void;
  boardName: string;
  setBoardName: (name: string) => void;
}

export const useStore = create<BoardState>((set) => ({
  camera: { x: 0, y: 0, z: 1 },
  pointer: { x: 0, y: 0 },
  strokes: [],
  currentStroke: null,
  notes: [],
  activeTool: 'pen',
  activeColor: '#000000',
  activeSize: 4,
  editingNoteId: null,
  boardName: 'Untitled Board',
  setCamera: (cameraUpdate) =>
    set((state) => {
      const nextCamera = { ...state.camera, ...cameraUpdate };
      const LIMIT = 20000;
      nextCamera.x = Math.max(-LIMIT, Math.min(LIMIT, nextCamera.x));
      nextCamera.y = Math.max(-LIMIT, Math.min(LIMIT, nextCamera.y));
      return { camera: nextCamera };
    }),
  setPointer: (pointer) => set({ pointer }),
  setStrokes: (strokes) => set({ strokes }),
  setCurrentStroke: (currentStroke) => set({ currentStroke }),
  updateCurrentStroke: (point) =>
    set((state) => ({
      currentStroke: state.currentStroke
        ? { ...state.currentStroke, points: [...state.currentStroke.points, point] }
        : { points: [point], color: state.activeColor, size: state.activeSize, isEraser: state.activeTool === 'eraser' },
    })),
  setNotes: (notes) => set({ notes }),
  setTool: (tool) => set((state) => {
    let nextColor = state.activeColor;
    let nextSize = state.activeSize;

    if (tool === 'sticky') {
      if (!['#fef08a', '#22c55e'].includes(nextColor)) nextColor = '#fef08a';
      if (![4, 8].includes(nextSize)) nextSize = 4;
    } else if (tool === 'text') {
      const textColors = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308'];
      if (!textColors.includes(nextColor)) nextColor = textColors[0];
      const allSizes = [2, 4, 8, 16];
      if (!allSizes.includes(nextSize)) nextSize = 4;
    } else {
      const allColors = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#fef08a'];
      const allSizes = [2, 4, 8, 16];
      if (!allColors.includes(nextColor)) nextColor = allColors[0];
      if (!allSizes.includes(nextSize)) nextSize = 4;
    }

    return { activeTool: tool, activeColor: nextColor, activeSize: nextSize };
  }),
  setColor: (color) => set({ activeColor: color }),
  setSize: (size) => set({ activeSize: size }),
  setEditingNoteId: (id) => set({ editingNoteId: id }),
  setBoardName: (boardName) => set({ boardName }),
}));
