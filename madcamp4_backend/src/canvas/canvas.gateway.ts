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

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
}

interface CanvasOperation {
  type: 'draw' | 'clear';
  payload: any;
}

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
    setInterval(() => {
      this.handleRound();
    }, this.roundInterval);

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
    if (!this.isDrawingActive() && operation.type === 'draw') return; // Ignore draw operations during break

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
    console.log('Cleared canvas');
  }

  handleRound() {
    if (this.isDrawingActive()) {
      this.handleClearOperation();
      this.generateGLB();
    }
  }

  isDrawingActive() {
    const currentTime = new Date();
    const minutes = currentTime.getUTCMinutes();
    const seconds = currentTime.getUTCSeconds();
    const milliseconds = currentTime.getUTCMilliseconds();
    const totalMilliseconds = (minutes % 5) * 60000 + seconds * 1000 + milliseconds;

    return totalMilliseconds < this.drawInterval;
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

  async generateGLB() {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');
    
    const scene = new THREE.Scene();
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.Mesh(geometry, material);

    scene.add(mesh);

    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        const output = JSON.stringify(result, null, 2);
        const blob = new Blob([output], { type: 'application/octet-stream' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'canvas.glb';
        link.click();
      },
      (error) => console.error('An error occurred during parsing', error)
    );
  }
}
