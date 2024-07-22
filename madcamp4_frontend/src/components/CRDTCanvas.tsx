import React, { useEffect, useState, useRef } from 'react';
import socketService from '../SocketService';
import ThreeView from './ThreeView';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter';
import * as THREE from 'three';

interface CanvasState {
  [key: string]: { value: string; timestamp: number };
}

interface CRDTCanvasProps {
  onCanvasClick: () => void;
  pause: boolean;
  selectedColor: string;
}

const CRDTCanvas: React.FC<CRDTCanvasProps> = ({ onCanvasClick, pause, selectedColor }) => {
  const [canvasStates, setCanvasStates] = useState<CanvasState[]>([{},{},{},{},{},{}]);
  const [canDraw, setCanDraw] = useState(true);
  const [filterStyle, setFilterStyle] = useState<React.CSSProperties>({});
  const [showDownloadButton, setShowDownloadButton] = useState<boolean>(false);
  const [showCubeButton, setShowCubeButton] = useState<boolean>(true);
  const [showCubeView, setShowCubeView] = useState<boolean>(false);
  const canvasRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];

  useEffect(() => {
    const initialCanvasStates = Array(6).fill(null).map(() => {
      const state: CanvasState = {};
      for (let x = 0; x < 200; x += 10) {
        for (let y = 0; y < 200; y += 10) {
          state[`pixel-${x}-${y}`] = { value: '#FFFFFF', timestamp: Date.now() }; // Initial color is white
        }
      }
      return state;
    });
    setCanvasStates(initialCanvasStates);

    socketService.on('canvasState', (state: { colors: string[], data: CanvasState[] }) => {
      console.log('Received canvas state:', state);
      setCanvasStates(state.data);
    });

    socketService.on('clearCanvas', () => {
      setShowDownloadButton(true);
      setShowCubeButton(true);
      setTimeout(() => {
        clearCanvasLocally();
        setShowDownloadButton(false);
        setShowCubeButton(false);
      }, 30000);
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

  const updateCanvas = (canvasIndex: number, x: number, y: number, value: string) => {
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
    updateCanvas(canvasIndex, x, y, selectedColor);

    setCanDraw(false);
    onCanvasClick(); // Notify parent component about the canvas click
  };

  const clearCanvasLocally = () => {
    const initialCanvasStates = Array(6).fill(null).map(() => {
      const state: CanvasState = {};
      for (let x = 0; x < 200; x += 10) {
        for (let y = 0; y < 200; y += 10) {
          state[`pixel-${x}-${y}`] = { value: '#FFFFFF', timestamp: Date.now() }; // Initial color is white
        }
      }
      return state;
    });
    setCanvasStates(initialCanvasStates);
  };

  const downloadImage = () => {
    canvasRefs.forEach((canvasRef, index) => {
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

      Object.entries(canvasStates[index]).forEach(([key, { value }]) => {
        const [_, x, y] = key.split('-');
        ctx.fillStyle = value;
        ctx.fillRect(parseInt(x, 10), parseInt(y, 10), 10, 10);
      });

      const link = document.createElement('a');
      link.download = `canvas_${index}.png`;
      link.href = canvas.toDataURL();
      link.click();
    });
  };

  const downloadGLB = () => {
    const scene = new THREE.Scene();
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result: any) => {
        const output = JSON.stringify(result, null, 2);
        const blob = new Blob([output], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'canvas.glb';
        link.click();
      },
      (error) => console.error('An error occurred during parsing', error)
    );
  };

  const getBackgroundStyle = (canvasIndex: number) => {
    const canvasImage = Object.entries(canvasStates[canvasIndex]).map(([key, { value }]) => {
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
      <div className="absolute inset-0">
        {canvasImage}
      </div>
    );
  };

  return (
    <div className="relative w-full h-auto mt-4">
      <div className="absolute inset-0" style={{ ...filterStyle, transform: 'scale(1.5)', filter: 'blur(10px)', zIndex: -1 }}>
        {canvasStates.map((_, index) => getBackgroundStyle(index))}
      </div>
      <div className="relative w-[800px] h-[600px] mx-auto grid grid-cols-4 grid-rows-3 gap-0">
        {canvasStates.map((_, index) => (
          <div
            key={index}
            ref={canvasRefs[index]}
            className={`relative w-[202px] h-[202px] border ${index === 2 ? 'row-start-1 row-end-2 col-start-2 col-end-3' : ''} 
                ${index === 1 ? 'row-start-2 row-end-3 col-start-1 col-end-2' : ''} 
                ${index === 4 ? 'row-start-2 row-end-3 col-start-2 col-end-3' : ''} 
                ${index === 0 ? 'row-start-2 row-end-3 col-start-3 col-end-4' : ''} 
                ${index === 5 ? 'row-start-2 row-end-3 col-start-4 col-end-5' : ''} 
                ${index === 3 ? 'row-start-3 row-end-4 col-start-2 col-end-3' : ''}`}
            onClick={(e) => handleCanvasClick(index, e)}
          >
            {Object.entries(canvasStates[index]).map(([key, { value }]) => {
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
        ))}
      </div>
      {showDownloadButton && (
        <div className="fixed bottom-16 right-5 z-20">
          <button onClick={downloadImage} className="bg-blue-500 text-white px-4 py-2 rounded">
            Download Image
          </button>
        </div>
      )}
      {showCubeButton && (
        <div className="fixed bottom-5 right-5 z-20 space-x-2 flex">
          <button onClick={() => setShowCubeView(true)} className="bg-green-500 text-white px-4 py-2 rounded">
            View Cube
          </button>
          <button onClick={downloadGLB} className="bg-yellow-500 text-white px-4 py-2 rounded">
            Download GLB
          </button>
        </div>
      )}
      {showCubeView && (
        <div className="fixed top-0 left-0 w-full h-full bg-white flex items-center justify-center z-20">
          <div>
            <ThreeView canvasStates={canvasStates} />
            <button onClick={() => setShowCubeView(false)} className="bg-red-500 text-white px-4 py-2 rounded mt-4">
              Close Cube View
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CRDTCanvas;
