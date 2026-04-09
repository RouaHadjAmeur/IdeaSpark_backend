import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateMessageDto {
  @ApiProperty({ example: 'Bonjour, comment allez-vous ?', description: 'Contenu du message', required: false })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({ example: 'text', description: 'Type de message', enum: ['text', 'image', 'file'], required: false })
  @IsOptional()
  messageType?: 'text' | 'image' | 'file';

  @ApiProperty({ example: 'https://example.com/file.pdf', description: 'URL du fichier joint (si applicable)', required: false })
  @IsOptional()
  @IsString()
  attachmentUrl?: string;
}
