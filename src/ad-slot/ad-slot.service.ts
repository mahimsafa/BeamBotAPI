import { Injectable } from '@nestjs/common';

@Injectable()
export class AdSlotService {
	getAvailableAdSlots() {
		return [];
	}

	updateAdSlot(id: number) {
		// Retrieve ad slot
		console.log(id);

		// Return
		return {
			adReserved: false,
			adDetails: {
				adId: 0,
				adText: '',
				adURL: '',
			},
		};
	}
}
