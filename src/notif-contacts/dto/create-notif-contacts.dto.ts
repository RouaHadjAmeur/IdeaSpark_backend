import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsBoolean, IsOptional } from 'class-validator';

export class CreateNotifContactsDto {
  @ApiProperty({ example: 'Nouvelle invitation', description: 'Titre' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Vous avez reçu une nouvelle invitation.', description: 'Message' })
  @IsString()
  body: string;

  @ApiProperty({ example: 'INVITATION', description: 'Type de notification' })
  @IsString()
  type: string;

  @ApiProperty({ example: false, description: 'Lu ou non' })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Destinataire (User ID)' })
  @IsMongoId()
  user: string;
}
