import { Module } from '@nestjs/common';
import { MusicGateway } from './music.gateway';

@Module({
  providers: [MusicGateway],
})
export class MusicModule {}
