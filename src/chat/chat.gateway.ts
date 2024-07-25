import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() payload: { sender: string; message: string },
    client: Socket,
  ): void {
    console.log(payload);
    this.server.emit('message', payload);
  }

  @SubscribeMessage('header')
  handleHeader(
    @MessageBody() payload: { header: string },
    client: Socket,
  ): void {
    console.log(payload);
    this.server.emit('header', payload);
  }
}
