import { Module } from '@nestjs/common';
import { CompetitionController } from './competition.controller';
import { CompetitionService } from './competition.service';
import { BullModule } from '@nestjs/bull';
import { QueueProcessor } from './comp-queue/queue.processor';

@Module({
	imports: [
		BullModule.registerQueue({
			name: 'competition',
		}),
	],
	controllers: [CompetitionController],
	providers: [CompetitionService, QueueProcessor],
})
export class CompetitionModule {}
