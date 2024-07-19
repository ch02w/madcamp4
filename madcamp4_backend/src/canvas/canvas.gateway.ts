import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface CanvasState {
  [key: string]: { value: string; timestamp: number };
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

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('canvasState', this.canvasState); // Send current state to new client
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('updateCanvas')
  handleUpdateCanvas(@MessageBody() payload: { key: string; value: string; timestamp: number }, client: Socket): void {
    const { key, value, timestamp } = payload;

    if (!this.canvasState[key] || this.canvasState[key].timestamp < timestamp) {
      this.canvasState[key] = { value, timestamp };
      this.server.emit('canvasState', this.canvasState); // Broadcast updated state to all clients
    }
  }
}
