import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PIGateway } from './pi.gateway';
import { PIService } from './pi.service';
import { AuthModule } from '../auth/auth.module';
import { PIRoom, PIRoomSchema } from './schemas/pi-room.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: PIRoom.name, schema: PIRoomSchema }]),
  ],
  providers: [PIGateway, PIService],
  exports: [MongooseModule],
})
export class PIModule {}
