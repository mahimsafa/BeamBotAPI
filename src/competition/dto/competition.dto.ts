export interface CompetitionDto {
	id: string;
	groupId: string;
	isRunning: boolean;
	title: string;
	mode: string;
	startTime: Date;
	durationHrs: number;
	projectChain: string;
	prize1: number;
	prize2: number;
	prize3: number;
}

/*
{
 groupId: -833749374,
	isRunning: true,
	title: 'botgroup',
	mode: 'Admin-Review',
	startTime: 'Wed, 05 Jul 2023 18:39:25 GMT',
	durationHrs: 24,
	projectChain: 'ETH',
	prize1: 2,
	prize2: 0,
	prize3: 0
}
*/
