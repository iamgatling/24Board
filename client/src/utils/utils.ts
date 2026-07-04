import type { Camera } from '../store/store';

export function screenToCanvas(x: number, y: number, camera: Camera) {
  return {
    x: (x - camera.x) / camera.z,
    y: (y - camera.y) / camera.z,
  };
}
