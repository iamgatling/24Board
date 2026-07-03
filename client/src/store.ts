import { create } from 'zustand';

interface Point {
  x: number;
  y: number;
}

interface Camera {
  x: number;
  y: number;
  z: number;
}

export type Stroke = Point[];

export interface Note {
  id: string;
  x: number;
  y: number;
  text: string;
}

interface BoardState {
  camera: Camera;
  pointer: Point;
  strokes: Stroke[];
  currentStroke: Stroke | null;
  notes: Note[];
  setCamera: (camera: Partial<Camera>) => void;
  setPointer: (pointer: Point) => void;
  setStrokes: (strokes: Stroke[]) => void;
  setCurrentStroke: (stroke: Stroke | null) => void;
  updateCurrentStroke: (point: Point) => void;
  setNotes: (notes: Note[]) => void;
}

export const useStore = create<BoardState>((set) => ({
  camera: { x: 0, y: 0, z: 1 },
  pointer: { x: 0, y: 0 },
  strokes: [],
  currentStroke: null,
  notes: [],
  setCamera: (cameraUpdate) =>
    set((state) => ({ camera: { ...state.camera, ...cameraUpdate } })),
  setPointer: (pointer) => set({ pointer }),
  setStrokes: (strokes) => set({ strokes }),
  setCurrentStroke: (currentStroke) => set({ currentStroke }),
  updateCurrentStroke: (point) =>
    set((state) => ({
      currentStroke: state.currentStroke ? [...state.currentStroke, point] : [point],
    })),
  setNotes: (notes) => set({ notes }),
}));
