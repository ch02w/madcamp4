import React, { useEffect, useState } from 'react';
import socketService from '../SocketService';

interface CanvasState {
  [key: string]: { value: string; timestamp: number };
}

const CRDTCanvas: React.FC = () => {
  const [canvasState, setCanvasState] = useState<CanvasState>({});

  useEffect(() => {
    socketService.on('canvasState', (state: CanvasState) => {
      console.log('Received canvas state:', state); // Log received state
      setCanvasState(state);
    });

    return () => {
      socketService.off('canvasState');
    };
  }, []);

  const updateCanvas = (key: string, value: string) => {
    const timestamp = Date.now();
    const payload = { key, value, timestamp };
    socketService.emit('updateCanvas', payload);
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    const rect = (event.target as HTMLDivElement).getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    const key = `pixel-${x}-${y}`;
    const value = 'black'; // For simplicity, set a fixed color
    updateCanvas(key, value);
  };

  return (
    <div
      className="CRDTCanvas"
      onClick={handleCanvasClick}
      style={{
        position: 'relative',
        width: '800px',
        height: '600px',
        border: '1px solid black',
        backgroundColor: 'white',
      }}
    >
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
  );
};

export default CRDTCanvas;
