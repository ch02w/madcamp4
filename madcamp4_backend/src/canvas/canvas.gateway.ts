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

  private canvasState: CanvasState = {};
  private colors: string[] = [];

  constructor() {
    setInterval(() => {
      this.handleClearOperation();
    }, 30000);
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('canvasState', { colors: this.colors, data: this.canvasState }); // Send current state to new client
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
    key: string;
    value: number;
    timestamp: number;
  }) {
    const { key, value, timestamp } = payload;
    if (!this.canvasState[key] || this.canvasState[key].timestamp < timestamp) {
      this.canvasState[key] = { value, timestamp };
      this.server.emit('canvasState', {
        colors: this.colors,
        data: this.canvasState,
      });
    }
  }

  handleClearOperation() {
    this.canvasState = {};
    this.colors = [];
    this.server.emit('clearCanvas', {
      colors: [],
      data: this.canvasState,
    });
    console.log('Cleared canvas');
  }
}
