import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { SubmissionDto, voteData } from './dto';
import { User } from '@prisma/client';

@Injectable()
export class SubmissionService {
	constructor(private prisma: PrismaService) {}

	// Submit entry to competition
	async submitEntry(compId: string, submissionData: SubmissionDto) {
		// Parsing
		submissionData.creatorTGID = submissionData.creatorTGID.toString();

		try {
			// If user is not in the database, add them
			let user: User;

			// Check if user exists
			user = await this.prisma.user.findUnique({
				where: {
					userTGID: submissionData.creatorTGID,
				},
			});

			if (user) {
				// Check if username has changed
				if (user.username !== submissionData.username) {
					user = await this.prisma.user.update({
						where: { userTGID: submissionData.creatorTGID },
						data: { username: submissionData.username },
					});
				}
			}

			// Create user if not found
			if (!user) {
				user = await this.prisma.user.create({
					data: {
						userTGID: submissionData.creatorTGID,
						username: submissionData.username,
						firstName: submissionData.firstName,
						lastName: submissionData.lastName,
					},
				});
			}

			// Submit entry
			await this.prisma.submission.create({
				data: {
					imageURL: submissionData.imageURL,
					caption: submissionData.caption,
					competitionId: compId,
					creatorId: user.userTGID,
				},
			});

			return 'Entry submitted';
		} catch (error) {
			console.log(error);

			// Handle other errors if needed
			throw new HttpException(
				'Error processing group details',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	// Get all entries -> list
	async getAllSubmissions(compId: string) {
		try {
			const entries = await this.prisma.submission.findMany({
				where: {
					competitionId: compId,
				},
			});

			return entries;
		} catch (error) {
			console.log(error);
			if (error.code === 'P2025') {
				throw new HttpException(
					'No submissions found',
					HttpStatus.NOT_FOUND, // 404
				);
			}

			// Handle other errors if needed
			throw new HttpException(
				'Error processing submissions',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	// Get user entries -> list
	async getUserSubmissions(compId: string, userId: string) {
		try {
			const entries = await this.prisma.submission.findMany({
				where: {
					competitionId: compId,
					creatorId: userId,
				},
			});

			return entries;
		} catch (error) {
			console.log(error);
			if (error.code === 'P2025') {
				throw new HttpException(
					'No submissions found',
					HttpStatus.NOT_FOUND, // 404
				);
			}

			// Handle other errors if needed
			throw new HttpException(
				'Error processing submissions',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	// Vote for entry
	async voteForEntry(submissionId: string, voteData: voteData) {
		if (!voteData.userTgid) {
			throw new HttpException(
				'User TGID not provided',
				HttpStatus.BAD_REQUEST, // 400
			);
		}
		try {
			// Check if competition is running
			await this.prisma.competition.findFirstOrThrow({
				where: {
					id: voteData.compId,
					isRunning: true,
				},
			});

			const user = await this.prisma.user.findUnique({
				where: {
					userTGID: voteData.userTgid,
				},
			});

			// Create user if not exist
			if (!user) {
			}

			// Check if user has already voted
			const vote = await this.prisma.vote.findFirst({
				where: {
					submissionId: submissionId,
					userId: voteData.userTgid,
				},
			});

			if (vote) {
				// User has already voted
				throw new HttpException(
					'User has already voted',
					HttpStatus.BAD_REQUEST, // 400
				);
			}

			// Create vote
			await this.prisma.vote.create({
				data: {
					submissionId: submissionId,
					userId: voteData.userTgid,
				},
			});

			return 'Vote submitted';
		} catch (error) {
			console.log(error);
			// Handle other errors if needed
			throw new HttpException(
				'Error processing vote',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	// Unvote for entry
	async unvoteForEntry(submissionId: string, voteData: voteData) {
		if (!voteData.userTgid) {
			throw new HttpException(
				'User TGID not provided',
				HttpStatus.BAD_REQUEST, // 400
			);
		}

		try {
			// Check if competition is running
			await this.prisma.competition.findFirstOrThrow({
				where: {
					id: voteData.compId,
					isRunning: true,
				},
			});

			// Check if user has already voted
			const vote = await this.prisma.vote.findFirst({
				where: {
					submissionId: submissionId,
					userId: voteData.userTgid,
				},
			});

			if (!vote) {
				// User has not voted
				throw new HttpException(
					'User has not voted for this entry',
					HttpStatus.BAD_REQUEST, // 400
				);
			}

			const voteId = vote.id;

			// Delete vote
			await this.prisma.vote.delete({
				where: {
					id: voteId,
				},
			});

			return 'Vote removed';
		} catch (error) {
			console.log(error);
			// Handle other errors if needed
			throw new HttpException(
				'Error processing vote',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}
}
