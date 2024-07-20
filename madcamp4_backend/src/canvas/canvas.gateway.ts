import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

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

  private canvasStates: CanvasState[] = [{}, {}, {}, {}, {}, {}];
  private clearInterval = 300000; // 5 minutes in milliseconds
  private lastClearTime = Date.now();

  constructor() {
    setInterval(() => {
      this.handleClearOperation();
    }, this.clearInterval);

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
  handleCanvasOperation(@MessageBody() operation: CanvasOperation) {
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
    this.canvasStates = [{}, {}, {}, {}, {}, {}];
    this.server.emit('clearCanvas', {
      colors: [],
      data: this.canvasStates,
    });
    this.lastClearTime = Date.now();
    console.log('Cleared canvas');
  }

  getRemainingTime() {
    return this.clearInterval - (Date.now() - this.lastClearTime);
  }

  emitRemainingTime() {
    this.server.emit('remainingTime', this.getRemainingTime());
  }
}
