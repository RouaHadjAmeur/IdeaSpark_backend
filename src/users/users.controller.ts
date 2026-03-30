import { Controller, Patch, Get, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiParam } from '@nestjs/swagger';
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
  async getProfile(@CurrentUser() user: any) {
    const userId = user._id || user.id;
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
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const userId = user._id || user.id;
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

  @Get('search')
  @ApiOperation({
    summary: 'Search active users',
    description: 'Find users by name, username, email, skills, role, or interests. Useful for inviting collaborators.',
  })
  @ApiResponse({
    status: 200,
    description: 'Found users matching the query',
  })
  async searchUsers(@Query('q') q: string) {
    if (!q) return [];
    return this.usersService.searchUsers(q);
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

  @Get('public-profile/:id')
  @ApiOperation({
    summary: 'Get public user profile',
    description: 'Retrieve sanitized public information of any user by their ID.',
  })
  @ApiResponse({
    status: 200,
    description: 'Public profile retrieved successfully',
  })
  async getPublicProfile(@Param('id') id: string) {
    return this.usersService.findPublicById(id);
  }
}
