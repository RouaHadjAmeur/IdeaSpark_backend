import { Controller, Post, Delete, Get, Param, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { SocialService } from './social.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Social')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('social')
export class SocialController {
    constructor(private readonly socialService: SocialService) { }

    @Post('follow/:id')
    @ApiOperation({ summary: 'Follow a user' })
    async followUser(@CurrentUser() user: any, @Param('id') followingId: string) {
        const followerId = user.id || user._id?.toString();
        return this.socialService.followUser(followerId, followingId);
    }

    @Delete('unfollow/:id')
    @ApiOperation({ summary: 'Unfollow a user' })
    async unfollowUser(@CurrentUser() user: any, @Param('id') followingId: string) {
        const followerId = user.id || user._id?.toString();
        return this.socialService.unfollowUser(followerId, followingId);
    }

    @Get('following')
    @ApiOperation({ summary: 'Get list of users you are following' })
    async getFollowing(@CurrentUser() user: any) {
        const userId = user.id || user._id?.toString();
        return this.socialService.getFollowing(userId);
    }

    @Get('followers')
    @ApiOperation({ summary: 'Get list of users following you' })
    async getFollowers(@CurrentUser() user: any) {
        const userId = user.id || user._id?.toString();
        return this.socialService.getFollowers(userId);
    }

    @Get('feed')
    @ApiOperation({ summary: 'Get community feed (published posts from people you follow)' })
    async getFeed(@CurrentUser() user: any) {
        const userId = user.id || user._id?.toString();
        return this.socialService.getCommunityFeed(userId);
    }

    @Get('suggestions')
    @ApiOperation({ summary: 'Get follow suggestions based on profile similarity' })
    async getSuggestions(@CurrentUser() user: any) {
        const userId = user.id || user._id?.toString();
        return this.socialService.getSuggestions(userId);
    }

    @Post('accept/:followerId')
    @ApiOperation({ summary: 'Accept a follow request' })
    async acceptFollow(@CurrentUser() user: any, @Param('followerId') followerId: string) {
        const followingId = user.id || user._id?.toString();
        return this.socialService.acceptFollowRequest(followingId, followerId);
    }

    @Get('pending-requests')
    @ApiOperation({ summary: 'Get pending follow requests' })
    async getPendingRequests(@CurrentUser() user: any) {
        const userId = user.id || user._id?.toString();
        return this.socialService.getPendingFollowRequests(userId);
    }

    @Get('followers/:userId')
    @ApiOperation({ summary: 'Get followers of any user by ID' })
    async getFollowersById(@Param('userId') userId: string) {
        return this.socialService.getFollowersById(userId);
    }

    @Get('following/:userId')
    @ApiOperation({ summary: 'Get following list of any user by ID' })
    async getFollowingById(@Param('userId') userId: string) {
        return this.socialService.getFollowingById(userId);
    }

    @Get('friends')
    @ApiOperation({ summary: 'Get mutual follows (friends) of the current user with shared collaborations' })
    async getFriends(@CurrentUser() user: any) {
        const userId = user.id || user._id?.toString();
        return this.socialService.getFriendsWithSharedPlans(userId);
    }

    @Get('friends/:userId')
    @ApiOperation({ summary: 'Get mutual follows (friends) of any user by ID' })
    async getFriendsById(@Param('userId') userId: string) {
        return this.socialService.getFriends(userId);
    }
}
