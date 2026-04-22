import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class CreateFriendshipDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'ID de l\'utilisateur 1' })
  @IsMongoId()
  @IsNotEmpty()
  user1: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109cb', description: 'ID de l\'utilisateur 2' })
  @IsMongoId()
  @IsNotEmpty()
  user2: string;
}
