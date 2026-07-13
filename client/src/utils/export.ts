import { type Note, type Stroke, type Camera } from '../store/store';

export function exportAsPNG(canvas: HTMLCanvasElement | null, notes: Note[], camera: Camera) {
  if (!canvas) return;

  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = canvas.width;
  exportCanvas.height = canvas.height;
  const ctx = exportCanvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  ctx.drawImage(canvas, 0, 0);

  const dpr = window.devicePixelRatio || 1;
  ctx.save();
  ctx.setTransform(camera.z * dpr, 0, 0, camera.z * dpr, camera.x * dpr, camera.y * dpr);

  for (const note of notes) {
    const scale = note.size ? note.size / 4 : 1;
    const rectSize = 200 * scale;
    
    if (!note.isTextOnly) {
      ctx.fillStyle = note.color || '#fef08a';
      ctx.beginPath();
      ctx.roundRect(note.x, note.y, rectSize, rectSize, 8 * scale);
      ctx.fill();
    }

    if (note.text) {
      const fontSize = note.isTextOnly ? 24 * scale : 16 * scale;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = note.isTextOnly ? (note.color || '#000') : '#000';
      ctx.textBaseline = 'top';
      
      const textOffset = note.isTextOnly ? 0 : 10 * scale;
      const lines = note.text.split('\n');
      lines.forEach((line, i) => {
        ctx.fillText(line, note.x + textOffset, note.y + textOffset + i * (fontSize * 1.2));
      });
    }
  }
  ctx.restore();

  const link = document.createElement('a');
  link.download = 'board.png';
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
}

export function exportAsSVG(strokes: Stroke[], notes: Note[], camera: Camera, width: number, height: number) {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" style="background-color: #f5f5f5;">\n`;
  svg += `  <g transform="translate(${camera.x}, ${camera.y}) scale(${camera.z})">\n`;

  for (const rawStroke of strokes) {
    const isLegacy = Array.isArray(rawStroke);
    const points = isLegacy ? rawStroke : rawStroke.points;
    if (points.length === 0) continue;

    if (!isLegacy && rawStroke.isEraser) continue;

    const color = isLegacy ? '#6b6375' : rawStroke.color;
    const strokeWidth = (!isLegacy && rawStroke.size) ? rawStroke.size : 4;
    const type = (!isLegacy && rawStroke.type) ? rawStroke.type : 'draw';

    let element = '';
    const strokeAttrs = `stroke="${color}" stroke-width="${strokeWidth}" fill="none" stroke-linecap="round" stroke-linejoin="round"`;

    if (type === 'draw') {
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
      }
      element = `<path d="${d}" ${strokeAttrs} />`;
    } else {
      const start = points[0];
      const end = points[points.length - 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;

      if (type === 'rectangle') {
        const x = dx < 0 ? start.x + dx : start.x;
        const y = dy < 0 ? start.y + dy : start.y;
        const w = Math.abs(dx);
        const h = Math.abs(dy);
        element = `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${strokeAttrs} />`;
      } else if (type === 'circle') {
        const rx = Math.abs(dx) / 2;
        const ry = Math.abs(dy) / 2;
        const cx = start.x + dx / 2;
        const cy = start.y + dy / 2;
        element = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${strokeAttrs} />`;
      } else if (type === 'triangle') {
        const x1 = start.x + dx / 2;
        const y1 = start.y;
        const x2 = end.x;
        const y2 = end.y;
        const x3 = start.x;
        const y3 = end.y;
        element = `<polygon points="${x1},${y1} ${x2},${y2} ${x3},${y3}" ${strokeAttrs} />`;
      } else if (type === 'line') {
        element = `<line x1="${start.x}" y1="${start.y}" x2="${end.x}" y2="${end.y}" ${strokeAttrs} />`;
      } else if (type === 'arrow') {
        let d = `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
        const headlen = Math.max(12, strokeWidth * 3);
        const angle = Math.atan2(dy, dx);
        const p1x = end.x - headlen * Math.cos(angle - Math.PI / 6);
        const p1y = end.y - headlen * Math.sin(angle - Math.PI / 6);
        const p2x = end.x - headlen * Math.cos(angle + Math.PI / 6);
        const p2y = end.y - headlen * Math.sin(angle + Math.PI / 6);
        d += ` L ${p1x} ${p1y} M ${end.x} ${end.y} L ${p2x} ${p2y}`;
        element = `<path d="${d}" ${strokeAttrs} />`;
      }
    }
    if (element) svg += `    ${element}\n`;
  }

  for (const note of notes) {
    const scale = note.size ? note.size / 4 : 1;
    const rectSize = 200 * scale;

    if (!note.isTextOnly) {
      const fill = note.color || '#fef08a';
      const rx = 8 * scale;
      svg += `    <rect x="${note.x}" y="${note.y}" width="${rectSize}" height="${rectSize}" fill="${fill}" rx="${rx}" />\n`;
    }

    if (note.text) {
      const fontSize = note.isTextOnly ? 24 * scale : 16 * scale;
      const fill = note.isTextOnly ? (note.color || '#000') : '#000';
      const textOffset = note.isTextOnly ? 0 : 10 * scale;
      
      const lines = note.text.split('\n');
      lines.forEach((line, i) => {
        const yPos = note.y + textOffset + i * (fontSize * 1.2) + fontSize;
        const safeLine = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        svg += `    <text x="${note.x + textOffset}" y="${yPos}" font-family="sans-serif" font-size="${fontSize}px" fill="${fill}">${safeLine}</text>\n`;
      });
    }
  }

  svg += `  </g>\n`;
  svg += `</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'board.svg';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
