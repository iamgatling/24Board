import { create } from 'zustand';

interface Point {
  x: number;
  y: number;
}

interface Camera {
  x: number;
  y: number;
  z: number; // zoom level
}

interface BoardState {
  camera: Camera;
  pointer: Point;
  setCamera: (camera: Partial<Camera>) => void;
  setPointer: (pointer: Point) => void;
}

export const useStore = create<BoardState>((set) => ({
  camera: { x: 0, y: 0, z: 1 },
  pointer: { x: 0, y: 0 },
  setCamera: (cameraUpdate) =>
    set((state) => ({ camera: { ...state.camera, ...cameraUpdate } })),
  setPointer: (pointer) => set({ pointer }),
}));
