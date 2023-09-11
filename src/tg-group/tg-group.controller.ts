import { Controller, Get, Body, Post, Param } from '@nestjs/common';
import { TgGroupService } from './tg-group.service';
import { TgGroupDto } from './dto';

@Controller('tg-group')
export class TgGroupController {
	constructor(private tgGroupService: TgGroupService) {}

	@Post('register')
	async registerTgGroup(@Body() data: TgGroupDto) {
		return await this.tgGroupService.registerTgGroup(data);
	}

	@Get(':id/details')
	async getTgGroup(@Param('id') groupId: string) {
		return await this.tgGroupService.getTgGroup(groupId);
	}

	@Post('update')
	async updateTgGroup(@Body() data: TgGroupDto) {
		return await this.tgGroupService.updateTgGroup(data);
	}
}
