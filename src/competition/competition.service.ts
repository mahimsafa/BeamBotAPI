import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { CompetitionDto } from './dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

/* BullJobOption:
	- List of Bull.JobOptions:
	{
		priority?: number; 										- priority: priority of the job (default: 0)
		attempts?: number; 										- attempts: number of attempts after which the job fails (default: 1)
		delay?: number; 											- delay: delay in milliseconds before the job is executed (default: 0)
		timeout?: number; 										- timeout: number of milliseconds after which the job times out (default: 5000)
		backoff?: number | BackoffOptions; 		- backoff: backoff setting for automatic retries if the job fails (default: { type: 'exponential', delay: 0 })
		jobId?: string; 											- jobId: optional job ID if you want to override the default job ID generation
		removeOnComplete?: boolean | number; 	- removeOnComplete: if true, removes the job when it successfully completes (default: false)
		removeOnFail?: boolean | number; 			- removeOnFail: if true, removes the job when it fails after all attempts (default: false)
		stackTraceLimit?: number; 						- stackTraceLimit: limits the amount of stack trace lines that will be recorded in the stacktrace (default: Infinity)
		lifo?: boolean; 											- lifo: if true, adds the job to the right of the queue instead of the left (default: false)
		rateLimit?: RateLimiterOptions; 			- rateLimit: rate limiter for the job (default: { max: 0, duration: 0 })
		limiter?: RateLimiter; 								- limiter: instance of a custom limiter to use for rate limiting
		defaultJobOptions?: JobOptions; 			- defaultJobOptions: default job options to use for this job
		parent?: Job; 												- parent: parent job
		...customJobData 											- ...customJobData: any other custom data you want to associate with this job
	}

	- List of Bull.BackoffOptions:
	{
		type?: 'fixed' | 'exponential';				- type: type of backoff (fixed or exponential) For fixed backoff, the delay stays the same between retries. For exponential backoff, the delay grows exponentially between retries. (default: 'exponential')
		delay?: number;												- delay: delay in milliseconds (default: 0)
		factor?: number;											- factor: backoff factor to use for exponential backoff (default: 1)
		jitter?: number;											- jitter: random value between 0 and 1 to add randomness to backoff (default: 0)
		cap?: number;													- cap: maximum value of delay in milliseconds (default: Infinity)
	}

	- List of Bull.RateLimiterOptions:
	{
		max?: number;													- max: maximum number of jobs processed during the given duration (default: 0)
		duration?: number; 										- duration: duration of time in milliseconds to limit the max processed jobs (default: 0)
	}

*/

@Injectable()
export class CompetitionService {
	constructor(
		private prisma: PrismaService,
		@InjectQueue('competition') private readonly competitionQueue: Queue,
	) {}

