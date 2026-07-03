import React, { useRef } from 'react';
import { useStore, type Note } from './store';
import { screenToCanvas } from './utils';

export function StickyNote({ note }: { note: Note }) {
  const updateNote = useStore((state) => state.updateNote);
  const camera = useStore((state) => state.camera);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    
    const point = screenToCanvas(e.clientX, e.clientY, camera);
    offset.current = {
      x: point.x - note.x,
      y: point.y - note.y,
    };
    
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const point = screenToCanvas(e.clientX, e.clientY, camera);
    updateNote(note.id, {
      x: point.x - offset.current.x,
      y: point.y - offset.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <g transform={`translate(${note.x}, ${note.y})`}>
      <rect
        width={200}
        height={200}
        fill="#fef08a"
        rx={8}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{ cursor: 'grab', pointerEvents: 'auto' }}
      />
      <foreignObject x={10} y={10} width={180} height={180} style={{ pointerEvents: 'none' }}>
        <textarea
          value={note.text}
          onChange={(e) => updateNote(note.id, { text: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'sans-serif',
            fontSize: '16px',
            color: '#000',
            pointerEvents: 'auto',
          }}
        />
      </foreignObject>
    </g>
  );
}
