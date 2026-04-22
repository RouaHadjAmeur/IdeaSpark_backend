import { Controller, Get, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('friendships')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('friendships')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  @Get()
  @ApiOperation({ summary: 'Liste de mes amis' })
  findAll(@Request() req) {
    return this.friendshipService.getFriends(req.user.id);
  }

  @Delete(':friendId')
  @ApiOperation({ summary: 'Supprimer un ami' })
  remove(@Param('friendId') friendId: string, @Request() req) {
    return this.friendshipService.removeFriend(req.user.id, friendId);
  }
}
