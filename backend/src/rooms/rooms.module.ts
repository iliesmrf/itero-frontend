import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsController } from './rooms.controller';
import { Room, RoomSchema } from '../retro/schemas/room.schema';
import { PIRoom, PIRoomSchema } from '../pi/schemas/pi-room.schema';
import { VisionRoom, VisionRoomSchema } from '../vision/schemas/vision-room.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: PIRoom.name, schema: PIRoomSchema },
      { name: VisionRoom.name, schema: VisionRoomSchema },
    ]),
  ],
  controllers: [RoomsController],
})
export class RoomsModule {}
