import { Controller } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { Post, Body } from '@nestjs/common';

@Controller('verify-tg')
export class VerificationController {
	constructor(private verificationService: VerificationService) {}

	// Verify user
	@Post('verify-user')
	async verifyUser(@Body() authData: any) {
		return await this.verificationService.verifyUser(authData);
	}
}
