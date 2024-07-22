import React, { useState, useEffect } from 'react';
import CRDTCanvas from '../components/CRDTCanvas';
import socketService from '../SocketService';
import { SketchPicker, ColorResult } from 'react-color';
import ThreeView from '../components/ThreeView';

const Page2: React.FC = () => {
  const [remainingTime, setRemainingTime] = useState<number>(0);
  const [pause, setPause] = useState<boolean>(false);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});
  const [selectedColor, setSelectedColor] = useState<string>('black');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [canvasStates, setCanvasStates] = useState<any[]>([{},{},{},{},{},{}]);

  useEffect(() => {
    socketService.on('remainingTime', (time: number) => {
      setRemainingTime(time);
      setPause(time <= 30000);
    });

    socketService.on('canvasState', (state: { colors: string[], data: any[] }) => {
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

    return () => {
      socketService.off('remainingTime');
      socketService.off('canvasState');
      socketService.off('clearCanvas');
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
    <div className="p-4 flex flex-col" style={{ ...backgroundStyle, height: 'calc(100vh - 4rem)' }}>
      <div className="w-full text-center text-black px-4 py-2 rounded mb-4">
        {getTimeText()}
      </div>
      <div className="flex items-center justify-center">
        <div className="flex">
          <CRDTCanvas pause={pause} selectedColor={selectedColor} />
          <ThreeView canvasStates={canvasStates} />
        </div>
      </div>
      <div className="fixed bottom-5 left-5 z-20 space-x-2 flex">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {showColorPicker ? 'Hide Color Picker' : 'Show Color Picker'}
        </button>
        {showColorPicker && (
          <div className="absolute bottom-16 left-5 z-20">
            <SketchPicker color={selectedColor} onChangeComplete={handleColorChange} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Page2;
