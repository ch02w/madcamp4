// src/canvas/canvas.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { TimeManager } from '../timeManager';

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

  private readonly logger = new Logger(CanvasGateway.name);
  private readonly timeManager = new TimeManager();

  private canvasStates: CanvasState[] = Array(6)
    .fill(null)
    .map(() => {
      const state: CanvasState = {};
      for (let x = 0; x < 200; x += 10) {
        for (let y = 0; y < 200; y += 10) {
          state[`pixel-${x}-${y}`] = { value: 0xffffff, timestamp: Date.now() }; // Initial color is white
        }
      }
      return state;
    });

  constructor() {
    this.logger.log('CanvasGateway constructor called');
    this.setupTimeManager();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('canvasState', { colors: [], data: this.canvasStates }); // Send current state to new client
    client.emit('remainingTime', this.timeManager.getRemainingTime());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('requestInitialCanvasState')
  handleInitialCanvasStateRequest(client: Socket) {
    client.emit('initialCanvasState', { colors: [], data: this.canvasStates });
  }

  @SubscribeMessage('canvasOperation')
  async handleCanvasOperation(@MessageBody() operation: CanvasOperation) {
    this.logger.log('Received canvasOperation:', operation);
    if (
      this.timeManager.getCurrentState() === 'rest' &&
      operation.type === 'draw'
    ) {
      this.logger.log('Ignoring draw operation during rest period');
      return; // Ignore draw operations during rest
    }

    try {
      switch (operation.type) {
        case 'draw':
          this.handleDrawOperation(operation.payload);
          break;
        case 'clear':
          this.handleClearOperation();
          break;
        default:
          this.logger.log('Unknown operation type:', operation.type);
          break;
      }
    } catch (error) {
      this.logger.error('Error handling canvas operation:', error);
    }
  }

  handleDrawOperation(payload: {
    canvasIndex: number;
    key: string;
    value: number;
    timestamp: number;
  }) {
    this.logger.log('Handling draw operation with payload:', payload);
    const { canvasIndex, key, value, timestamp } = payload;
    if (
      !this.canvasStates[canvasIndex][key] ||
      this.canvasStates[canvasIndex][key].timestamp < timestamp
    ) {
      this.canvasStates[canvasIndex][key] = { value, timestamp };
      this.server.emit('canvasState', {
        colors: [],
        data: this.canvasStates,
      });
    }
  }

  handleClearOperation() {
    this.logger.log('Handling clear operation');
    this.canvasStates = Array(6)
      .fill(null)
      .map(() => {
        const state: CanvasState = {};
        for (let x = 0; x < 200; x += 10) {
          for (let y = 0; y < 200; y += 10) {
            state[`pixel-${x}-${y}`] = {
              value: 0xffffff,
              timestamp: Date.now(),
            }; // Initial color is white
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
    this.logger.log('Cleared canvas');
  }

  setupTimeManager() {
    this.timeManager.on('operation', () => {
      this.logger.log('Operation phase started');
      this.server.emit('pause', false); // Resume drawing
      this.handleClearOperation();
    });

    this.timeManager.on('rest', () => {
      this.logger.log('Rest phase started');
      this.server.emit('pause', true); // Pause drawing
    });

    this.emitRemainingTime();
  }

  emitRemainingTime() {
    setInterval(() => {
      const remainingTime = this.timeManager.getRemainingTime();
      this.logger.log('Emitting remaining time:', remainingTime);
      this.server.emit('remainingTime', remainingTime);
    }, 1000);
  }
}
