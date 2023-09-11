import { Module } from '@nestjs/common';
import { AdSlotController } from './ad-slot.controller';
import { AdSlotService } from './ad-slot.service';

@Module({
	controllers: [AdSlotController],
	providers: [AdSlotService],
})
export class AdSlotModule {}
