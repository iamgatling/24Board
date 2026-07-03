import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PresenceClient, type SessionPayload } from '@whogoes/client';
import { useStore, type Note } from './store';
import { useCanvas } from './useCanvas';
import { screenToCanvas } from './utils';
import { StickyNote } from './StickyNote';

export default function Container() {
  const { roomId } = useParams();
  const camera = useStore((state) => state.camera);
  const setCamera = useStore((state) => state.setCamera);
  const addStroke = useStore((state) => state.addStroke);
  const updateCurrentStroke = useStore((state) => state.updateCurrentStroke);
  const notes = useStore((state) => state.notes);
  const addNote = useStore((state) => state.addNote);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [remoteSessions, setRemoteSessions] = useState<Record<string, SessionPayload>>({});
  const isDragging = useRef(false);
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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        isDragging.current = false;
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

      if (e.ctrlKey || e.metaKey) {
        const zoomFactor = 0.01;
        const z = Math.max(0.1, Math.min(5, state.camera.z - deltaY * zoomFactor));
        state.setCamera({ z });
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
    if (isSpacePressed) {
      isDragging.current = true;
      lastPointer.current = { x: e.clientX, y: e.clientY };
    } else {
      isDrawing.current = true;
      const point = screenToCanvas(e.clientX, e.clientY, useStore.getState().camera);
      addStroke([point]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const point = screenToCanvas(e.clientX, e.clientY, useStore.getState().camera);
    if (roomRef.current) {
      roomRef.current.update({ cursor: point });
    }

    if (isDragging.current && isSpacePressed) {
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
    isDrawing.current = false;
  };

  const handleAddNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      x: -camera.x / camera.z + window.innerWidth / 2 / camera.z - 100,
      y: -camera.y / camera.z + window.innerHeight / 2 / camera.z - 100,
      text: '',
    };
    addNote(newNote);
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        cursor: isSpacePressed ? (isDragging.current ? 'grabbing' : 'grab') : 'default',
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
            <StickyNote key={note.id} note={note} />
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
          <circle 
            cx={500} 
            cy={500} 
            r={50} 
            fill="#ff0055" 
            style={{ pointerEvents: 'auto', cursor: 'pointer' }} 
          />
        </g>
      </svg>
      <button
        onClick={handleAddNote}
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          padding: '8px 16px',
          background: '#1f2937',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
        }}
      >
        Add Note
      </button>
      <div style={{ position: 'absolute', bottom: 0, right: 0 }}>
        {roomId}
      </div>
      {isConnecting && (
        <div style={{ position: 'absolute', top: 0, right: 0 }}>
          Connecting...
        </div>
      )}
    </div>
  );
}
