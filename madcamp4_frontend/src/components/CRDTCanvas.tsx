import React, { useEffect, useState, useRef } from 'react';
import { SketchPicker } from 'react-color';
import socketService from '../SocketService';

interface CanvasState {
  [key: string]: { value: string; timestamp: number };
}

const CRDTCanvas: React.FC = () => {
  const [canvasState, setCanvasState] = useState<CanvasState>({});
  const [canDraw, setCanDraw] = useState(true);
  const [filterStyle, setFilterStyle] = useState<React.CSSProperties>({});
  const [selectedColor, setSelectedColor] = useState<string>('black'); // 선택한 색상 상태 추가
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketService.on('canvasState', (state: { colors: string[], data: CanvasState }) => {
      console.log('Received canvas state:', state); // Log received state
      setCanvasState(state.data);
    });

    return () => {
      socketService.off('canvasState');
    };
  }, []);

  useEffect(() => {
    if (!canDraw) {
      setFilterStyle({
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
        transition: 'background-color 1s'
      });
      const timeout = setTimeout(() => {
        setFilterStyle({
          backgroundColor: 'transparent',
          transition: 'background-color 1s'
        });
        setCanDraw(true);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [canDraw]);

  const updateCanvas = (x: number, y: number, value: string) => {
    const key = `pixel-${x}-${y}`;
    const timestamp = Date.now();
    const payload = { key, value, timestamp };
    console.log('Emitting updateCanvas event:', payload);
    socketService.emit('canvasOperation', { type: 'draw', payload });
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!canDraw) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / 10) * 10;
    const y = Math.floor((event.clientY - rect.top) / 10) * 10;
    updateCanvas(x, y, selectedColor); // 선택한 색상으로 업데이트

    setCanDraw(false);
  };

  const handleColorChange = (color: any) => {
    setSelectedColor(color.hex);
  };

  const getBackgroundStyle = () => {
    const canvasImage = Object.entries(canvasState).map(([key, { value }]) => {
      const [_, x, y] = key.split('-');
      return (
        <div
          key={key}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: '10px',
            height: '10px',
            backgroundColor: value,
          }}
        ></div>
      );
    });

    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: -1,
          filter: 'blur(10px)',
        }}
      >
        {canvasImage}
      </div>
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div style={{ ...filterStyle, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1 }}>
        {getBackgroundStyle()}
      </div>
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '800px',
          height: '600px',
          border: '1px solid black',
          backgroundColor: 'white',
          overflow: 'hidden',
        }}
      >
        <div ref={canvasRef} className="Canvas" onClick={handleCanvasClick} style={{ position: 'relative', width: '100%', height: '100%' }}>
          {Object.entries(canvasState).map(([key, { value }]) => {
            const [_, x, y] = key.split('-');
            return (
              <div
                key={key}
                style={{
                  position: 'absolute',
                  left: `${x}px`,
                  top: `${y}px`,
                  width: '10px',
                  height: '10px',
                  backgroundColor: value,
                }}
              ></div>
            );
          })}
        </div>
      </div>
      <div style={{ position: 'fixed', top: '20px', left: '20px', zIndex: 10 }}>
        <SketchPicker color={selectedColor} onChangeComplete={handleColorChange} />
      </div>
    </div>
  );
};

export default CRDTCanvas;
