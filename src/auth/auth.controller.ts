import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, ClassSerializerInterceptor, UseInterceptors, Res, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendCodeDto } from './dto/resend-code.dto';
import { GoogleTokenDto } from './dto/google-token.dto';
import { FacebookTokenDto } from './dto/facebook-token.dto';
import { ConfirmDeleteAccountDto } from './dto/confirm-delete-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { GoogleVerifyDto } from './dto/google-verify.dto';
import { FacebookVerifyDto } from './dto/facebook-verify.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleOAuthGuard } from './guards/google-oauth.guard';
import { FacebookOAuthGuard } from './guards/facebook-oauth.guard';
import { OAuthCallbackGuard } from './guards/oauth-callback.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';

@ApiTags('Authentication')
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('register')
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Register a new user',
        description: 'Creates a new user account with email and password. The password is hashed using bcrypt before being stored in the database.',
    })
    @ApiBody({
        type: RegisterDto,
        description: 'User registration data',
        examples: {
            example1: {
                summary: 'Basic registration',
                value: {
                    email: 'john.doe@example.com',
                    password: 'SecurePassword123',
                    name: 'John Doe',
                    phone: '+1234567890',
                },
            },
            example2: {
                summary: 'Minimal registration',
                value: {
                    email: 'jane@example.com',
                    password: 'MyPass123',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'User registered successfully. Returns user data and JWT access token.',
        schema: {
            example: {
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'john.doe@example.com',
                    name: 'John Doe',
                    phone: '+1234567890',
                    createdAt: '2026-02-01T20:19:52.000Z',
                    updatedAt: '2026-02-01T20:19:52.000Z',
                },
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Validation failed',
        schema: {
            example: {
                statusCode: 400,
                message: [
                    'Please provide a valid email address',
                    'Password must be at least 6 characters long',
                ],
                error: 'Bad Request',
            },
        },
    })
    @ApiResponse({
        status: 409,
        description: 'Conflict - Email already exists',
        schema: {
            example: {
                statusCode: 409,
                message: 'Email already exists',
                error: 'Conflict',
            },
        },
    })
    async register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Login with email and password',
        description: 'Authenticates a user with email and password, returning a JWT access token for subsequent API calls.',
    })
    @ApiBody({
        type: LoginDto,
        description: 'User login credentials',
        examples: {
            example1: {
                summary: 'Login example',
                value: {
                    email: 'john.doe@example.com',
                    password: 'SecurePassword123',
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: 'Login successful. Returns user data and JWT access token.',
        schema: {
            example: {
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'john.doe@example.com',
                    name: 'John Doe',
                    phone: '+1234567890',
                    createdAt: '2026-02-01T20:19:52.000Z',
                    updatedAt: '2026-02-01T20:19:52.000Z',
                },
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
        },
    })
    @ApiResponse({
        status: 400,
        description: 'Bad Request - Validation failed',
        schema: {
            example: {
                statusCode: 400,
                message: ['Please provide a valid email address'],
                error: 'Bad Request',
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid credentials',
        schema: {
            example: {
                statusCode: 401,
                message: 'Invalid email or password',
                error: 'Unauthorized',
            },
        },
    })
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Request password reset code',
        description: 'Sends a 6-digit code to the user\'s email. Only works for email/password accounts. Use reset-password with the code to set a new password.',
    })
    @ApiBody({ type: ForgotPasswordDto })
    @ApiResponse({ status: 200, description: 'If an account exists with a password, a code has been sent.' })
    @ApiResponse({ status: 400, description: 'No account or social-only account.' })
    async forgotPassword(@Body() dto: ForgotPasswordDto) {
        return this.authService.requestPasswordReset(dto.email);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Reset password with code',
        description: 'Submit the 6-digit code received by email and your new password.',
    })
    @ApiBody({ type: ResetPasswordDto })
    @ApiResponse({ status: 200, description: 'Password updated. Sign in with the new password.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired code.' })
    async resetPassword(@Body() dto: ResetPasswordDto) {
        return this.authService.resetPasswordWithCode(dto.email, dto.code, dto.newPassword);
    }

    @Post('verify-email')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verify email with code',
        description: 'Submit the 6-digit code received by email to activate the account. Returns user and JWT.',
    })
    @ApiBody({ type: VerifyEmailDto })
    @ApiResponse({ status: 200, description: 'Email verified. Returns user and accessToken.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired code.' })
    async verifyEmail(@Body() dto: VerifyEmailDto) {
        return this.authService.verifyEmail(dto.email, dto.code);
    }

    @Post('resend-code')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Resend verification code',
        description: 'Send a new 6-digit code to the user email.',
    })
    @ApiBody({ type: ResendCodeDto })
    @ApiResponse({ status: 200, description: 'Code sent.' })
    @ApiResponse({ status: 400, description: 'User not found or already verified.' })
    async resendCode(@Body() dto: ResendCodeDto) {
        return this.authService.resendVerificationCode(dto.email);
    }

    @Post('google')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Login / Sign up with Google (mobile)',
        description: 'Exchange Google ID token for a JWT. If the user is new or not yet verified, returns requiresVerification + email and sends a 6-digit code to their email. Use google/verify with that code to complete sign-in.',
    })
    @ApiBody({ type: GoogleTokenDto })
    @ApiResponse({
        status: 200,
        description: 'Either { user, accessToken } or { requiresVerification: true, email }.',
    })
    @ApiResponse({ status: 401, description: 'Invalid Google ID token.' })
    async loginGoogle(@Body() body: GoogleTokenDto) {
        return this.authService.loginWithGoogleIdToken(body.idToken);
    }

    @Post('google/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verify Google sign-up with code',
        description: 'Submit the 6-digit code sent by email to complete Google sign-up. Returns user and JWT.',
    })
    @ApiBody({ type: GoogleVerifyDto })
    @ApiResponse({ status: 200, description: 'Returns user and accessToken.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired code.' })
    @ApiResponse({ status: 401, description: 'Invalid Google ID token.' })
    async verifyGoogle(@Body() body: GoogleVerifyDto) {
        return this.authService.verifyGoogleWithCode(body.idToken, body.code);
    }

    @Post('google/resend-code')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Resend Google verification code',
        description: 'Send a new 6-digit code to the user email for pending Google sign-up.',
    })
    @ApiBody({ type: GoogleTokenDto })
    @ApiResponse({ status: 200, description: 'Code sent.' })
    @ApiResponse({ status: 400, description: 'User not found or already verified.' })
    @ApiResponse({ status: 401, description: 'Invalid Google ID token.' })
    async resendGoogleCode(@Body() body: GoogleTokenDto) {
        return this.authService.resendGoogleCode(body.idToken);
    }

    @Post('facebook')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Login / Sign up with Facebook (mobile)',
        description: 'Exchange Facebook access token for a JWT. If the user is new or not yet verified, returns requiresVerification + email and sends a 6-digit code. Use facebook/verify with that code to complete sign-in.',
    })
    @ApiBody({ type: FacebookTokenDto })
    @ApiResponse({
        status: 200,
        description: 'Either { user, accessToken } or { requiresVerification: true, email }.',
    })
    @ApiResponse({ status: 401, description: 'Invalid Facebook access token.' })
    async loginFacebook(@Body() body: FacebookTokenDto) {
        return this.authService.loginWithFacebookAccessToken(body.accessToken);
    }

    @Post('facebook/verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Verify Facebook sign-up with code',
        description: 'Submit the 6-digit code sent by email to complete Facebook sign-up. Returns user and JWT.',
    })
    @ApiBody({ type: FacebookVerifyDto })
    @ApiResponse({ status: 200, description: 'Returns user and accessToken.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired code.' })
    @ApiResponse({ status: 401, description: 'Invalid Facebook access token.' })
    async verifyFacebook(@Body() body: FacebookVerifyDto) {
        return this.authService.verifyFacebookWithCode(body.accessToken, body.code);
    }

    @Post('facebook/resend-code')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: 'Resend Facebook verification code',
        description: 'Send a new 6-digit code to the user email for pending Facebook sign-up.',
    })
    @ApiBody({ type: FacebookTokenDto })
    @ApiResponse({ status: 200, description: 'Code sent.' })
    @ApiResponse({ status: 400, description: 'User not found or already verified.' })
    @ApiResponse({ status: 401, description: 'Invalid Facebook access token.' })
    async resendFacebookCode(@Body() body: FacebookTokenDto) {
        return this.authService.resendFacebookCode(body.accessToken);
    }

    @Get('profile')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Get current user profile',
        description: 'Returns the profile information of the currently authenticated user. Requires a valid JWT token in the Authorization header.',
    })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
        type: User,
        schema: {
            example: {
                id: '123e4567-e89b-12d3-a456-426614174000',
                email: 'john.doe@example.com',
                name: 'John Doe',
                phone: '+1234567890',
                profilePicture: 'https://example.com/profile.jpg',
                createdAt: '2026-02-01T20:19:52.000Z',
                updatedAt: '2026-02-01T20:19:52.000Z',
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - Invalid or missing token',
        schema: {
            example: {
                statusCode: 401,
                message: 'Unauthorized',
            },
        },
    })
    getProfile(@CurrentUser() user: User) {
        return user;
    }

    @Post('change-password')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Change password',
        description: 'Updates the authenticated user\'s password. Requires current password. Only for email/password accounts.',
    })
    @ApiBody({ type: ChangePasswordDto })
    @ApiResponse({ status: 200, description: 'Password updated successfully.' })
    @ApiResponse({ status: 400, description: 'Account has no password (social login).' })
    @ApiResponse({ status: 401, description: 'Current password incorrect or unauthorized.' })
    async changePassword(
        @CurrentUser() user: User,
        @Body() dto: ChangePasswordDto,
    ) {
        return this.authService.changePassword(user, dto.currentPassword, dto.newPassword);
    }

    @Post('delete-account/send-code')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Request delete account verification code',
        description: 'Sends a 6-digit code to the authenticated user\'s email. Use this code in delete-account/confirm to permanently delete the account.',
    })
    @ApiResponse({ status: 200, description: 'Code sent to your email.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async sendDeleteAccountCode(@CurrentUser() user: User) {
        return this.authService.requestDeleteAccountCode(user);
    }

    @Post('delete-account/confirm')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({
        summary: 'Confirm account deletion with code',
        description: 'Verifies the 6-digit code and permanently deletes the account. The client should clear the session and redirect to login.',
    })
    @ApiBody({ type: ConfirmDeleteAccountDto })
    @ApiResponse({ status: 200, description: 'Account deleted successfully.' })
    @ApiResponse({ status: 400, description: 'Invalid or expired code.' })
    @ApiResponse({ status: 401, description: 'Unauthorized.' })
    async confirmDeleteAccount(
        @CurrentUser() user: User,
        @Body() dto: ConfirmDeleteAccountDto,
    ) {
        return this.authService.confirmDeleteAccount(user, dto.code);
    }

    @Get('login-google')
    @UseGuards(GoogleOAuthGuard)
    @ApiOperation({
        summary: 'Login with Google',
        description: 'Redirects to Google login via Auth0. After successful authentication, you will be redirected to the callback URL with user data and JWT token.',
    })
    @ApiQuery({
        name: 'connection',
        required: false,
        description: 'Auth0 connection name (defaults to google-oauth2)',
    })
    @ApiResponse({
        status: 302,
        description: 'Redirects to Google OAuth consent screen',
    })
    loginGoogleRedirect(@Query('connection') connection: string, @Res() res: Response) {
        // Guard handles the redirect automatically
    }

    @Get('login-facebook')
    @UseGuards(FacebookOAuthGuard)
    @ApiOperation({
        summary: 'Login with Facebook',
        description: 'Redirects to Facebook login via Auth0. After successful authentication, you will be redirected to the callback URL with user data and JWT token.',
    })
    @ApiQuery({
        name: 'connection',
        required: false,
        description: 'Auth0 connection name (defaults to facebook)',
    })
    @ApiResponse({
        status: 302,
        description: 'Redirects to Facebook OAuth consent screen',
    })
    loginFacebookRedirect(@Query('connection') connection: string, @Res() res: Response) {
        // Guard handles the redirect automatically
    }

    @Get('callback')
    @UseGuards(OAuthCallbackGuard)
    @ApiOperation({
        summary: 'OAuth callback endpoint',
        description: 'Handles OAuth callbacks from Auth0 after successful Google/Facebook login. Returns user data and JWT token.',
    })
    @ApiResponse({
        status: 200,
        description: 'OAuth authentication successful. Returns user data and JWT access token.',
        schema: {
            example: {
                user: {
                    id: '123e4567-e89b-12d3-a456-426614174000',
                    email: 'john.doe@gmail.com',
                    name: 'John Doe',
                    profilePicture: 'https://lh3.googleusercontent.com/...',
                    auth0Sub: 'google-oauth2|123456789',
                    createdAt: '2026-02-02T02:00:00.000Z',
                    updatedAt: '2026-02-02T02:00:00.000Z',
                },
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'OAuth authentication failed',
    })
    async oauthCallback(@Req() req: Request) {
        // User is attached to request by Auth0OAuthGuard
        const user = req.user as User;

        // Generate our own JWT token for the user
        const accessToken = this.authService.generateToken(user);

        return {
            user,
            accessToken,
        };
    }
}
