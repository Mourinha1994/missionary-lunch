import { PartialType } from '@nestjs/swagger';
import { CreateLunchDto } from './create-lunch.dto';

export class UpdateLunchDto extends PartialType(CreateLunchDto) {}
