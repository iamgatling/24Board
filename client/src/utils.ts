export function screenToCanvas(x: number, y: number, camera: { x: number; y: number; z: number }) {
  return {
    x: (x - camera.x) / camera.z,
    y: (y - camera.y) / camera.z,
  };
}
