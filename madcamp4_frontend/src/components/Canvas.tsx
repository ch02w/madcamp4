import React, { useEffect, useRef } from 'react';
import SocketService from '../SocketService';
import { CRDTCanvas } from '../CRDTCanvas';

const crdtCanvas = new CRDTCanvas();

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const draw = (op: any) => {
      context.beginPath();
      context.moveTo(op.prevX, op.prevY);
      context.lineTo(op.x, op.y);
      context.stroke();
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (event.buttons !== 1) return;
      const rect = canvas.getBoundingClientRect();
      const op = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        prevX: event.clientX - rect.left - event.movementX,
        prevY: event.clientY - rect.top - event.movementY,
      };
      crdtCanvas.addDrawOperation(op);
      SocketService.emit('draw', op);
      draw(op);
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    SocketService.on('draw', (op: any) => {
      crdtCanvas.addDrawOperation(op);
      draw(op);
    });

    crdtCanvas.onDraw(draw);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} style={{ border: '1px solid black' }} />;
};

export default Canvas;
