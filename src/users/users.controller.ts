import { Controller, Patch, Body, UseGuards, HttpStatus, HttpCode, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './schemas/user.schema';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update the profile information of the currently logged-in user.',
  })
  @ApiBody({
    type: UpdateProfileDto,
    description: 'Profile update data',
    examples: {
      example1: {
        summary: 'Update profile image and name',
        value: {
          name: 'Jane Doe',
          profile_img: 'https://example.com/new-profile.jpg',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: User,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    // The user object from CurrentUser decorator might have _id or id depending on how it's attached.
    // Based on user.schema.ts, it has _id (Mongoose document) but virtual id.
    // However, when passed through JWT strategy, we need to check what's actually there.
    // Usually strategy attaches the user document or payload.
    // Let's assume it has the id or _id.
    
    // In typical NestJS + Mongoose + Passport JWT setup:
    // The JwtStrategy validate method returns the user object which is attached to request.user
    
    // We can cast user to any if types conflict, but let's try to use the ID.
    const userId = (user as any)._id || (user as any).id;
    
    if (!userId) {
      throw new Error('User ID not found in request');
    }

    return this.usersService.updateUser(userId.toString(), updateProfileDto);
  }
}
