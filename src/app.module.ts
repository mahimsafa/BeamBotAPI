import { Module } from '@nestjs/common';
import { TgGroupModule } from './tg-group/tg-group.module';
import { AdSlotModule } from './ad-slot/ad-slot.module';
import { CompetitionModule } from './competition/competition.module';
import { PrismaModule } from './prisma/prisma.module';
import { SubmissionModule } from './submission/submission.module';
import { BullModule } from '@nestjs/bull';
import { VerificationService } from './verification/verification.service';
import { VerificationModule } from './verification/verification.module';

@Module({
	imports: [
		TgGroupModule,
		AdSlotModule,
		CompetitionModule,
		PrismaModule,
		SubmissionModule,
		BullModule.forRoot({
			redis: {
				username: 'default',
				host: process.env.REDIS_HOST,
				password: process.env.REDIS_PASSWORD,
				port: parseInt(process.env.REDIS_PORT),
			},
		}),
		VerificationModule,
	],
	controllers: [],
	providers: [VerificationService],
})
export class AppModule {}
