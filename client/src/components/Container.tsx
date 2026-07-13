import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PresenceClient, type SessionPayload } from '@whogoes/client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useStore, type Note, type Stroke } from '../store/store';
import { useCanvas } from '../hooks/useCanvas';
import { screenToCanvas } from '../utils/utils';
import { StickyNote } from './StickyNote';
import { Toolbar } from './Toolbar';
import { Chrome } from './Chrome';

export default function Container() {
  const { roomId } = useParams();
  const camera = useStore((state) => state.camera);
  const setCamera = useStore((state) => state.setCamera);
  const setStrokes = useStore((state) => state.setStrokes);
  const setCurrentStroke = useStore((state) => state.setCurrentStroke);
  const updateCurrentStroke = useStore((state) => state.updateCurrentStroke);
  const notes = useStore((state) => state.notes);
  const setNotes = useStore((state) => state.setNotes);

  const yNotes = useRef<Y.Map<Note> | null>(null);
  const yStrokes = useRef<Y.Array<Stroke> | null>(null);
  const undoManagerRef = useRef<Y.UndoManager | null>(null);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [remoteSessions, setRemoteSessions] = useState<Record<string, SessionPayload>>({});
  const isDragging = useRef(false);
  const isPanning = useRef(false);
  const isDrawing = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useCanvas();
  const roomRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId) return;
    setIsConnecting(true);
    
    const client = new PresenceClient({
      endpoint: 'ws://localhost:8080/ws',
      token: () => 'token',
    });
    
    const room = client.join(roomId);
    roomRef.current = room;
    
    const handleSnapshot = (sessions: SessionPayload[]) => {
      setIsConnecting(false);
      const newSessions: Record<string, SessionPayload> = {};
      sessions.forEach(s => {
        newSessions[s.sessionId] = s;
      });
      setRemoteSessions(newSessions);
    };

    const handleUpdate = (session: SessionPayload) => {
      setRemoteSessions(prev => ({ ...prev, [session.sessionId]: session }));
    };

    const handleJoin = (session: SessionPayload) => {
      setRemoteSessions(prev => ({ ...prev, [session.sessionId]: session }));
    };

    const handleLeave = (sessionId: string) => {
      setRemoteSessions(prev => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
    };

    room.on('snapshot', handleSnapshot);
    room.on('update', handleUpdate);
    room.on('join', handleJoin);
    room.on('leave', handleLeave);
    
    return () => {
      room.off('snapshot', handleSnapshot);
      room.off('update', handleUpdate);
      room.off('join', handleJoin);
      room.off('leave', handleLeave);
      room.leave();
      roomRef.current = null;
    };
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    
    const doc = new Y.Doc();
    const provider = new WebsocketProvider('ws://localhost:3000', roomId, doc);
    
    yNotes.current = doc.getMap<Note>('notes');
    yStrokes.current = doc.getArray<Stroke>('strokes');
    undoManagerRef.current = new Y.UndoManager([yNotes.current, yStrokes.current]);

    const updateNotes = () => {
      if (!yNotes.current) return;
      setNotes(Array.from(yNotes.current.keys()).map(k => yNotes.current!.get(k)!));
    };

    const updateStrokes = () => {
      if (!yStrokes.current) return;
      setStrokes(yStrokes.current.toArray());
    };

    yNotes.current.observe(updateNotes);
    yStrokes.current.observe(updateStrokes);

    updateNotes();
    updateStrokes();
    
    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, [roomId, setNotes, setStrokes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        isPanning.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const state = useStore.getState();
      
      let { deltaX, deltaY } = e;
      if (e.deltaMode === 1) {
        deltaX *= 40;
        deltaY *= 40;
      } else if (e.deltaMode === 2) {
        deltaX *= 800;
        deltaY *= 800;
      }

      const isZooming = e.ctrlKey || e.metaKey || e.deltaMode !== 0;

      if (isZooming) {
        const zoomMultiplier = Math.exp(-deltaY * 0.002);
        const newZ = Math.max(0.1, Math.min(5, state.camera.z * zoomMultiplier));
        
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        
        const canvasX = (mouseX - state.camera.x) / state.camera.z;
        const canvasY = (mouseY - state.camera.y) / state.camera.z;
        
        const newX = mouseX - canvasX * newZ;
        const newY = mouseY - canvasY * newZ;

        state.setCamera({ x: newX, y: newY, z: newZ });
      } else {
        let finalDeltaX = deltaX;
        let finalDeltaY = deltaY;
        
        if (e.shiftKey) {
          finalDeltaX = deltaX + deltaY;
          finalDeltaY = 0;
        }

        state.setCamera({
          x: state.camera.x - finalDeltaX,
          y: state.camera.y - finalDeltaY,
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    const state = useStore.getState();
    const tool = state.activeTool;
    const color = state.activeColor;

    if (isSpacePressed || e.button === 1) {
      isPanning.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    } else if (tool === 'cursor') {
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    } else if (tool === 'sticky' || tool === 'text') {
      if (!yNotes.current) return;
      const point = screenToCanvas(e.clientX, e.clientY, state.camera);
      const id = Date.now().toString();
      const newNote: Note = {
        id,
        x: point.x,
        y: point.y,
        text: '',
        color,
        size: state.activeSize,
        isTextOnly: tool === 'text',
      };
      yNotes.current.set(id, newNote);
      
      if ((window as any).Marple) {
        (window as any).Marple.track('feature_used', { type: tool, roomId });
      }
      useStore.getState().setEditingNoteId(id);
      useStore.getState().setTool('cursor');
    } else if (['pen', 'eraser', 'rectangle', 'circle', 'triangle', 'line', 'arrow'].includes(tool)) {
      isDrawing.current = true;
      const point = screenToCanvas(e.clientX, e.clientY, state.camera);
      const strokeType = (tool === 'pen' || tool === 'eraser') ? 'draw' : tool;
      setCurrentStroke({ type: strokeType as any, points: [point], color, size: state.activeSize, isEraser: tool === 'eraser' });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const point = screenToCanvas(e.clientX, e.clientY, useStore.getState().camera);
    if (roomRef.current) {
      roomRef.current.update({ cursor: point });
    }

    if (isPanning.current || (isDragging.current && isSpacePressed)) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;

      setCamera({
        x: camera.x + dx,
        y: camera.y + dy,
      });

      lastPointer.current = { x: e.clientX, y: e.clientY };
    } else if (isDrawing.current) {
      updateCurrentStroke(point);
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    isPanning.current = false;
    if (isDrawing.current) {
      isDrawing.current = false;
      const state = useStore.getState();
      if (state.currentStroke && yStrokes.current) {
        yStrokes.current.push([state.currentStroke]);
        
        if ((window as any).Marple) {
          (window as any).Marple.track('feature_used', { type: 'drawing', roomId, points: state.currentStroke.points.length });
        }
      }
      setCurrentStroke(null);
    }
  };



  const handleClearCanvas = () => {
    if (yStrokes.current) {
      yStrokes.current.delete(0, yStrokes.current.length);
    }
    if (yNotes.current) {
      yNotes.current.clear();
    }
  };

  const handleUpdateNote = (id: string, updates: Partial<Note>) => {
    if (!yNotes.current) return;
    const note = yNotes.current.get(id);
    if (note) {
      yNotes.current.set(id, { ...note, ...updates });
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        cursor: isSpacePressed ? (isPanning.current ? 'grabbing' : 'grab') : 'default',
        backgroundColor: '#f5f5f5',
        touchAction: 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.z})`}>
          {notes.map((note) => (
            <StickyNote key={note.id} note={note} onUpdate={handleUpdateNote} />
          ))}
          {Object.values(remoteSessions).map(session => {
            if (!session.cursor) return null;
            return (
              <text
                key={session.sessionId}
                x={session.cursor.x}
                y={session.cursor.y}
                fill={session.user?.color || 'red'}
                fontSize="40"
              >
                V
              </text>
            );
          })}
        </g>
      </svg>
      <Chrome 
        isConnecting={isConnecting} 
        onUndo={() => undoManagerRef.current?.undo()} 
        onRedo={() => undoManagerRef.current?.redo()} 
        onClearCanvas={handleClearCanvas}
      />
      <Toolbar />
    </div>
  );
}
