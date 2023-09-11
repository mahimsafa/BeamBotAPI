import { Controller, Get, Param } from '@nestjs/common';
import { AdSlotService } from './ad-slot.service';

@Controller('ad-slot')
export class AdSlotController {
	constructor(private authService: AdSlotService) {}

	@Get('available-slots')
	getAvailableAdSlots() {
		return this.authService.getAvailableAdSlots();
	}

	@Get('update-slot/:id')
	updateAdSlot(@Param('id') id: number) {
		// Allow user to update ad slot if they have one running
		return this.authService.updateAdSlot(id);
	}
}
