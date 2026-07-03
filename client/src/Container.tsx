import React, { useEffect, useRef, useState } from 'react';
import { useStore } from './store';

export default function Container() {
  const camera = useStore((state) => state.camera);
  const setCamera = useStore((state) => state.setCamera);

  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const isDragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

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
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging.current && isSpacePressed) {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;

      setCamera({
        x: camera.x + dx,
        y: camera.y + dy,
      });

      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  };

  const handlePointerUp = () => {
    isDragging.current = false;
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
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        style={{
          position: 'absolute',
          transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.z})`,
          transformOrigin: '0 0',
        }}
      >
        <div 
          style={{ 
            width: 200, 
            height: 200, 
            background: '#667eea', 
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
            position: 'absolute', 
            left: 300, 
            top: 200 
          }}
        >
          Element
        </div>
      </div>
    </div>
  );
}
