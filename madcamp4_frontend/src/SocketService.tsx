import { io, Socket } from 'socket.io-client';

class SocketService {
  socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000');
  }

  on(event: string, callback: (data: any) => void) {
    this.socket.on(event, callback);
  }

  emit(event: string, data: any) {
    this.socket.emit(event, data);
  }
}

const socketServiceInstance = new SocketService();
export default socketServiceInstance;
