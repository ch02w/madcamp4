import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TimeManager } from '../timeManager';
import { Logger } from '@nestjs/common';

@WebSocketGateway()
export class MusicGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private notes: { note: number; time: number }[];
  private readonly timeManager = new TimeManager();
  private readonly logger = new Logger(MusicGateway.name);

  constructor() {
    this.initializeNotes();
    this.setupTimeManager();
  }

  initializeNotes() {
    this.notes = Array.from({ length: 64 }, (_, index) => ({
      note: -1,
      time: index,
    }));
  }

  setupTimeManager() {
    this.timeManager.on('operation', () => {
      this.logger.log('Operation phase started');
      this.server.emit('pause', false); // Resume
      this.initializeNotes();
      this.server.emit('clearNotes', this.notes);
    });

    this.timeManager.on('rest', () => {
      this.logger.log('Rest phase started');
      this.server.emit('pause', true); // Pause
    });

  }

  handleConnection(client: Socket) {
    console.log('New client connected');
    client.emit('updateSheet', this.notes);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected');
  }

  @SubscribeMessage('requestSheet')
  handleRequestSheet(): void {
    console.log('Request Sheet');
    this.server.emit('updateSheet', this.notes);
  }

  @SubscribeMessage('addNote')
  handleAddNote(@MessageBody() noteData: { note: number; time: number }): void {
    console.log('Add Note');
    const { note, time } = noteData;
    const noteIndex = this.notes.findIndex((n) => n.time === time);

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

}
