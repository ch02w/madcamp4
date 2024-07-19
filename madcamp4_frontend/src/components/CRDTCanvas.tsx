import React, { useEffect, useRef, useState } from 'react';
import socketService from '../SocketService';

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
}

interface CanvasUpdate {
  key: string;
  value: number;
  timestamp: number;
}

const CRDTCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [prevPos, setPrevPos] = useState<{ x: number; y: number } | null>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({});
  const [colors, setColors] = useState<string[]>([]);
  const drawnPixels = useRef(new Set<string>());

  useEffect(() => {
    socketService.on('canvasState', (state: { colors: string[]; data: CanvasState }) => {
      setColors(state.colors);
      setCanvasState(state.data);
      drawCanvas(state.colors, state.data);
    });

    return () => {
      socketService.off('canvasState');
    };
  }, []);

  const drawCanvas = (colors: string[], state: CanvasState) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    Object.entries(state).forEach(([key, { value }]) => {
      const [_, x, y] = key.split('-');
      ctx.fillStyle = colors[value] as string;
      ctx.fillRect(Number(x), Number(y), 5, 5);
    });
  };

  const rgbToHex = (r: number, g: number, b: number) =>
    ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);

  const updateCanvas = (x: number, y: number, color: [number, number, number]) => {
    const hexColor = rgbToHex(color[0], color[1], color[2]);
    let colorIndex = colors.indexOf(hexColor);

    if (colorIndex === -1) {
      setColors((prevColors) => [...prevColors, hexColor]);
      colorIndex = colors.length; // New color index
    }

    const key = `pixel-${x}-${y}`;
    const timestamp = Date.now();
    const payload: CanvasUpdate = { key, value: colorIndex, timestamp };
    socketService.emit('updateCanvas', payload);
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    setIsDrawing(true);
    const { x, y } = getMousePos(event);
    setPrevPos({ x, y });
    paint(x, y);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setPrevPos(null);
    drawnPixels.current.clear(); // Clear the set of drawn pixels
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDrawing) {
      const { x, y } = getMousePos(event);
      if (prevPos) {
        drawLine(prevPos.x, prevPos.y, x, y);
        setPrevPos({ x, y });
      }
    }
  };

  const getMousePos = (event: React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor(event.clientX - rect.left);
    const y = Math.floor(event.clientY - rect.top);
    return { x, y };
  };

  const paint = (x: number, y: number) => {
    const key = `pixel-${x}-${y}`;
    if (!drawnPixels.current.has(key)) {
      drawLine(prevPos?.x ?? x, prevPos?.y ?? y, x, y);
      drawnPixels.current.add(key);
      updateCanvas(x, y, [0, 0, 0]); // For simplicity, set a fixed color
    }
  };

  const drawLine = (x0: number, y0: number, x1: number, y1: number) => {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    const xinc = dx / steps;
    const yinc = dy / steps;
    let x = x0;
    let y = y0;

    for (let i = 0; i <= steps; i++) {
      const key = `pixel-${Math.round(x)}-${Math.round(y)}`;
      if (!drawnPixels.current.has(key)) {
        updateCanvas(Math.round(x), Math.round(y), [0, 0, 0]);
        drawnPixels.current.add(key);
      }
      x += xinc;
      y += yinc;
    }
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setCanvasState({});
    socketService.emit('clearCanvas', {});
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        style={{ border: '1px solid black' }}
      />
      <button onClick={clearCanvas}>Clear Canvas</button>
    </div>
  );
};

export default CRDTCanvas;
