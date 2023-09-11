import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SubmissionService } from './submission.service';
import { SubmissionDto, voteData } from './dto';
import axios from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('submission')
export class SubmissionController {
	constructor(
		private submissionService: SubmissionService,
		private prisma: PrismaService,
	) {}

	@Get('test')
	async test() {
		// 		const topSubmissions = await this.prisma.submission.findMany({
		// 			where: {
		// 				competitionId: 'cllcgjl5j0001ndss56dxt9q1',
		// 			},
		// 			orderBy: {
		// 				votes: {
		// 					_count: 'desc',
		// 				},
		// 			},
		// 			take: 3,
		// 			include: {
		// 				creator: {
		// 					select: {
		// 						username: true,
		// 					},
		// 				},
		// 			},
		// 		});
		// 		const submissionsCount = topSubmissions.length;
		// 		const winners = [];
		// 		for (let i = 0; i < submissionsCount; i++) {
		// 			const submission = topSubmissions[i];
		// 			winners[i] = '@' + submission.creator.username;
		// 		}
		// 		const x = `
		// 		🏆🏆🏆 <b>Winners</b> 🏆🏆🏆
		// ${
		// 	winners[0] != undefined
		// 		? '🥇 <i>1st:</i> ' + winners[0]
		// 		: 'No winners for this competition!'
		// }${winners[1] != undefined ? '\n🥈 <i>2nd:</i> ' + winners[1] : ''}${
		// 			winners[2] != undefined ? '\n🥉 <i>3rd:</i> ' + winners[2] : ''
		// 		}`;
		// 		const mediaGroup = [
		// 			{
		// 				type: 'photo',
		// 				media: 'https://api.dicebear.com/6.x/adventurer/jpg?seed=Toby',
		// 			},
		// 			{
		// 				type: 'photo',
		// 				media: 'https://api.dicebear.com/6.x/adventurer/jpg?seed=Snuggles',
		// 			},
		// 		];
		// 		mediaGroup.push({
		// 			type: 'photo',
		// 			media: 'https://api.dicebear.com/6.x/adventurer/jpg?seed=Sammy',
		// 		});
		// 		mediaGroup[0]['caption'] = x;
		// 		mediaGroup[0]['parse_mode'] = 'HTML';
		// 		await axios.post(
		// 			`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMediaGroup`,
		// 			{
		// 				chat_id: '-833749374',
		// 				media: mediaGroup,
		// 			},
		// 		);
		// 		await axios.post(
		// 			`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`,
		// 			{
		// 				chat_id: '-833749374',
		// 				text: x,
		// 				parse_mode: 'HTML',
		// 			},
		// 		);
	}

	// Submit entry
	@Post(':compId/submit')
	async submitEntry(
		@Param('compId') compId: string,
		@Body() submissionData: SubmissionDto,
	) {
		return await this.submissionService.submitEntry(compId, submissionData);
	}

	// Get all entries
	@Get(':compId/submissions')
	async getAllSubmissions(@Param('compId') compId: string) {
		return await this.submissionService.getAllSubmissions(compId);
	}

	// Get user entries
	@Get(':compId/submissions/:userId')
	async getUserSubmissions(
		@Param('compId') compId: string,
		@Param('userId') userId: string,
	) {
		return await this.submissionService.getUserSubmissions(compId, userId);
	}

	// Vote for entry
	@Post(':submissionId/vote')
	async voteForEntry(
		@Param('submissionId') submissionId: string,
		@Body() voterData: voteData,
	) {
		return await this.submissionService.voteForEntry(submissionId, voterData);
	}

	@Post(':submissionId/unvote')
	async unvoteForEntry(
		@Param('submissionId') submissionId: string,
		@Body() voterData: voteData,
	) {
		return await this.submissionService.unvoteForEntry(submissionId, voterData);
	}
}
