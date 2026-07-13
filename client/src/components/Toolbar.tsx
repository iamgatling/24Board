
import { useStore } from '../store/store';
import { MousePointer2, Pen, Eraser, StickyNote as StickyNoteIcon, Type } from 'lucide-react';

export function Toolbar() {
  const activeTool = useStore((state) => state.activeTool);
  const activeColor = useStore((state) => state.activeColor);
  const activeSize = useStore((state) => state.activeSize);
  const setTool = useStore((state) => state.setTool);
  const setColor = useStore((state) => state.setColor);
  const setSize = useStore((state) => state.setSize);

  const allColors = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#fef08a'];
  const textColors = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308'];
  const stickyColors = ['#fef08a', '#22c55e'];
  const currentColors = activeTool === 'sticky' ? stickyColors : (activeTool === 'text' ? textColors : allColors);
  
  const textSizes = [2, 4, 8, 16];
  const stickySizes = [4, 8];
  const penSizes = [2, 4, 8, 16];
  const currentSizes = activeTool === 'sticky' ? stickySizes : (activeTool === 'text' ? textSizes : penSizes);
  
  const isShapeTool = ['rectangle', 'circle', 'triangle', 'line', 'arrow'].includes(activeTool);
  
  const useDotsForSizing = activeTool === 'pen' || activeTool === 'eraser' || isShapeTool;
  
  const showColorPicker = activeTool === 'pen' || activeTool === 'sticky' || activeTool === 'text' || isShapeTool;
  const showSizePicker = activeTool === 'pen' || activeTool === 'eraser' || activeTool === 'text' || activeTool === 'sticky' || isShapeTool;
  const showContextBar = showColorPicker || showSizePicker;

  const tools = [
    { id: 'cursor', icon: MousePointer2 },
    { id: 'pen', icon: Pen },
    { id: 'eraser', icon: Eraser },
    { id: 'sticky', icon: StickyNoteIcon },
    { id: 'text', icon: Type },
  ] as const;

  return (
    <div 
      onPointerDown={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      style={{
      position: 'absolute',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 12,
      zIndex: 10,
    }}>
      {/* Context Bar */}
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '8px 16px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 24,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        opacity: showContextBar ? 1 : 0,
        pointerEvents: showContextBar ? 'auto' : 'none',
        transform: showContextBar ? 'translateY(0)' : 'translateY(10px)',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {showSizePicker && (
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', paddingRight: showColorPicker ? 12 : 0, borderRight: showColorPicker ? '1px solid #e5e7eb' : 'none' }}>
            {currentSizes.map(size => (
              <button
                key={size}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setSize(size);
                }}
                className="toolbar-btn"
                style={{
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  background: activeSize === size ? '#e5e7eb' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {useDotsForSizing ? (
                  <div style={{
                    width: size === 2 ? 4 : size === 4 ? 8 : size === 8 ? 12 : 16,
                    height: size === 2 ? 4 : size === 4 ? 8 : size === 8 ? 12 : 16,
                    borderRadius: '50%',
                    background: activeTool === 'eraser' ? '#9ca3af' : (activeColor || '#4b5563'),
                  }} />
                ) : (
                  <div style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: activeSize === size ? '#111827' : '#6b7280',
                  }}>
                    {size}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {showColorPicker && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {currentColors.map(color => (
              <button
                key={color}
                onPointerDown={(e) => {
                  e.stopPropagation();
                  setColor(color);
                }}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  border: activeColor === color ? '2px solid #3b82f6' : '1px solid #e5e7eb',
                  background: color,
                  cursor: 'pointer',
                  transition: 'transform 150ms ease, border-color 150ms ease',
                  transform: activeColor === color ? 'scale(1.1)' : 'scale(1)',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Main Toolbar */}
      <div style={{
        display: 'flex',
        gap: 8,
        padding: 8,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 28,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        height: 56,
        alignItems: 'center',
      }}>
        {tools.map(({ id, icon: Icon }) => (
          <button
            key={id}
            onPointerDown={(e) => {
              e.stopPropagation();
              setTool(id as any);
            }}
            className="toolbar-btn"
            style={{
              width: 44,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: 'none',
              background: activeTool === id ? '#eff6ff' : 'transparent',
              color: activeTool === id ? '#3b82f6' : '#4b5563',
              borderRadius: 22,
              cursor: 'pointer',
            }}
          >
            <Icon size={20} strokeWidth={activeTool === id ? 2.5 : 2} />
          </button>
        ))}
      </div>
    </div>
  );
}
