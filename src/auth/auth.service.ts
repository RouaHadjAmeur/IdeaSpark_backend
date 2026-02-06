import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import { User, UserDocument } from '../users/schemas/user.schema';

/** Convert Mongoose document to plain object so ClassSerializerInterceptor doesn't break. */
function toPlainUser(user: User | UserDocument): Record<string, unknown> {
    const plain = typeof (user as any).toJSON === 'function' ? (user as any).toJSON() : { ...user };
    delete plain.password;
    return plain as Record<string, unknown>;
}

const CODE_EXPIRY_MINUTES = 15;
const DELETE_ACCOUNT_CODE_EXPIRY_MINUTES = 15;

function generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly mailService: MailService,
    ) { }

    async register(registerDto: RegisterDto): Promise<{ user: Record<string, unknown>; accessToken: string }> {
        const hashedPassword = await this.hashPassword(registerDto.password);

        const user = await this.usersService.create({
            email: registerDto.email,
            password: hashedPassword,
            name: registerDto.name,
            phone: registerDto.phone,
            status: 'pending',
        });

        const code = generateSixDigitCode();
        const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
        await this.usersService.setVerificationCode(registerDto.email.trim(), code, expiresAt);

        try {
            await this.mailService.sendVerificationCode(registerDto.email.trim(), code);
        } catch (err) {
            console.error('[Auth] Failed to send verification email:', err);
            // In development, log the code so signup still works
            console.log(`[Auth] Verification code for ${registerDto.email}: ${code}`);
        }

        const accessToken = this.generateToken(user);

        return {
            user: toPlainUser(user),
            accessToken,
        };
    }

    async login(loginDto: LoginDto): Promise<{ user: Record<string, unknown>; accessToken: string }> {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const status = (user as any).status;
        if (status === 'pending') {
            throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
        }

        const accessToken = this.generateToken(user);

        return {
            user: toPlainUser(user),
            accessToken,
        };
    }

    async verifyEmail(email: string, code: string): Promise<{ user: Record<string, unknown>; accessToken: string }> {
        const user = await this.usersService.findByEmailWithVerification(email.trim());
        if (!user) {
            throw new BadRequestException('User not found');
        }
        if ((user as any).status === 'active') {
            const accessToken = this.generateToken(user);
            return { user: toPlainUser(user), accessToken };
        }
        const storedCode = (user as any).emailVerificationCode;
        const expiresAt = (user as any).emailVerificationCodeExpiresAt as Date | undefined;
        if (!storedCode || !expiresAt) {
            throw new BadRequestException('No verification code. Please request a new one.');
        }
        if (new Date() > expiresAt) {
            throw new BadRequestException('Verification code expired. Please request a new one.');
        }
        if (storedCode !== code) {
            throw new BadRequestException('Invalid verification code');
        }
        const updated = await this.usersService.activateUserAndClearCode(email.trim());
        if (!updated) {
            throw new BadRequestException('User not found');
        }
        const accessToken = this.generateToken(updated);
        return { user: toPlainUser(updated), accessToken };
    }

    async resendVerificationCode(email: string): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(email.trim());
        if (!user) {
            throw new BadRequestException('User not found');
        }
        if ((user as any).status === 'active') {
            return { message: 'Email already verified' };
        }
        const code = generateSixDigitCode();
        const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
        await this.usersService.setVerificationCode(email.trim(), code, expiresAt);
        await this.mailService.sendVerificationCode(email.trim(), code);
        return { message: 'Verification code sent' };
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.usersService.findByEmail(email);

        if (!user || !user.password) {
            return null;
        }

        const isPasswordValid = await this.comparePasswords(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    private async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    generateToken(user: User | UserDocument): string {
        const userId = typeof (user as any).id === 'string' ? (user as any).id : (user as any)._id?.toString();
        const payload = {
            sub: userId,
            email: user.email,
            name: user.name,
        };

        return this.jwtService.sign(payload);
    }

    async validateUserById(id: string): Promise<User | null> {
        return this.usersService.findById(id);
    }

    /**
     * Verify Google ID token from mobile app.
     * - If user exists and is active: return user + JWT.
     * - If user is new or still pending: send 6-digit code to email and return { requiresVerification: true, email }.
     */
    async loginWithGoogleIdToken(
        idToken: string,
    ): Promise<
        | { user: Record<string, unknown>; accessToken: string }
        | { requiresVerification: true; email: string }
    > {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        if (!clientId) {
            throw new UnauthorizedException('Google login is not configured');
        }
        const client = new OAuth2Client(clientId);
        let payload: { sub: string; email?: string; name?: string; picture?: string };
        try {
            const ticket = await client.verifyIdToken({ idToken, audience: clientId });
            payload = ticket.getPayload() as typeof payload;
            if (!payload?.sub) throw new Error('Invalid token payload');
        } catch {
            throw new UnauthorizedException('Invalid Google ID token');
        }
        const auth0Sub = `google|${payload.sub}`;
        const email = payload.email || `${payload.sub.replace(/[^a-zA-Z0-9]/g, '_')}@oauth.local`;
        let user = await this.usersService.findByAuth0Sub(auth0Sub);
        if (!user) {
            user = await this.usersService.create({
                email,
                auth0Sub,
                name: payload.name ?? undefined,
                profilePicture: payload.picture ?? undefined,
                status: 'pending',
            });
            const code = generateSixDigitCode();
            const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
            await this.usersService.setVerificationCode(email, code, expiresAt);
            try {
                await this.mailService.sendVerificationCode(email, code);
            } catch (err) {
                console.error('[Auth] Failed to send Google sign-up verification email:', err);
                console.log(`[Auth] Google verification code for ${email}: ${code}`);
            }
            return { requiresVerification: true, email };
        }
        const status = (user as any).status;
        if (status === 'pending') {
            const code = generateSixDigitCode();
            const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
            await this.usersService.setVerificationCode(email, code, expiresAt);
            try {
                await this.mailService.sendVerificationCode(email, code);
            } catch (err) {
                console.error('[Auth] Failed to send Google verification email:', err);
                console.log(`[Auth] Google verification code for ${email}: ${code}`);
            }
            return { requiresVerification: true, email };
        }
        const accessToken = this.generateToken(user);
        return { user: toPlainUser(user), accessToken };
    }

    /**
     * Verify the 6-digit code for a Google sign-up and log the user in.
     */
    async verifyGoogleWithCode(
        idToken: string,
        code: string,
    ): Promise<{ user: Record<string, unknown>; accessToken: string }> {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        if (!clientId) {
            throw new UnauthorizedException('Google login is not configured');
        }
        const client = new OAuth2Client(clientId);
        let payload: { sub: string; email?: string };
        try {
            const ticket = await client.verifyIdToken({ idToken, audience: clientId });
            payload = ticket.getPayload() as typeof payload;
            if (!payload?.sub) throw new Error('Invalid token payload');
        } catch {
            throw new UnauthorizedException('Invalid Google ID token');
        }
        const auth0Sub = `google|${payload.sub}`;
        const user = await this.usersService.findByAuth0SubWithVerification(auth0Sub);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        const email = user.email;
        const storedCode = (user as any).emailVerificationCode;
        const expiresAt = (user as any).emailVerificationCodeExpiresAt as Date | undefined;
        if (!storedCode || !expiresAt) {
            throw new BadRequestException('No verification code. Please request a new one.');
        }
        if (new Date() > expiresAt) {
            throw new BadRequestException('Verification code expired. Please request a new one.');
        }
        if (storedCode !== code.trim()) {
            throw new BadRequestException('Invalid verification code');
        }
        const updated = await this.usersService.activateUserAndClearCode(email);
        if (!updated) {
            throw new BadRequestException('User not found');
        }
        const accessToken = this.generateToken(updated);
        return { user: toPlainUser(updated), accessToken };
    }

    /**
     * Resend verification code for pending Google sign-up (by idToken).
     */
    async resendGoogleCode(idToken: string): Promise<{ message: string }> {
        const clientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
        if (!clientId) {
            throw new UnauthorizedException('Google login is not configured');
        }
        const client = new OAuth2Client(clientId);
        let payload: { sub: string; email?: string };
        try {
            const ticket = await client.verifyIdToken({ idToken, audience: clientId });
            payload = ticket.getPayload() as typeof payload;
            if (!payload?.sub) throw new Error('Invalid token payload');
        } catch {
            throw new UnauthorizedException('Invalid Google ID token');
        }
        const auth0Sub = `google|${payload.sub}`;
        const user = await this.usersService.findByAuth0Sub(auth0Sub);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        if ((user as any).status === 'active') {
            return { message: 'Email already verified' };
        }
        const email = user.email;
        const code = generateSixDigitCode();
        const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
        await this.usersService.setVerificationCode(email, code, expiresAt);
        try {
            await this.mailService.sendVerificationCode(email, code);
        } catch (err) {
            console.error('[Auth] Failed to resend Google verification email:', err);
            console.log(`[Auth] Google verification code for ${email}: ${code}`);
        }
        return { message: 'Verification code sent' };
    }

    /**
     * Verify Facebook access token from mobile app.
     * - If user exists and is active: return user + JWT.
     * - If user is new or still pending: send 6-digit code to email and return { requiresVerification: true, email }.
     */
    async loginWithFacebookAccessToken(
        accessToken: string,
    ): Promise<
        | { user: Record<string, unknown>; accessToken: string }
        | { requiresVerification: true; email: string }
    > {
        const appId = this.configService.get<string>('FACEBOOK_APP_ID');
        const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
        if (!appId || !appSecret) {
            throw new UnauthorizedException('Facebook login is not configured');
        }
        const fields = 'id,email,name,picture.type(large)';
        const url = `https://graph.facebook.com/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`;
        let data: { id: string; email?: string; name?: string; picture?: { data?: { url?: string } } };
        try {
            const res = await fetch(url);
            if (!res.ok) {
                const err = await res.text();
                throw new Error(err || res.statusText);
            }
            data = await res.json();
            if (!data?.id) throw new Error('Invalid response');
        } catch (e) {
            throw new UnauthorizedException('Invalid Facebook access token');
        }
        const auth0Sub = `facebook|${data.id}`;
        const email = data.email || `${data.id}@facebook.oauth.local`;
        let user = await this.usersService.findByAuth0Sub(auth0Sub);
        if (!user) {
            const profilePicture = data.picture?.data?.url;
            user = await this.usersService.create({
                email,
                auth0Sub,
                name: data.name ?? undefined,
                profilePicture: profilePicture ?? undefined,
                status: 'pending',
            });
            const code = generateSixDigitCode();
            const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
            await this.usersService.setVerificationCode(email, code, expiresAt);
            try {
                await this.mailService.sendVerificationCode(email, code);
            } catch (err) {
                console.error('[Auth] Failed to send Facebook sign-up verification email:', err);
                console.log(`[Auth] Facebook verification code for ${email}: ${code}`);
            }
            return { requiresVerification: true, email };
        }
        const status = (user as any).status;
        if (status === 'pending') {
            const code = generateSixDigitCode();
            const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
            await this.usersService.setVerificationCode(email, code, expiresAt);
            try {
                await this.mailService.sendVerificationCode(email, code);
            } catch (err) {
                console.error('[Auth] Failed to send Facebook verification email:', err);
                console.log(`[Auth] Facebook verification code for ${email}: ${code}`);
            }
            return { requiresVerification: true, email };
        }
        const jwt = this.generateToken(user);
        return { user: toPlainUser(user), accessToken: jwt };
    }

    /**
     * Verify the 6-digit code for a Facebook sign-up and log the user in.
     */
    async verifyFacebookWithCode(
        accessToken: string,
        code: string,
    ): Promise<{ user: Record<string, unknown>; accessToken: string }> {
        const appId = this.configService.get<string>('FACEBOOK_APP_ID');
        const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
        if (!appId || !appSecret) {
            throw new UnauthorizedException('Facebook login is not configured');
        }
        const fields = 'id,email';
        const url = `https://graph.facebook.com/me?fields=${fields}&access_token=${encodeURIComponent(accessToken)}`;
        let data: { id: string; email?: string };
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(res.statusText);
            data = await res.json();
            if (!data?.id) throw new Error('Invalid response');
        } catch {
            throw new UnauthorizedException('Invalid Facebook access token');
        }
        const auth0Sub = `facebook|${data.id}`;
        const user = await this.usersService.findByAuth0SubWithVerification(auth0Sub);
        if (!user) {
            throw new BadRequestException('User not found');
        }
        const email = user.email;
        const storedCode = (user as any).emailVerificationCode;
        const expiresAt = (user as any).emailVerificationCodeExpiresAt as Date | undefined;
        if (!storedCode || !expiresAt) {
            throw new BadRequestException('No verification code. Please request a new one.');
        }
        if (new Date() > expiresAt) {
            throw new BadRequestException('Verification code expired. Please request a new one.');
        }
        if (storedCode !== code.trim()) {
            throw new BadRequestException('Invalid verification code');
        }
        const updated = await this.usersService.activateUserAndClearCode(email);
        if (!updated) {
            throw new BadRequestException('User not found');
        }
        const accessTokenJwt = this.generateToken(updated);
        return { user: toPlainUser(updated), accessToken: accessTokenJwt };
    }

    /**
     * Resend verification code for pending Facebook sign-up.
     */
    async resendFacebookCode(accessToken: string): Promise<{ message: string }> {
        const appId = this.configService.get<string>('FACEBOOK_APP_ID');
        const appSecret = this.configService.get<string>('FACEBOOK_APP_SECRET');
        if (!appId || !appSecret) {
            throw new UnauthorizedException('Facebook login is not configured');
        }
        const url = `https://graph.facebook.com/me?fields=id&access_token=${encodeURIComponent(accessToken)}`;
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(res.statusText);
            const data = await res.json();
            if (!data?.id) throw new Error('Invalid response');
            const auth0Sub = `facebook|${data.id}`;
            const user = await this.usersService.findByAuth0Sub(auth0Sub);
            if (!user) {
                throw new BadRequestException('User not found');
            }
            if ((user as any).status === 'active') {
                return { message: 'Email already verified' };
            }
            const email = user.email;
            const code = generateSixDigitCode();
            const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
            await this.usersService.setVerificationCode(email, code, expiresAt);
            try {
                await this.mailService.sendVerificationCode(email, code);
            } catch (err) {
                console.error('[Auth] Failed to resend Facebook verification email:', err);
                console.log(`[Auth] Facebook verification code for ${email}: ${code}`);
            }
            return { message: 'Verification code sent' };
        } catch (e) {
            if (e instanceof BadRequestException) throw e;
            throw new UnauthorizedException('Invalid Facebook access token');
        }
    }

    /**
     * Send a 6-digit code to the user's email to confirm account deletion.
     * Requires the user to be authenticated (JWT).
     */
    async requestDeleteAccountCode(user: User | UserDocument): Promise<{ message: string }> {
        const userId = typeof (user as any).id === 'string' ? (user as any).id : (user as any)._id?.toString();
        if (!userId) {
            throw new BadRequestException('User not found');
        }
        const fullUser = await this.usersService.findById(userId);
        if (!fullUser) {
            throw new BadRequestException('User not found');
        }
        const code = generateSixDigitCode();
        const expiresAt = new Date(Date.now() + DELETE_ACCOUNT_CODE_EXPIRY_MINUTES * 60 * 1000);
        await this.usersService.setDeleteAccountCode(userId, code, expiresAt);
        try {
            await this.mailService.sendDeleteAccountCode(fullUser.email, code);
        } catch (err) {
            console.error('[Auth] Failed to send delete-account email:', err);
            console.log(`[Auth] Delete account code for ${fullUser.email}: ${code}`);
        }
        return { message: 'Verification code sent to your email' };
    }

    /**
     * Verify the 6-digit code and permanently delete the user account.
     */
    async confirmDeleteAccount(user: User | UserDocument, code: string): Promise<{ message: string }> {
        const userId = typeof (user as any).id === 'string' ? (user as any).id : (user as any)._id?.toString();
        if (!userId) {
            throw new BadRequestException('User not found');
        }
        const valid = await this.usersService.verifyAndClearDeleteCode(userId, code.trim());
        if (!valid) {
            throw new BadRequestException('Invalid or expired code. Please request a new one.');
        }
        await this.usersService.deleteById(userId);
        return { message: 'Account deleted successfully' };
    }

    /**
     * Send a 6-digit code to the user's email for password reset. Only for email/password accounts.
     */
    async requestPasswordReset(email: string): Promise<{ message: string }> {
        const user = await this.usersService.findByEmail(email.trim());
        if (!user) {
            throw new BadRequestException('No account found with this email.');
        }
        if (!(user as any).password) {
            throw new BadRequestException('This account uses social login. There is no password to reset.');
        }
        const code = generateSixDigitCode();
        const expiresAt = new Date(Date.now() + CODE_EXPIRY_MINUTES * 60 * 1000);
        await this.usersService.setResetPasswordCode(email.trim(), code, expiresAt);
        try {
            await this.mailService.sendPasswordResetCode(email.trim(), code);
        } catch (err) {
            console.error('[Auth] Failed to send password reset email:', err);
            console.log(`[Auth] Password reset code for ${email}: ${code}`);
        }
        return { message: 'If an account exists, a code has been sent to your email.' };
    }

    /**
     * Reset password using the 6-digit code sent by email.
     */
    async resetPasswordWithCode(
        email: string,
        code: string,
        newPassword: string,
    ): Promise<{ message: string }> {
        const hashedPassword = await this.hashPassword(newPassword);
        const ok = await this.usersService.verifyResetCodeAndSetPassword(
            email.trim(),
            code.trim(),
            hashedPassword,
        );
        if (!ok) {
            throw new BadRequestException('Invalid or expired code. Please request a new one.');
        }
        return { message: 'Password updated. You can now sign in with your new password.' };
    }

    /**
     * Change password for the authenticated user (current password required).
     */
    async changePassword(
        user: User | UserDocument,
        currentPassword: string,
        newPassword: string,
    ): Promise<{ message: string }> {
        const userId = typeof (user as any).id === 'string' ? (user as any).id : (user as any)._id?.toString();
        if (!userId) {
            throw new BadRequestException('User not found');
        }
        const fullUser = await this.usersService.findByEmail((user as any).email);
        if (!fullUser || !(fullUser as any).password) {
            throw new BadRequestException('This account has no password (e.g. social login).');
        }
        const valid = await this.comparePasswords(currentPassword, (fullUser as any).password);
        if (!valid) {
            throw new UnauthorizedException('Current password is incorrect.');
        }
        const hashedPassword = await this.hashPassword(newPassword);
        await this.usersService.updatePassword(userId, hashedPassword);
        return { message: 'Password updated successfully.' };
    }
}
