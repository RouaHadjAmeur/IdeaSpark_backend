import { Controller, Patch, Get, Delete, Body, Param, Query, UseGuards, HttpStatus, HttpCode, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiConsumes, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUserDto } from './dto/search-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import * as userSchema from './schemas/user.schema';
import { StripeService } from '../stripe/stripe.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly stripeService: StripeService,
    private readonly logsService: LogsService,
  ) {}

  @Get('search')
  @ApiOperation({
    summary: 'Search users',
    description: 'Search for users by name or email.',
  })
  @ApiQuery({ name: 'query', required: false, description: 'Search query' })
  @ApiResponse({
    status: 200,
    description: 'List of users matching the search query',
    type: [userSchema.User],
  })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async search(@Query('query') query: string, @CurrentUser() currentUser: any) {
    const currentUserId = currentUser?._id || currentUser?.id || currentUser?.userId;
    return this.usersService.searchUsers(query, currentUserId?.toString());
  }

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
  async getProfile(@CurrentUser() user: userSchema.User) {
    // For testing: use a default test user ID if not authenticated
    const userId = user ? ((user as any)._id || (user as any).id) : '675b7e8a2e3f4d1234567890';
    return this.usersService.findById(userId.toString());
  }

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, type: [userSchema.User] })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAllUsers() {
    return this.usersService.findAllUsers();
  }

  @Get('admins')
  @ApiOperation({ summary: 'Get all admins' })
  @ApiResponse({ status: 200, type: [userSchema.User] })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getAllAdmins() {
    return this.usersService.findAllAdmins();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ 
    status: 200, 
    schema: {
      example: {
        totalUsers: 3850,
        activeUsers: 3234,
        blockedUsers: 116,
        totalAdmins: 24,
      }
    }
  })
  async getStats() {
    return this.usersService.getStats();
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
    type: userSchema.User,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async updateProfile(
    @CurrentUser() user: userSchema.User,
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

    const updatedUser = await this.usersService.updateUser(userId.toString(), updateProfileDto);
    
    await this.logsService.createLog(userId, 'UPDATE_PROFILE', `User updated their profile: ${updatedUser.email}`);
    
    return updatedUser;
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mock Upgrade Account to Premium',
    description: 'Simulates a successful Stripe Checkout Session by immediately upgrading the user account.',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully upgraded to Premium Brand Owner.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async upgradeToPremium(@CurrentUser() user: any) {
    const userId = user._id || user.id;
    return this.usersService.updateUser(userId.toString(), { isPremium: true });
  }

  @Post('confirm-subscription')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm Stripe payment and activate Premium',
    description:
      'Verifies that the Stripe PaymentIntent succeeded on the server, then sets isPremium = true. ' +
      'This is the secure alternative to the mock /upgrade endpoint.',
  })
  @ApiBody({
    schema: {
      example: { paymentIntentId: 'pi_xxx' },
    },
  })
  @ApiResponse({ status: 200, description: 'Premium activated successfully.' })
  @ApiResponse({ status: 400, description: 'Payment not confirmed by Stripe.' })
  async confirmSubscription(
    @CurrentUser() user: any,
    @Body('paymentIntentId') paymentIntentId: string,
  ) {
    const succeeded = await this.stripeService.verifyPaymentSucceeded(paymentIntentId);
    if (!succeeded) {
      throw new BadRequestException('Payment has not been confirmed by Stripe.');
    }
    const userId = user._id || user.id;
    return this.usersService.updateUser(userId.toString(), { isPremium: true });
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
  async findAll() {
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
  async deleteUser(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminId = currentUser?._id || currentUser?.id || '675b7e8a2e3f4d1234567890';
    const userToDelete = await this.usersService.findById(id);
    await this.usersService.deleteById(id);
    
    await this.logsService.createLog(adminId, 'DELETE_USER', `Admin deleted user: ${userToDelete?.email || id}`, id);
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Block user' })
  @ApiResponse({ status: 200, type: userSchema.User })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async blockUser(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminId = currentUser?._id || currentUser?.id || '675b7e8a2e3f4d1234567890';
    const updatedUser = await this.usersService.updateUserStatus(id, 'blocked');
    
    await this.logsService.createLog(adminId, 'BLOCK_USER', `Admin blocked user: ${updatedUser.email}`, id);
    
    return updatedUser;
  }

  @Patch(':id/unblock')
  @ApiOperation({ summary: 'Unblock user' })
  @ApiResponse({ status: 200, type: userSchema.User })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async unblockUser(@Param('id') id: string, @CurrentUser() currentUser: any) {
    const adminId = currentUser?._id || currentUser?.id || '675b7e8a2e3f4d1234567890';
    const updatedUser = await this.usersService.updateUserStatus(id, 'active');
    
    await this.logsService.createLog(adminId, 'UNBLOCK_USER', `Admin unblocked user: ${updatedUser.email}`, id);
    
    return updatedUser;
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
