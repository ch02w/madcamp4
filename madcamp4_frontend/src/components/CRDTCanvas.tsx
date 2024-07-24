import React, { useEffect, useState, useRef } from 'react';
import socketService from '../services/SocketService';

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
}

interface CRDTCanvasProps {
  pause: boolean;
  selectedColor: string;
  onCanvasClick: () => void; // Callback function to notify parent of a click
  onCanvasUpdate: (canvasStates: CanvasState[]) => void; // Callback function to notify parent of canvas state update
}

const CRDTCanvas: React.FC<CRDTCanvasProps> = ({ pause, selectedColor, onCanvasClick, onCanvasUpdate }) => {
  const [canvasStates, setCanvasStates] = useState<CanvasState[]>(Array(6).fill({}));
  const [canDraw, setCanDraw] = useState(true);
  const [showLoadingCursor, setShowLoadingCursor] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
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
      onCanvasUpdate(state.data); // Notify parent of the new canvas state
    });

    socketService.on('initialCanvasState', (state: { colors: string[]; data: CanvasState[] }) => {
      console.log('Received initial canvas state:', state);
      setCanvasStates(state.data);
      onCanvasUpdate(state.data); // Notify parent of the initial canvas state
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
      const timeoutId = setTimeout(() => {
        setCanDraw(true);
        setShowLoadingCursor(false); // Hide custom cursor after 1 second
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
    setShowLoadingCursor(true); // Show custom cursor on click
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
    onCanvasUpdate(initialCanvasStates); // Notify parent of the cleared canvas state
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

  const handleMouseMove = (event: React.MouseEvent) => {
    setCursorPosition({ x: event.clientX, y: event.clientY });
  };

  return (
    <div className="relative w-full h-auto mt-4" onMouseMove={handleMouseMove}>
      <div className="relative w-[800px] h-[600px] mx-auto grid grid-cols-4 grid-rows-3 gap-0" style={{ cursor: showLoadingCursor ? 'none' : 'default' }}>
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
          >
            {getCanvasContent(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CRDTCanvas;
