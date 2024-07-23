import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class MusicGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private notes: { note: number; time: number }[];

  constructor() {
    this.initializeNotes();
  }

  initializeNotes() {
    this.notes = Array.from({ length: 64 }, (_, index) => ({
      note: -1,
      time: index,
    }));
  }

  handleConnection(client: Socket) {
    console.log('New client connected');
    client.emit('updateSheet', this.notes);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected');
  }

  @SubscribeMessage('addNote')
  handleAddNote(@MessageBody() noteData: { note: number; time: number }): void {
    console.log('Add Note');
    const { note, time } = noteData;
    const noteIndex = this.notes.findIndex(n => n.time === time);

    if (noteIndex !== -1) {
      if (this.notes[noteIndex].note === -1) {
        this.notes[noteIndex].note = note;
      } else if (this.notes[noteIndex].note === note) {
        this.notes[noteIndex].note = -1;
      } else {
        this.notes[noteIndex].note = note;
      }
    }

    this.server.emit('updateSheet', this.notes);
  }

  @SubscribeMessage('clearNotes')
  handleClearNotes(): void {
    this.initializeNotes();
    this.server.emit('updateSheet', this.notes);
  }
}
