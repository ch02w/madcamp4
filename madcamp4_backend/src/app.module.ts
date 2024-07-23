import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatGateway } from './chat/chat.gateway';
import { CanvasGateway } from './canvas/canvas.gateway';
import { MusicGateway} from "./music/music.gateway";

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ChatGateway, CanvasGateway, MusicGateway],
})
export class AppModule {}
