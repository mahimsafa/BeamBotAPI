import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from 'src/prisma/prisma.service';
import { Logger } from '@nestjs/common';
import { CompetitionDto } from 'src/competition/dto';
import axios from 'axios';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Processor('competition')
export class QueueProcessor {
	// Logger
	private readonly logger = new Logger(QueueProcessor.name);

	constructor(
		private prisma: PrismaService,
		@InjectQueue('competition') private readonly competitionQueue: Queue,
	) {}

	@Process()
	async handleTest(job: Job<CompetitionDto>) {
		try {
			await this.endCompetition(job.data);
			await this.notifyGroup(job.data);
		} catch (error) {
			this.logger.error('Error ending competition:', error);

			throw new Error(error);
		}
	}

	async endCompetition(competition: CompetitionDto) {
		try {
			await this.prisma.competition.update({
				where: { id: competition.id },
				data: { isRunning: false },
			});
		} catch (error) {
			this.logger.error('Error ending competition:', error);

			throw new Error(error);
		}
	}

	// Implement logic to notify participants through the Telegram bot using the groupId
	async notifyGroup(competition: CompetitionDto) {
		const topSubmissions = await this.prisma.submission.findMany({
			where: {
				competitionId: competition.id,
			},
			orderBy: {
				votes: {
					_count: 'desc',
				},
			},
			take: 3,
			include: {
				creator: {
					select: {
						username: true,
					},
				},
			},
		});

		const submissionsCount = topSubmissions.length;

		const winners = [];
		const mediaGroup = [];

		for (let i = 0; i < submissionsCount; i++) {
			const submission = topSubmissions[i];

			winners[i] = '@' + submission.creator.username;
			mediaGroup[i] = {
				type: 'photo',
				media: submission.imageURL,
			};
		}

		if (mediaGroup.length == 0) {
			mediaGroup.push({
				type: 'photo',
				media:
					'https://firebasestorage.googleapis.com/v0/b/beambotfilestorage.appspot.com/o/BeamBotLabs2%20copy.jpg?alt=media&token=fac54072-dab4-4176-b803-399f87ee85c2',
			});
		}

		// Date and Time Formatting
		const latestCompStartTime = this.getFormattedDate(competition.startTime);
		const latestCompStartTimeMs = new Date(competition.startTime);

		const latestCompDuration = competition.durationHrs;
		const latestCompEndTime = this.getFormattedDate(
			new Date(
				latestCompStartTimeMs.getTime() + latestCompDuration * 60 * 60 * 1000,
			),
		);

		// Template for end of competition message
		const endCompTemplate = `
		🏁 <b>Content Creation Competition Ended!</b> 🏁

🎯 <b>Competition Details</b> 🎯
☑️ <b>Competition Type:</b> ${competition.mode}
🥇 <b>1st Prize:</b> ${
			competition.prize1
		} ${competition.projectChain.toUpperCase()}${
			competition.prize2 == undefined || competition.prize2 == 0
				? ''
				: `\n🥈 <b>2nd Prize:</b> ${
						competition.prize2
				  } ${competition.projectChain.toUpperCase()}`
		}${
			competition.prize3 == undefined || competition.prize3 == 0
				? ''
				: `\n🥉 <b>3rd Prize:</b> ${
						competition.prize3
				  } ${competition.projectChain.toUpperCase()}`
		}
🕥 <b>Start time:</b> ${latestCompStartTime}
⌛️ <b>End time:</b> ${latestCompEndTime}
⏳ <b>Duration:</b> ${latestCompDuration} hrs 

🏆🏆🏆 <b>Winners</b> 🏆🏆🏆
${
	winners[0] != undefined
		? '🥇 <i>1st:</i> ' + winners[0]
		: 'No winners for this competition!'
}${winners[1] != undefined ? '\n🥈 <i>2nd:</i> ' + winners[1] : ''}${
			winners[2] != undefined ? '\n🥉 <i>3rd:</i> ' + winners[2] : ''
		}

<i>You can start a new competition by running the /start_comp command in your group.</i>

<i>BeamBot is currently in beta. If you have any feedback or suggestions, please contact us at @BeamBotLabs.</i>
		`;

		// Adding the msg to caption of first photo in mediaGroup
		mediaGroup[0]['caption'] = endCompTemplate;
		mediaGroup[0]['parse_mode'] = 'HTML';

		try {
			await axios
				.post(
					`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMediaGroup`,
					{
						chat_id: competition.groupId,
						media: mediaGroup,
					},
				)
				.catch((error) => {
					this.logger.error('Error Sending msg to telegram group:', error);

					throw new Error(error);
				});
		} catch (error) {
			this.logger.error('Error Sending msg to telegram group:', error);

			throw new Error(error);
		}
	}

	getFormattedDate(startTime: Date) {
		const compStartTime = new Date(startTime);

		// Get start time in format: 1 Jan 2021, 12:00 AM
		const compStartTimeMs = new Date(compStartTime.getTime());
		const compStartMonth = compStartTimeMs.toLocaleString('default', {
			month: 'short',
		});
		const compStartDay = compStartTimeMs.getDate();
		const timeHrMin = compStartTimeMs.toLocaleString('en-us').split(',')[1];

		// Get Timezone (example: GMT+8, UTC-5, etc.)
		const localTimeZoned = new Date()
			.toString()
			.match(/([A-Z]+[\+-][0-9]+)/)[1];

		// Example localTimeZoned: GMT+0300
		// Format localTimeZoned so that there are not zeros in front of the hour and minutes
		const localTimeZonedSplit = localTimeZoned.split('');
		const localTimeZonedHour =
			localTimeZonedSplit[4] == '0'
				? localTimeZonedSplit[5]
				: localTimeZonedSplit[4] + localTimeZonedSplit[5];
		const localTimeZonedMin =
			localTimeZonedSplit[6] == '0' && localTimeZonedSplit[7] == '0'
				? ''
				: localTimeZonedSplit[6] + localTimeZonedSplit[7];
		const localTimeZonedFormatted = `${localTimeZonedSplit[0]}${
			localTimeZonedSplit[1]
		}${localTimeZonedSplit[2]}${localTimeZonedSplit[3]}${localTimeZonedHour}${
			localTimeZonedMin == '' ? '' : ':' + localTimeZonedMin
		}`;

		return `${compStartDay} ${compStartMonth},${timeHrMin} ${localTimeZonedFormatted}`;
	}
}
