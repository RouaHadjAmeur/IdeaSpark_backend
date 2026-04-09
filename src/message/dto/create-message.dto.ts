import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsMongoId, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Bonjour, comment allez-vous ?', description: 'Contenu du message' })
  @IsString()
  content: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109cb', description: 'ID du destinataire' })
  @IsMongoId()
  receiver: string;

  @ApiProperty({ example: 'text', description: 'Type de message', enum: ['text', 'image', 'file'], required: false })
  @IsOptional()
  messageType?: 'text' | 'image' | 'file';

  @ApiProperty({ example: 'https://example.com/file.pdf', description: 'URL du fichier joint (si applicable)', required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
