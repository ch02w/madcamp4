import React, { useEffect, useState, useRef } from 'react';
import socketService from '../services/SocketService';

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
}

interface CRDTCanvasProps {
  pause: boolean;
  selectedColor: string;
  onCanvasClick: () => void; // Callback function to notify parent of a click
}

const CRDTCanvas: React.FC<CRDTCanvasProps> = ({ pause, selectedColor, onCanvasClick }) => {
  const [canvasStates, setCanvasStates] = useState<CanvasState[]>(Array(6).fill({}));
  const [canDraw, setCanDraw] = useState(true);
  const [filterStyle, setFilterStyle] = useState<React.CSSProperties>({});
  const canvasRefs = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
  ];

  useEffect(() => {
    socketService.emit('requestInitialCanvasState');

    socketService.on('canvasState', (state: { colors: string[]; data: CanvasState[] }) => {
      console.log('Received canvas state:', state);
      setCanvasStates(state.data);
    });

    socketService.on('initialCanvasState', (state: CanvasState[]) => {
      console.log('Received initial canvas state:', state);
      setCanvasStates(state);
    });

    socketService.on('clearCanvas', () => {
      setTimeout(() => {
        clearCanvasLocally();
      }, 30000);
    });

    return () => {
      socketService.off('canvasState');
      socketService.off('initialCanvasState');
      socketService.off('clearCanvas');
    };
  }, []);

  useEffect(() => {
    if (!canDraw) {
      setFilterStyle({
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
        transition: 'background-color 1s',
      });
      const timeoutId = setTimeout(() => {
        setFilterStyle({
          backgroundColor: 'transparent',
          transition: 'background-color 1s',
        });
        setCanDraw(true);
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [canDraw]);

  const updateCanvas = (canvasIndex: number, x: number, y: number, value: number) => {
    const key = `pixel-${x}-${y}`;
    const timestamp = Date.now();
    const payload = { canvasIndex, key, value, timestamp };
    console.log('Emitting updateCanvas event:', payload);
    socketService.emit('canvasOperation', { type: 'draw', payload });
  };

  const handleCanvasClick = (canvasIndex: number, event: React.MouseEvent) => {
    if (!canDraw || pause) return;

    const rect = canvasRefs[canvasIndex].current!.getBoundingClientRect();
    const borderWidth = 1;
    const x = Math.floor((event.clientX - rect.left - borderWidth) / 10) * 10;
    const y = Math.floor((event.clientY - rect.top - borderWidth) / 10) * 10;
    updateCanvas(canvasIndex, x, y, parseInt(selectedColor.replace('#', ''), 16));

    setCanDraw(false);
    onCanvasClick(); // Notify parent of the click event
  };

  const clearCanvasLocally = () => {
    const initialCanvasStates = Array(6).fill(null).map(() => {
      const state: CanvasState = {};
      for (let x = 0; x < 200; x += 10) {
        for (let y = 0; y < 200; y += 10) {
          state[`pixel-${x}-${y}`] = { value: 0xFFFFFF, timestamp: Date.now() }; // Initial color is white
        }
      }
      return state;
    });
    setCanvasStates(initialCanvasStates);
  };

  const getCanvasContent = (canvasIndex: number) => {
    return Object.entries(canvasStates[canvasIndex]).map(([key, { value }]) => {
      const [_, x, y] = key.split('-');
      const hexValue = `#${value.toString(16).padStart(6, '0')}`; // Convert number to hex color
      return (
        <div
          key={key}
          className="absolute"
          style={{
            left: `${x}px`,
            top: `${y}px`,
            width: '10px',
            height: '10px',
            backgroundColor: hexValue,
          }}
        ></div>
      );
    });
  };

  return (
    <div className="relative w-full h-auto mt-4">
      <div className="relative w-[800px] h-[600px] mx-auto grid grid-cols-4 grid-rows-3 gap-0">
        {canvasStates.map((_, index) => (
          <div
            key={index}
            ref={canvasRefs[index]}
            className={`relative w-[202px] h-[202px] border ${
              index === 2 ? 'row-start-1 row-end-2 col-start-2 col-end-3' : ''
            } 
                ${index === 1 ? 'row-start-2 row-end-3 col-start-1 col-end-2' : ''} 
                ${index === 4 ? 'row-start-2 row-end-3 col-start-2 col-end-3' : ''} 
                ${index === 0 ? 'row-start-2 row-end-3 col-start-3 col-end-4' : ''} 
                ${index === 5 ? 'row-start-2 row-end-3 col-start-4 col-end-5' : ''} 
                ${index === 3 ? 'row-start-3 row-end-4 col-start-2 col-end-3' : ''}`}
            onClick={(e) => handleCanvasClick(index, e)}
            style={filterStyle}
          >
            {getCanvasContent(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CRDTCanvas;
