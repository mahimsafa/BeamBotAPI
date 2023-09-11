import { Module } from '@nestjs/common';
import { TgGroupService } from './tg-group.service';
import { TgGroupController } from './tg-group.controller';

@Module({
	providers: [TgGroupService],
	controllers: [TgGroupController],
})
export class TgGroupModule {}
