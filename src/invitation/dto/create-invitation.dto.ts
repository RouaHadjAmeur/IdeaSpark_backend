import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateInvitationDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109cb', description: 'Destinataire (User ID)' })
  @IsMongoId()
  @IsNotEmpty()
  receiver: string;
}
