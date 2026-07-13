import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/store';
import { Menu, Share2, Settings, User, ZoomIn, ZoomOut, Radio, Undo2, Redo2, Download, Trash2, Image as ImageIcon, Link, Square, Circle, Triangle, Minus, MoveUpRight } from 'lucide-react';
import { useParams } from 'react-router-dom';

export function Chrome({ isConnecting, onUndo, onRedo }: { isConnecting: boolean, onUndo?: () => void, onRedo?: () => void }) {
  const { roomId } = useParams();
  const camera = useStore(state => state.camera);
  const setCamera = useStore(state => state.setCamera);
  const setTool = useStore(state => state.setTool);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
      if (shareMenuRef.current && !shareMenuRef.current.contains(e.target as Node)) {
        setIsShareMenuOpen(false);
      }
    };
    if (isMenuOpen || isShareMenuOpen) {
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isMenuOpen, isShareMenuOpen]);

  const handleZoom = (newZ: number) => {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    
    const canvasX = (cx - camera.x) / camera.z;
    const canvasY = (cy - camera.y) / camera.z;
    
    const newX = cx - canvasX * newZ;
    const newY = cy - canvasY * newZ;
    
    setCamera({ x: newX, y: newY, z: newZ });
  };

  const zoomIn = () => handleZoom(Math.min(5, camera.z * 1.2));
  const zoomOut = () => handleZoom(Math.max(0.1, camera.z / 1.2));
  const zoomReset = () => handleZoom(1);

  return (
    <>
      {/* Top Left */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
        position: 'absolute',
        top: 16,
        left: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '8px 12px',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      }}>
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button 
            className="chrome-btn" 
            onPointerDown={() => setIsMenuOpen(!isMenuOpen)} 
            style={{ padding: 6, background: isMenuOpen ? '#f3f4f6' : 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, display: 'flex', alignItems: 'center' }}
          >
            <Menu size={20} />
          </button>
          
          {isMenuOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: 12,
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: 8,
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb',
              width: 220,
              display: 'flex',
              flexDirection: 'column',
              padding: 6,
              zIndex: 100,
            }}>
              <button className="chrome-btn" onPointerDown={() => { setTool('rectangle'); setIsMenuOpen(false); }} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <Square size={16} /> Rectangle
              </button>
              <button className="chrome-btn" onPointerDown={() => { setTool('circle'); setIsMenuOpen(false); }} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <Circle size={16} /> Circle
              </button>
              <button className="chrome-btn" onPointerDown={() => { setTool('triangle'); setIsMenuOpen(false); }} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <Triangle size={16} /> Triangle
              </button>
              <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
              <button className="chrome-btn" onPointerDown={() => { setTool('line'); setIsMenuOpen(false); }} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <Minus size={16} /> Line
              </button>
              <button className="chrome-btn" onPointerDown={() => { setTool('arrow'); setIsMenuOpen(false); }} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <MoveUpRight size={16} /> Arrow
              </button>
              <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
              <button className="chrome-btn" onPointerDown={() => { setIsMenuOpen(false); }} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                <Trash2 size={16} /> Clear Canvas
              </button>
            </div>
          )}
        </div>
        <div style={{ width: 1, height: 20, background: '#e5e7eb' }} />
        <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>Untitled Board</span>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 6, 
          padding: '4px 8px', 
          background: isConnecting ? '#fef3c7' : '#dcfce7',
          color: isConnecting ? '#b45309' : '#15803d',
          borderRadius: 999,
          fontSize: 12,
          fontWeight: 500,
        }}>
          <Radio size={14} />
          {isConnecting ? 'Connecting' : 'Online'}
        </div>
      </div>

      {/* Top Right */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
        position: 'absolute',
        top: 16,
        right: 16,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        zIndex: 10,
      }}>
        <div style={{
          display: 'flex',
          gap: 4,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: 4,
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <div ref={shareMenuRef} style={{ position: 'relative' }}>
            <button 
              className="chrome-btn" 
              onPointerDown={() => setIsShareMenuOpen(!isShareMenuOpen)} 
              style={{ padding: 6, background: isShareMenuOpen ? '#f3f4f6' : 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, display: 'flex', alignItems: 'center' }}
            >
              <Share2 size={20} />
            </button>
            
            {isShareMenuOpen && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: 12,
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 8,
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                width: 220,
                display: 'flex',
                flexDirection: 'column',
                padding: 6,
                zIndex: 100,
              }}>
                <button className="chrome-btn" onPointerDown={() => setIsShareMenuOpen(false)} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                  <Link size={16} /> Copy Room Link
                </button>
                <div style={{ height: 1, background: '#e5e7eb', margin: '4px 0' }} />
                <button className="chrome-btn" onPointerDown={() => setIsShareMenuOpen(false)} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                  <ImageIcon size={16} /> Export as PNG
                </button>
                <button className="chrome-btn" onPointerDown={() => setIsShareMenuOpen(false)} style={{ textAlign: 'left', padding: '10px 12px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, fontSize: 14, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 500 }}>
                  <Download size={16} /> Export as SVG
                </button>
              </div>
            )}
          </div>
          <button className="chrome-btn" style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6 }}>
            <Settings size={20} />
          </button>
          <button className="chrome-btn" style={{ padding: '6px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6 }}>
            <User size={20} />
          </button>
        </div>
      </div>

      {/* Bottom Right (Zoom Controls) */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
        position: 'absolute',
        bottom: 32,
        right: 32,
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: 4,
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        zIndex: 10,
        gap: 4,
      }}>
        <button className="chrome-btn" onPointerDown={zoomOut} style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
          <ZoomOut size={18} />
        </button>
        <button className="chrome-btn" onPointerDown={zoomReset} style={{ padding: '4px 8px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#111827', fontSize: 13, fontWeight: 500, width: 48, textAlign: 'center' }}>
          {Math.round(camera.z * 100)}%
        </button>
        <button className="chrome-btn" onPointerDown={zoomIn} style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Bottom Left (Undo/Redo & Room ID) */}
      <div 
        onPointerDown={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
        style={{
        position: 'absolute',
        bottom: 32,
        left: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        zIndex: 10,
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          padding: 4,
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        }}>
          <button className="chrome-btn" onPointerDown={onUndo} style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <Undo2 size={18} />
          </button>
          <button className="chrome-btn" onPointerDown={onRedo} style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: '#4b5563', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
            <Redo2 size={18} />
          </button>
        </div>
        
        <div style={{
          padding: '6px 12px',
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          fontSize: 13,
          color: '#6b7280',
          fontWeight: 500,
        }}>
          Room: {roomId}
        </div>
      </div>
    </>
  );
}
