import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class GroupIdPipe implements PipeTransform {
	transform(value: any, metadata: ArgumentMetadata) {
		if (metadata.data === 'groupId') {
			return value.toString();
		}
		return value;
	}
}
