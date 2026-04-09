import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateInvitationDto {
  @ApiProperty({ 
    example: 'ACCEPTED', 
    enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
    description: 'Statut de l’invitation' 
  })
  @IsEnum(['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'])
  @IsOptional()
  status?: string;
}
