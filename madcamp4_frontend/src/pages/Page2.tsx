import React, { useState, useEffect } from 'react';
import CRDTCanvas from '../components/CRDTCanvas';
import socketService from '../SocketService';
import { SketchPicker, ColorResult } from 'react-color';

const Page2: React.FC = () => {
  const [remainingTime, setRemainingTime] = useState<number>(300000); // 5 minutes in milliseconds
  const [pause, setPause] = useState<boolean>(false);
  const [backgroundStyle, setBackgroundStyle] = useState<React.CSSProperties>({});
  const [selectedColor, setSelectedColor] = useState<string>('black');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);

  useEffect(() => {
    socketService.on('remainingTime', (time: number) => {
      setRemainingTime(time);
      setPause(time <= 30000); // If remaining time is less than or equal to 30 seconds, it's a break
    });

    return () => {
      socketService.off('remainingTime');
    };
  }, []);

  useEffect(() => {
    if (pause) {
      setBackgroundStyle({
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
        transition: 'background-color 1s'
      });
      const timeoutId = setTimeout(() => {
        setBackgroundStyle({
          backgroundColor: 'transparent',
          transition: 'background-color 1s'
        });
      }, 1000);

      return () => clearTimeout(timeoutId);
    }
  }, [pause]);

  const getTimeText = () => {
    if (pause) {
      return `Resting time: ${Math.floor(remainingTime / 1000)} seconds`;
    }
    return `Drawing time: ${Math.floor(remainingTime / 1000)} seconds`;
  };

  const handleCanvasClick = () => {
    // This function will be passed to CRDTCanvas and called on canvas click
    console.log("Canvas clicked");
  };

  const handleColorChange = (color: ColorResult) => {
    setSelectedColor(color.hex);
  };

  return (
    <div className="p-4 flex flex-col" style={{ ...backgroundStyle, height: 'calc(100vh - 8rem)' }}>
      <div className="w-full text-center bg-white text-black px-4 py-2 rounded mb-4">
        {getTimeText()}
      </div>
      <div className="flex flex-col items-center justify-center flex-grow">
        <CRDTCanvas pause={pause} onCanvasClick={handleCanvasClick} selectedColor={selectedColor} />
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
