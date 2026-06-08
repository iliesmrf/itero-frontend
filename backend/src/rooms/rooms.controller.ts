import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room, RoomDocument } from '../retro/schemas/room.schema';
import { PIRoom, PIRoomDocument } from '../pi/schemas/pi-room.schema';
import { VisionRoom, VisionRoomDocument } from '../vision/schemas/vision-room.schema';

@Controller('rooms')
export class RoomsController {
  constructor(
    @InjectModel(Room.name) private retroRoomModel: Model<RoomDocument>,
    @InjectModel(PIRoom.name) private piRoomModel: Model<PIRoomDocument>,
    @InjectModel(VisionRoom.name) private visionRoomModel: Model<VisionRoomDocument>,
  ) {}

  @Get(':code')
  async findRoom(@Param('code') code: string): Promise<{ type: 'retro' | 'dod' | 'pi' | 'vision'; code: string }> {
    const upperCode = code.trim().toUpperCase();

    const retroRoom = await this.retroRoomModel.findOne({ code: upperCode }).exec();
    if (retroRoom) {
      const type = retroRoom.format === 'dod' ? 'dod' : 'retro';
      return { type, code: upperCode };
    }

    const piRoom = await this.piRoomModel.findOne({ code: upperCode }).exec();
    if (piRoom) {
      return { type: 'pi', code: upperCode };
    }

    const visionRoom = await this.visionRoomModel.findOne({ code: upperCode }).exec();
    if (visionRoom) {
      return { type: 'vision', code: upperCode };
    }

    throw new NotFoundException(`Room '${upperCode}' not found`);
  }
}
