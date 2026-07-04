import { useEffect, useRef } from 'react';
import { useStore } from '../store/store';


export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.scale(dpr, dpr);
    };

    window.addEventListener('resize', resize);
    resize();

    let frameId: number;

    const render = () => {
      const state = useStore.getState();
      const camera = state.camera;
      const dpr = window.devicePixelRatio || 1;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.setTransform(camera.z * dpr, 0, 0, camera.z * dpr, camera.x * dpr, camera.y * dpr);

      const spacing = 24;
      let alpha = 0.12;
      if (camera.z < 0.5) {
        alpha = Math.max(0, 0.12 * ((camera.z - 0.2) / 0.3));
      }

      if (alpha > 0) {
        const minX = -camera.x / camera.z;
        const maxX = (canvas.width / dpr - camera.x) / camera.z;
        const minY = -camera.y / camera.z;
        const maxY = (canvas.height / dpr - camera.y) / camera.z;

        const startX = Math.floor(minX / spacing) * spacing;
        const endX = Math.ceil(maxX / spacing) * spacing;
        const startY = Math.floor(minY / spacing) * spacing;
        const endY = Math.ceil(maxY / spacing) * spacing;

        ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += spacing) {
          for (let y = startY; y <= endY; y += spacing) {
            const isMajorX = Math.round(x / spacing) % 5 === 0;
            const isMajorY = Math.round(y / spacing) % 5 === 0;
            if (isMajorX && isMajorY) continue;
            ctx.moveTo(x + 1, y);
            ctx.arc(x, y, 1, 0, Math.PI * 2);
          }
        }
        ctx.fill();

        ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 1.5})`;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += spacing) {
          for (let y = startY; y <= endY; y += spacing) {
            const isMajorX = Math.round(x / spacing) % 5 === 0;
            const isMajorY = Math.round(y / spacing) % 5 === 0;
            if (isMajorX && isMajorY) {
              ctx.moveTo(x + 1.5, y);
              ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            }
          }
        }
        ctx.fill();
      }

      const allStrokes = state.currentStroke ? [...state.strokes, state.currentStroke] : state.strokes;
      for (const rawStroke of allStrokes) {
        const isLegacy = Array.isArray(rawStroke);
        const points = isLegacy ? rawStroke : rawStroke.points;
        if (points.length === 0) continue;
        
        ctx.strokeStyle = isLegacy ? '#6b6375' : rawStroke.color;
        ctx.lineWidth = (!isLegacy && rawStroke.size) ? rawStroke.size : 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        if (!isLegacy && rawStroke.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.lineWidth = (!isLegacy && rawStroke.size) ? rawStroke.size * 3 : 20;
        } else {
          ctx.globalCompositeOperation = 'source-over';
        }

        const type = (!isLegacy && rawStroke.type) ? rawStroke.type : 'draw';
        
        ctx.beginPath();
        if (type === 'draw') {
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();
        } else {
          const start = points[0];
          const end = points[points.length - 1];
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          
          if (type === 'rectangle') {
            ctx.rect(start.x, start.y, dx, dy);
            ctx.stroke();
          } else if (type === 'circle') {
            const rx = Math.abs(dx) / 2;
            const ry = Math.abs(dy) / 2;
            const cx = start.x + dx / 2;
            const cy = start.y + dy / 2;
            ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
            ctx.stroke();
          } else if (type === 'triangle') {
            ctx.moveTo(start.x + dx / 2, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.lineTo(start.x, end.y);
            ctx.closePath();
            ctx.stroke();
          } else if (type === 'line') {
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            ctx.stroke();
          } else if (type === 'arrow') {
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(end.x, end.y);
            const headlen = Math.max(12, ctx.lineWidth * 3);
            const angle = Math.atan2(dy, dx);
            ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
            ctx.stroke();
          }
        }
      }
      ctx.globalCompositeOperation = 'source-over';

      frameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return canvasRef;
}
