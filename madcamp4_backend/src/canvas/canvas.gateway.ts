import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as THREE from 'three';
import * as fs from 'fs';
import * as path from 'path';
import { createCanvas, Canvas as NodeCanvas } from 'canvas';
import { Blob, FileReader } from 'vblob';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

global.window = global as any;
global.Blob = Blob;
global.FileReader = FileReader;
global.THREE = THREE;

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
}

interface CanvasOperation {
  type: 'draw' | 'clear';
  payload: any;
}

const mockDocument = {
  createElement: (nodeName: string) => {
    if (nodeName !== 'canvas') throw new Error(`Cannot create node ${nodeName}`);
    const canvas: HTMLCanvasElement = createCanvas(256, 256) as unknown as HTMLCanvasElement;
    return canvas;
  },
} as unknown as Document;

global.document = mockDocument;

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CanvasGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private canvasStates: CanvasState[] = Array(6).fill(null).map(() => {
    const state: CanvasState = {};
    for (let x = 0; x < 200; x += 10) {
      for (let y = 0; y < 200; y += 10) {
        state[`pixel-${x}-${y}`] = { value: 0xFFFFFF, timestamp: Date.now() }; // Initial color is white
      }
    }
    return state;
  });

  private drawInterval = 270000; // 4.5 minutes in milliseconds
  private breakInterval = 30000; // 30 seconds in milliseconds
  private roundInterval = this.drawInterval + this.breakInterval;

  constructor() {
    this.scheduleNextEvent();
    setInterval(() => {
      this.emitRemainingTime();
    }, 1000);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('canvasState', { colors: [], data: this.canvasStates }); // Send current state to new client
    client.emit('remainingTime', this.getRemainingTime());
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('canvasOperation')
  async handleCanvasOperation(@MessageBody() operation: CanvasOperation) {
    if (this.getRemainingTime() > this.drawInterval && operation.type === 'draw') return; // Ignore draw operations during break

    switch (operation.type) {
      case 'draw':
        this.handleDrawOperation(operation.payload);
        break;
      case 'clear':
        this.handleClearOperation();
        break;
      default:
        break;
    }
  }

  handleDrawOperation(payload: {
    canvasIndex: number;
    key: string;
    value: number;
    timestamp: number;
  }) {
    const { canvasIndex, key, value, timestamp } = payload;
    if (!this.canvasStates[canvasIndex][key] || this.canvasStates[canvasIndex][key].timestamp < timestamp) {
      this.canvasStates[canvasIndex][key] = { value, timestamp };
      this.server.emit('canvasState', {
        colors: [],
        data: this.canvasStates,
      });
    }
  }

  handleClearOperation() {
    this.canvasStates = Array(6).fill(null).map(() => {
      const state: CanvasState = {};
      for (let x = 0; x < 200; x += 10) {
        for (let y = 0; y < 200; y += 10) {
          state[`pixel-${x}-${y}`] = { value: 0xFFFFFF, timestamp: Date.now() }; // Initial color is white
        }
      }
      return state;
    });

    this.server.emit('clearCanvas', {
      colors: [],
      data: this.canvasStates,
    });
    this.server.emit('canvasState', {
      colors: [],
      data: this.canvasStates,
    });
    console.log('Cleared canvas');
  }

  async handleDrawingEnd() {
    console.log('Drawing phase ended, generating GLB...');
    await this.generateGLB();
  }

  handleBreakEnd() {
    console.log('Break phase ended, clearing canvas...');
    this.handleClearOperation();
  }

  getRemainingTime() {
    const currentTime = new Date();
    const minutes = currentTime.getUTCMinutes();
    const seconds = currentTime.getUTCSeconds();
    const milliseconds = currentTime.getUTCMilliseconds();
    const totalMilliseconds = (minutes % 5) * 60000 + seconds * 1000 + milliseconds;

    return this.roundInterval - totalMilliseconds;
  }

  emitRemainingTime() {
    this.server.emit('remainingTime', this.getRemainingTime());
  }

  scheduleNextEvent() {
    const currentTime = new Date();
    const minutes = currentTime.getUTCMinutes();
    const seconds = currentTime.getUTCSeconds();
    const milliseconds = currentTime.getUTCMilliseconds();
    const totalMilliseconds = (minutes % 5) * 60000 + seconds * 1000 + milliseconds;

    let nextEventTime;
    if (minutes % 5 < 4 || (minutes % 5 === 4 && seconds < 30)) {
      // Drawing phase
      nextEventTime = (4 * 60000 + 30000) - totalMilliseconds;
    } else {
      // Break phase
      nextEventTime = (5 * 60000) - totalMilliseconds;
    }

    setTimeout(() => {
      if (!this.isDrawingActive()) {
        this.handleDrawingEnd();
      } else {
        this.handleBreakEnd();
      }
      this.scheduleNextEvent();
    }, nextEventTime);
  }

  isDrawingActive() {
    const currentTime = new Date();
    const minutes = currentTime.getUTCMinutes();
    const seconds = currentTime.getUTCSeconds();
    const milliseconds = currentTime.getUTCMilliseconds();
    const totalMilliseconds = (minutes % 5) * 60000 + seconds * 1000 + milliseconds;

    return totalMilliseconds < this.drawInterval;
  }

  async generateGLB() {
    const scene = new THREE.Scene();
    const materialArray = this.canvasStates.map((canvasState) => {
      const canvas = createCanvas(200, 200);
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        Object.entries(canvasState).forEach(([key, { value }]) => {
          const [_, x, y] = key.split('-');
          ctx.fillStyle = `#${value.toString(16).padStart(6, '0')}`;
          ctx.fillRect(parseInt(x), parseInt(y), 10, 10);
        });
      }
      const texture = new THREE.CanvasTexture(canvas as any);
      return new THREE.MeshBasicMaterial({ map: texture });
    });

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
      materialArray[0], // Right (x+)
      materialArray[1], // Left (x-)
      materialArray[2], // Top (y+)
      materialArray[3], // Bottom (y-)
      materialArray[4], // Front (z+)
      materialArray[5], // Back (z-)
    ];
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);

    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        if (result instanceof ArrayBuffer) {
          const output = Buffer.from(result);
          const filePath = path.join(__dirname, '..', 'public', 'canvas.glb');
          fs.writeFileSync(filePath, output);
          this.server.emit('glbGenerated', { url: `http://localhost:3001/public/canvas.glb` });
        } else {
          console.error('Unexpected result format from GLTFExporter');
        }
      },
      (error) => console.error('An error occurred during parsing', error),
      { binary: true }
    );
  }
}
