import { PartialType } from '@nestjs/mapped-types';
import { CreateConnectionWhatsAppDto } from './create-connection-whats-app.dto';

export class UpdateConnectionWhatsAppDto extends PartialType(CreateConnectionWhatsAppDto) {}
