import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VisionGateway } from './vision.gateway';
import { VisionService } from './vision.service';
import { AuthModule } from '../auth/auth.module';
import { VisionRoom, VisionRoomSchema } from './schemas/vision-room.schema';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([{ name: VisionRoom.name, schema: VisionRoomSchema }]),
  ],
  providers: [VisionGateway, VisionService],
  exports: [MongooseModule],
})
export class VisionModule {}
