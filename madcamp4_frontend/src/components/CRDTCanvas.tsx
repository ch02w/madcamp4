import React, { useEffect, useState, useRef } from 'react';
import { SketchPicker } from 'react-color';
import socketService from '../SocketService';

interface CanvasState {
  [key: string]: { value: string; timestamp: number };
}

const CRDTCanvas: React.FC = () => {
  const [canvasState, setCanvasState] = useState<CanvasState>({});
  const [canDraw, setCanDraw] = useState(true);
  const [pause, setPause] = useState(false);
  const [filterStyle, setFilterStyle] = useState<React.CSSProperties>({});
  const [selectedColor, setSelectedColor] = useState<string>('black');
  const [showDownloadButton, setShowDownloadButton] = useState<boolean>(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    socketService.on('canvasState', (state: { colors: string[], data: CanvasState }) => {
      console.log('Received canvas state:', state);
      setCanvasState(state.data);
    });

    socketService.on('clearCanvas', () => {
      setShowDownloadButton(true);
      setPause(true);
      setTimeout(() => {
        setPause(false);
        clearCanvasLocally();
        setShowDownloadButton(false);
      }, 5000);
      
    });

    return () => {
      socketService.off('canvasState');
      socketService.off('clearCanvas');
    };
  }, []);

  useEffect(() => {
    if (!canDraw) {
      setFilterStyle({
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
        transition: 'background-color 1s'
      });
      const timeoutId = setTimeout(() => {
        setFilterStyle({
          backgroundColor: 'transparent',
          transition: 'background-color 1s'
        });
        setCanDraw(true);
      }, 1000);

      return () => clearTimeout(timeoutId);
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
    if (!canDraw || pause) return;

    const rect = canvasRef.current!.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / 10) * 10;
    const y = Math.floor((event.clientY - rect.top) / 10) * 10;
    updateCanvas(x, y, selectedColor);

    setCanDraw(false);
  };

  const handleColorChange = (color: any) => {
    setSelectedColor(color.hex);
  };

  const clearCanvasLocally = () => {
    setCanvasState({});
  };

  const downloadImage = () => {
    if (!canvasRef.current) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvasRef.current.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // 배경을 흰색으로 설정
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    Object.entries(canvasState).forEach(([key, { value }]) => {
      const [_, x, y] = key.split('-');
      ctx.fillStyle = value;
      ctx.fillRect(parseInt(x), parseInt(y), 10, 10);
    });

    const link = document.createElement('a');
    link.download = 'canvas.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const getBackgroundStyle = () => {
    const canvasImage = Object.entries(canvasState).map(([key, { value }]) => {
      const [_, x, y] = key.split('-');
      return (
        <div
          key={key}
          className="absolute"
          style={{
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
      <div className="fixed top-0 left-0 w-full h-full z-[-1]">
        {canvasImage}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full">
      <div
        className="fixed top-0 left-0 w-full h-full"
        style={{ 
          ...filterStyle, transform: 'scale(1.5)', filter: 'blur(10px)' }}>
        {getBackgroundStyle()}
      </div>
      <div
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] border border-black bg-white overflow-hidden"
      >
        <div
          ref={canvasRef}
          className="relative w-full h-full"
          onClick={handleCanvasClick}
        >
          {Object.entries(canvasState).map(([key, { value }]) => {
            const [_, x, y] = key.split('-');
            return (
              <div
                key={key}
                className="absolute"
                style={{
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
      <div className="fixed bottom-5 left-5 z-10">
        <SketchPicker color={selectedColor} onChangeComplete={handleColorChange} />
      </div>
      {showDownloadButton && (
        <div className="fixed bottom-5 right-5 z-10">
          <button
            onClick={downloadImage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Download Image
          </button>
        </div>
      )}
    </div>
  );
};

export default CRDTCanvas;
