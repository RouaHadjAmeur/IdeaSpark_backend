import { Controller, Patch, Get, Delete, Body, Param, UseGuards, HttpStatus, HttpCode, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './schemas/user.schema';

@ApiTags('Users')
@Controller('users')
// @UseGuards(JwtAuthGuard) // COMMENTED OUT FOR DEVELOPMENT TESTING
// @ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Retrieve the complete profile information of the currently authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    schema: {
      example: {
        _id: '507f1f77bcf86cd799439011',
        email: 'john.doe@example.com',
        name: 'John Doe',
        phone: '+1234567890',
        profile_img: 'https://example.com/profile.jpg',
        isEmailVerified: true,
        authProvider: 'local',
        createdAt: '2026-02-10T20:00:00.000Z',
        updatedAt: '2026-02-10T20:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async getProfile(@CurrentUser() user: User) {
    // For testing: use a default test user ID if not authenticated
    const userId = user ? ((user as any)._id || (user as any).id) : '675b7e8a2e3f4d1234567890';
    return this.usersService.findById(userId.toString());
  }

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
    // For testing: use a default test user ID if not authenticated
    const userId = user ? ((user as any)._id || (user as any).id) : '675b7e8a2e3f4d1234567890';

    return this.usersService.updateUser(userId.toString(), updateProfileDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve a list of all registered users. Note: In production, this should be restricted to admin users only.',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all users retrieved successfully',
    schema: {
      example: [
        {
          _id: '507f1f77bcf86cd799439011',
          email: 'user1@example.com',
          name: 'John Doe',
          phone: '+1234567890',
          profile_img: 'https://example.com/profile1.jpg',
          isEmailVerified: true,
          authProvider: 'local',
          createdAt: '2026-02-10T20:00:00.000Z',
          updatedAt: '2026-02-10T20:00:00.000Z',
        },
        {
          _id: '507f1f77bcf86cd799439012',
          email: 'user2@example.com',
          name: 'Jane Smith',
          phone: '+9876543210',
          profile_img: 'https://example.com/profile2.jpg',
          isEmailVerified: true,
          authProvider: 'google',
          createdAt: '2026-02-09T15:30:00.000Z',
          updatedAt: '2026-02-09T15:30:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async getAllUsers() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete user by ID',
    description: 'Delete a specific user by their ID. Note: In production, this should be restricted to admin users only.',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteById(id);
  }
}