	// Start competition
	async startCompetition(compData: CompetitionDto) {
		// Parse numeric values
		compData.groupId = compData.groupId.toString();
		compData.durationHrs = parseInt(compData.durationHrs.toString());
		compData.prize1 = parseFloat(compData.prize1.toString());
		compData.prize2 = parseFloat(compData.prize2.toString());
		compData.prize3 = parseFloat(compData.prize3.toString());

		try {
			// Start competition
			const compEntry = await this.prisma.competition.create({
				data: {
					groupId: compData.groupId,
					title: compData.title,
					mode: compData.mode,
					startTime: compData.startTime,
					durationHrs: compData.durationHrs,
					projectChain: compData.projectChain,
					prize1: compData.prize1,
					prize2: compData.prize2,
					prize3: compData.prize3,
				},
			});

			// Add competition to competition queue
			await this.competitionQueue.add(compEntry, {
				jobId: compEntry.id,
				delay: compData.durationHrs * 60 * 60 * 1000,
				removeOnComplete: true,
				// Try again (attempts should be after 3 minutes)
				attempts: 3,
				backoff: 3 * 60 * 1000,
			});

			return compEntry;
		} catch (error) {
			console.log(error);

			// Handle other errors if needed
			throw new HttpException(
				'Error processing competition details',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	// Get competition -> single
	async getCompetition(groupId: string, compId: string) {
		try {
			const competition = await this.prisma.competition.findFirstOrThrow({
				where: {
					groupId: groupId,
					id: compId,
				},
				include: {
					submissions: {
						include: {
							votes: true,
						},
						orderBy: {
							votes: {
								_count: 'desc',
							},
						},
					},
					group: true,
				},
			});

			const currentTimeUnix = Math.floor(new Date().getTime() / 1000); // Current time in Unix timestamp format (seconds since 1970-01-01)

			const duration = competition.durationHrs * 60 * 60; // Duration of competition in seconds

			const startTimeUnix = new Date(competition.startTime).getTime() / 1000; // Start time of competition in Unix timestamp format (seconds since 1970-01-01)

			const endTimeUnix = startTimeUnix + duration; // End time of competition in Unix timestamp format (seconds since 1970-01-01)

			const timeLeft = endTimeUnix - currentTimeUnix; // Time left in seconds

			// Add timeLeft to competition object
			competition['timeLeft'] = Math.floor(timeLeft);

			competition.submissions.forEach((submission) => {
				const submissionTimeUnix =
					new Date(submission.submissionDate).getTime() / 1000; // Submission time in Unix timestamp format (seconds since 1970-01-01)

				const submittedHrsAgo =
					(currentTimeUnix - submissionTimeUnix) / 60 / 60; // Time since submission in hours

				// const timePassed =
				// 	Math.floor(submittedHrsAgo) == 0
				// 		? Math.floor(submittedHrsAgo * 60) + 'm ago'
				// 		: Math.floor(submittedHrsAgo) + 'hr ago';

				// If timePassed is 24 hours or more, use days instead of hours
				// If timePassed is less than 24 hours, use hours
				// If timePassed is less than 1 hour, use minutes
				const timePassed =
					Math.floor(submittedHrsAgo) >= 24
						? Math.floor(submittedHrsAgo / 24) + 'd ago'
						: Math.floor(submittedHrsAgo) >= 1
						? Math.floor(submittedHrsAgo) + 'hr ago'
						: Math.floor(submittedHrsAgo * 60) + 'm ago';

				submission['timePassed'] = timePassed;

				submission['votersIdList'] = [];

				submission.votes.forEach((vote) => {
					submission['votersIdList'].push(vote.userId);
				});
			});

			return competition;
		} catch (error) {
			// Handle errors
			if (error.code === 'P2025') {
				// No competition found
				throw new HttpException(
					'No competition found',
					HttpStatus.NOT_FOUND, // 404
				);
			}

			throw new HttpException(
				'Error getting comp',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	// Get competitions -> list
	async getCompetitions(groupId: string) {
		try {
			const competitions = await this.prisma.competition.findMany({
				where: {
					groupId: groupId,
				},
			});

			return competitions;
		} catch (error) {
			// Handle errors if needed
			throw new HttpException(
				'Error processing comp',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	// Get latest competition even if it's not active
	async getLatestCompetition(groupId: string) {
		try {
			const latestCompetition = await this.prisma.competition.findFirstOrThrow({
				where: {
					groupId: groupId,
				},
				orderBy: {
					startTime: 'desc',
				},
			});

			return latestCompetition;
		} catch (error) {
			// Handle error if no active competition
			if (error.code === 'P2025') {
				console.log('NO COMP FOUND');
				throw new HttpException(
					'No active competition',
					HttpStatus.NOT_FOUND, // 404
				);
			}

			console.log('OTHER ERR' + error);
			// The following error is thrown
			throw new HttpException(
				'Error processing comp',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	// Get active competition
	async getActiveCompetition(groupId: string) {
		try {
			const activeCompetition = await this.prisma.competition.findFirstOrThrow({
				where: {
					groupId: groupId,
					isRunning: true,
				},
			});

			return activeCompetition;
		} catch (error) {
			// Handle error if no active competition
			if (error.code === 'P2025') {
				console.log('NO COMP FOUND');
				throw new HttpException(
					'No active competition',
					HttpStatus.NOT_FOUND, // 404
				);
			}

			console.log('OTHER ERR' + error);
			// The following error is thrown
			throw new HttpException(
				'Error processing comp',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	// End active competition
	async endCompetition(groupId: string, compId: string) {
		try {
			// end competition id 1
			await this.prisma.competition.update({
				where: {
					id: compId,
				},
				data: {
					isRunning: false,
				},
			});

			// Remove competition from bull queue
			const job = await this.competitionQueue.getJob(compId);
			console.log(job);
			await job.remove();
		} catch (error) {
			console.log(error);
			if (error.code === 'P2025') {
				throw new HttpException(
					'No active competition',
					HttpStatus.NOT_FOUND, // 404
				);
			}

			// Handle errors if needed
			throw new HttpException(
				'Error processing comp',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}

		return 'Ended';
	}

	// Get competition submissions ordered by number of votes
	async getOrderedSubmissions(compId: string) {
		try {
			const submissions = await this.prisma.submission.findMany({
				where: {
					competitionId: compId,
				},
				orderBy: {
					votes: {
						_count: 'desc',
					},
				},
			});

			return submissions;
		} catch (error) {
			// Handle errors if needed
			throw new HttpException(
				'Error processing comp',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}
}
