import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface CanvasState {
  [key: string]: { value: number; timestamp: number };
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

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('canvasState', { colors: this.colors, data: this.canvasState }); // Send current state to new client
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('updateCanvas')
  handleUpdateCanvas(@MessageBody() payload: { key: string; value: number; timestamp: number }) {
    const { key, value, timestamp } = payload;

    // Apply LWW logic and prevent duplicate requests
    if (!this.canvasState[key] || this.canvasState[key].timestamp < timestamp) {
      this.canvasState[key] = { value, timestamp };
      this.server.emit('canvasState', { colors: this.colors, data: this.canvasState }); // Broadcast updated state to all clients
    }
  }

  @SubscribeMessage('clearCanvas')
  handleClearCanvas() {
    this.canvasState = {};
    this.server.emit('canvasState', { colors: this.colors, data: this.canvasState }); // Broadcast cleared state to all clients
  }
}
