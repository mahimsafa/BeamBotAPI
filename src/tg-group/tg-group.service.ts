import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpException, HttpStatus } from '@nestjs/common';
import { TgGroupDto } from './dto';

@Injectable()
export class TgGroupService {
	constructor(private prisma: PrismaService) {}

	async registerTgGroup(groupData: TgGroupDto) {
		groupData.groupId = groupData.groupId.toString();
		try {
			await this.prisma.telegramGroup.create({
				data: {
					groupId: groupData.groupId,
					groupName: groupData.groupTitle,
					fsGroupImageURL: groupData.fsGroupPhotoURL,
					tgPortal: groupData.tgPortal,
					projectName: groupData.tokenName,
					projectSymbol: groupData.tokenSymbol,
					projectTokenChain: groupData.selectedChain,
					contractAddress: groupData.tokenAddress,
				},
			});

			return 'Registered Telegram group';
		} catch (error) {
			console.log(error);
			if (error.code === 'P2002') {
				// Unique constraint violation
				throw new HttpException(
					'Group already has a token set',
					HttpStatus.CONFLICT, // 409
				);
			}

			// Handle other errors if needed
			throw new HttpException(
				'Error processing group details',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	async updateTgGroup(groupData: TgGroupDto) {
		groupData.groupId = groupData.groupId.toString();
		try {
			// Update Telegram group
			await this.prisma.telegramGroup.update({
				where: {
					groupId: groupData.groupId,
				},
				data: {
					updatedAt: new Date(),
					groupName: groupData.groupTitle,
					fsGroupImageURL: groupData.fsGroupPhotoURL,
					tgPortal: groupData.tgPortal,
					projectName: groupData.tokenName,
					projectSymbol: groupData.tokenSymbol,
					projectTokenChain: groupData.selectedChain,
					contractAddress: groupData.tokenAddress,
				},
			});

			return 'Updated Telegram group';
		} catch (error) {
			console.log(error);
			if (error.code === 'P2016') {
				// Error if group not found
				throw new HttpException(
					'Group not found',
					HttpStatus.NOT_FOUND, // 404
				);
			}

			// Handle other errors if needed
			throw new HttpException(
				'Error processing group details',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}

	async getTgGroup(groupId: string) {
		try {
			const res = await this.prisma.telegramGroup.findUniqueOrThrow({
				where: {
					groupId: groupId,
				},
			});

			return res;
		} catch (error) {
			if (error.code === 'P2025') {
				// Error if group not found
				throw new HttpException(
					'Group not found',
					HttpStatus.NOT_FOUND, // 404
				);
			}

			// Handle other errors if needed
			throw new HttpException(
				'Error processing group details',
				HttpStatus.INTERNAL_SERVER_ERROR, // 500
			);
		}
	}
}
