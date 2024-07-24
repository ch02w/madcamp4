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
    this.logger.log('CanvasGateway constructor called');
    this.scheduleNextEvent();
    setInterval(() => {
      this.emitRemainingTime();
    }, 1000);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('canvasState', { colors: [], data: this.canvasStates }); // Send current state to new client
    client.emit('remainingTime', this.getRemainingTime());
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('canvasOperation')
  async handleCanvasOperation(@MessageBody() operation: CanvasOperation) {
    this.logger.log('Received canvasOperation:', operation);
    if (this.isDrawingPaused() && operation.type === 'draw') {
      this.logger.log('Ignoring draw operation during break');
      return; // Ignore draw operations during break
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
    if (!this.canvasStates[canvasIndex][key] || this.canvasStates[canvasIndex][key].timestamp < timestamp) {
      this.canvasStates[canvasIndex][key] = { value, timestamp };
      this.server.emit('canvasState', {
        colors: [],
        data: this.canvasStates,
      });
    }
  }

  handleClearOperation() {
    this.logger.log('Handling clear operation');
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
    this.logger.log('Cleared canvas');
  }

  handleBreakEnd() {
    this.logger.log('Break phase ended, clearing canvas...');
    this.handleClearOperation();
  }

  getRemainingTime() {
    const currentTime = new Date();
    const minutes = currentTime.getUTCMinutes();
    const seconds = currentTime.getUTCSeconds();
    const milliseconds = currentTime.getUTCMilliseconds();
    const totalMilliseconds = (minutes % 5) * 60000 + seconds * 1000 + milliseconds;
    this.logger.log('Calculating remaining time:', totalMilliseconds);
    return this.roundInterval - totalMilliseconds;
  }

  emitRemainingTime() {
    const remainingTime = this.getRemainingTime();
    this.logger.log('Emitting remaining time:', remainingTime);
    this.server.emit('remainingTime', remainingTime);
  }

  scheduleNextEvent() {
    this.logger.log('Scheduling next event');
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

    this.logger.log('Next event time scheduled in ms:', nextEventTime);
    setTimeout(() => {
      if (this.isDrawingActive()) {
        this.handleBreakEnd();
      } else {
        this.handleClearOperation();
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
    this.logger.log('Checking if drawing is active:', totalMilliseconds < this.drawInterval);
    return totalMilliseconds < this.drawInterval;
  }

  isDrawingPaused() {
    return this.getRemainingTime() <= this.breakInterval;
  }
}
