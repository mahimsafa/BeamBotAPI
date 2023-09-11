import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as cryptoJs from 'crypto-js';

@Injectable()
export class VerificationService {
	constructor(private prisma: PrismaService) {}

	// Verify user
	async verifyUser(authData: any) {
		try {
			const checkHash = authData.hash;
			delete authData.hash;

			const dataCheckArr = [];
			for (const key in authData) {
				if (Object.prototype.hasOwnProperty.call(authData, key)) {
					dataCheckArr.push(`${key}=${authData[key]}`);
				}
			}
			dataCheckArr.sort();

			const dataCheckString = dataCheckArr.join('\n');
			console.log(dataCheckString);

			const secretKey = cryptoJs.SHA256(process.env.TG_BOT_TOKEN); // Replace with your bot token
			const hmac = cryptoJs.HmacSHA256(dataCheckString, secretKey);
			const calculatedHash = hmac.toString(cryptoJs.enc.Hex);

			console.log(calculatedHash, checkHash);
			if (calculatedHash !== checkHash) {
				throw new Error('Data is NOT from Telegram');
			}

			const user = await this.prisma.user.findUnique({
				where: {
					userTGID: authData.id,
				},
			});

			if (!user) {
				console.log('Creating user');
				try {
					await this.prisma.user.create({
						data: {
							userTGID: authData.id,
							username: authData.username,
							firstName: authData.first_name,
							lastName: authData.last_name,
						},
					});
				} catch (error) {
					console.log(error);
					throw new Error('Error creating user');
				}
			}

			return authData;
		} catch (error) {
			console.log(error);
			throw new Error('');
		}
	}
}
