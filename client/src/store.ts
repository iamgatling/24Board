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
  notes: Note[];
  setCamera: (camera: Partial<Camera>) => void;
  setPointer: (pointer: Point) => void;
  addStroke: (stroke: Stroke) => void;
  updateCurrentStroke: (point: Point) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
}

export const useStore = create<BoardState>((set) => ({
  camera: { x: 0, y: 0, z: 1 },
  pointer: { x: 0, y: 0 },
  strokes: [],
  notes: [],
  setCamera: (cameraUpdate) =>
    set((state) => ({ camera: { ...state.camera, ...cameraUpdate } })),
  setPointer: (pointer) => set({ pointer }),
  addStroke: (stroke) => set((state) => ({ strokes: [...state.strokes, stroke] })),
  updateCurrentStroke: (point) =>
    set((state) => {
      const strokes = [...state.strokes];
      if (strokes.length > 0) {
        strokes[strokes.length - 1] = [...strokes[strokes.length - 1], point];
      }
      return { strokes };
    }),
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  updateNote: (id, updates) =>
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
    })),
}));
