import { Controller, Get, Post, Body, Param, UsePipes } from '@nestjs/common';
import { CompetitionService } from './competition.service';
import { CompetitionDto } from './dto';
import { GroupIdPipe } from './pipes/group-id.pipe';

@Controller('competition')
export class CompetitionController {
	constructor(private competitionService: CompetitionService) {}

	// Start competition
	@Post('start')
	async startCompetition(@Body() data: CompetitionDto) {
		return await this.competitionService.startCompetition(data);
	}

	// Get competition
	//@UsePipes(GroupIdPipe)
	@Get(':compId/group/:groupId')
	async getCompetition(
		@Param('groupId') groupId: string,
		@Param('compId') compId: string,
	) {
		return await this.competitionService.getCompetition(groupId, compId);
	}

	// Get competitions -> list
	@Get(':groupId')
	async getCompetitions(@Param('groupId') groupId: string) {
		return await this.competitionService.getCompetitions(groupId);
	}

	// Get active competition
	@Get(':groupId/active')
	async getActiveCompetition(@Param('groupId') groupId: string) {
		return await this.competitionService.getActiveCompetition(groupId);
	}

	// Get latest competition even if it's not active
	@Get(':groupId/latest')
	async getLatestCompetition(@Param('groupId') groupId: string) {
		return await this.competitionService.getLatestCompetition(groupId);
	}

	// End competition
	@Get(':groupId/end/:compId')
	async endCompetition(
		@Param('groupId') groupId: string,
		@Param('compId') compId: string,
	) {
		return await this.competitionService.endCompetition(groupId, compId);
	}

	// Get ordered list of submissions (by number of votes)
	@Get(':compId/submissions')
	async getSubmissions(@Param('compId') compId: string) {
		return await this.competitionService.getOrderedSubmissions(compId);
	}
}
