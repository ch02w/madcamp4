// Page2.tsx
import React, { useState, useEffect } from 'react';
import CRDTCanvas from '../components/CRDTCanvas';
import socketService from '../SocketService';
import { SketchPicker, ColorResult } from 'react-color';
import ThreeView from '../components/ThreeView';
import './Page2.css';

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
}

const Page2: React.FC = () => {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [pause, setPause] = useState<boolean>(false);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});
  const [selectedColor, setSelectedColor] = useState<string>('black');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [canvasStates, setCanvasStates] = useState<CanvasState[]>(Array(6).fill({}));
  const [glbUrl, setGlbUrl] = useState<string | null>(null);

  useEffect(() => {
    socketService.on('remainingTime', (time: number) => {
      setRemainingTime(time);
      setPause(time <= 30000);
    });

    socketService.on('canvasState', (state: { colors: string[], data: CanvasState[] }) => {
      setCanvasStates(state.data);
    });

    socketService.on('clearCanvas', () => {
      setBackgroundStyle({
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
        transition: 'background-color 1s'
      });
      setTimeout(() => {
        setBackgroundStyle({
          backgroundColor: 'transparent',
          transition: 'background-color 1s'
        });
      }, 1000);
    });

    socketService.on('glbGenerated', (data: { url: string }) => {
      setGlbUrl(data.url);
    });

    return () => {
      socketService.off('remainingTime');
      socketService.off('canvasState');
      socketService.off('clearCanvas');
      socketService.off('glbGenerated');
    };
  }, []);

  const getTimeText = () => {
    if (pause) {
      return `Resting time: ${Math.floor(remainingTime / 1000)} seconds`;
    }
    return `Drawing time: ${Math.floor(remainingTime / 1000)} seconds`;
  };

  const handleColorChange = (color: ColorResult) => {
    setSelectedColor(color.hex);
  };

  return (
    <div className="page-container" style={{ ...backgroundStyle }}>
      <div className="timer">
        {getTimeText()}
      </div>
      <div className="content">
        <div className="canvas-wrapper">
          <CRDTCanvas pause={pause} selectedColor={selectedColor} />
        </div>
        <div className="threeview-wrapper">
          <ThreeView canvasStates={canvasStates} />
        </div>
      </div>
      <div className="color-picker-wrapper">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="color-picker-button"
        >
          {showColorPicker ? 'Hide Color Picker' : 'Show Color Picker'}
        </button>
        {showColorPicker && (
          <div className="color-picker">
            <SketchPicker color={selectedColor} onChangeComplete={handleColorChange} />
          </div>
        )}
        {glbUrl && (
          <a href={glbUrl} download="canvas.glb" className="download-button">
            Download GLB
          </a>
        )}
      </div>
    </div>
  );
};

export default Page2;
