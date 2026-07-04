import React, { useRef, useState, useEffect } from 'react';
import { useStore, type Note } from '../store/store';
import { screenToCanvas } from '../utils/utils';

export function StickyNote({ note, onUpdate }: { note: Note; onUpdate: (id: string, updates: Partial<Note>) => void }) {
  const camera = useStore((state) => state.camera);
  const activeTool = useStore((state) => state.activeTool);
  const isDragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  
  const editingNoteId = useStore((state) => state.editingNoteId);
  const setEditingNoteId = useStore((state) => state.setEditingNoteId);
  const isEditing = editingNoteId === note.id;
  const setIsEditing = (editing: boolean) => setEditingNoteId(editing ? note.id : null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      // Move cursor to the end
      textareaRef.current.selectionStart = textareaRef.current.value.length;
      textareaRef.current.selectionEnd = textareaRef.current.value.length;
    }
  }, [isEditing]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (activeTool !== 'cursor' || isEditing) return;
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
    onUpdate(note.id, {
      x: point.x - offset.current.x,
      y: point.y - offset.current.y,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  const scale = note.size ? note.size / 4 : 1;
  const rectSize = 200 * scale;
  const textOffset = note.isTextOnly ? 0 : 10 * scale;
  const foreignWidth = note.isTextOnly ? 300 * scale : 180 * scale;
  const fontSize = note.isTextOnly ? 24 * scale : 16 * scale;

  const linesList = (note.text || '').split('\n');
  const maxLineLength = Math.max(1, ...linesList.map(l => l.length));
  
  const hitWidth = note.isTextOnly ? Math.max(40, Math.min(300 * scale, maxLineLength * (fontSize * 0.6) + 12)) : 180 * scale;

  const charsPerLine = Math.floor((300 * scale) / (fontSize * 0.6));
  const lines = Math.max(1, linesList.reduce((acc, line) => acc + Math.max(1, Math.ceil(line.length / Math.max(1, charsPerLine))), 0));
  const hitHeight = note.isTextOnly ? Math.max(fontSize * 2, lines * fontSize * 1.2 + 24) : 180 * scale;

  return (
    <g 
      transform={`translate(${note.x}, ${note.y})`} 
      style={{ pointerEvents: activeTool === 'cursor' ? 'auto' : 'none' }}
      onDoubleClick={(e) => {
        if (activeTool === 'cursor') {
          e.stopPropagation();
          setIsEditing(true);
        }
      }}
    >
      {!note.isTextOnly && (
        <rect
          width={rectSize}
          height={rectSize}
          fill={note.color || "#fef08a"}
          rx={8 * scale}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: activeTool === 'cursor' && !isEditing ? 'grab' : 'default', pointerEvents: activeTool === 'cursor' && !isEditing ? 'auto' : 'none' }}
        />
      )}
      {note.isTextOnly && !isEditing && (
        <rect
          width={hitWidth}
          height={hitHeight}
          fill="transparent"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{ cursor: activeTool === 'cursor' ? 'grab' : 'default', pointerEvents: activeTool === 'cursor' ? 'auto' : 'none' }}
        />
      )}
      <foreignObject 
        x={textOffset} 
        y={textOffset} 
        width={foreignWidth} 
        height={hitHeight} 
        style={{ pointerEvents: isEditing ? 'auto' : 'none' }}
      >
        <textarea
          ref={textareaRef}
          value={note.text}
          onChange={(e) => onUpdate(note.id, { text: e.target.value })}
          onBlur={() => setIsEditing(false)}
          onPointerDown={(e) => e.stopPropagation()}
          placeholder={note.isTextOnly ? "Type something..." : ""}
          readOnly={!isEditing}
          style={{
            width: '100%',
            height: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            fontFamily: 'sans-serif',
            fontSize: `${fontSize}px`,
            color: note.isTextOnly ? (note.color || '#000') : '#000',
            pointerEvents: isEditing ? 'auto' : 'none',
            cursor: 'text',
          }}
        />
      </foreignObject>
    </g>
  );
}
