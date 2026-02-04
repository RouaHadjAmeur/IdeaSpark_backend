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
     * Verify Google ID token from mobile app and return user + JWT.
     * Requires GOOGLE_CLIENT_ID (Android/iOS client ID) in env.
     */
    async loginWithGoogleIdToken(idToken: string): Promise<{ user: Record<string, unknown>; accessToken: string }> {
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
        let user = await this.usersService.findByAuth0Sub(auth0Sub);
        if (!user) {
            const email = payload.email || `${payload.sub.replace(/[^a-zA-Z0-9]/g, '_')}@oauth.local`;
            user = await this.usersService.create({
                email,
                auth0Sub,
                name: payload.name ?? undefined,
                profilePicture: payload.picture ?? undefined,
            });
        }
        const accessToken = this.generateToken(user);
        return { user: toPlainUser(user), accessToken };
    }

    /**
     * Verify Facebook access token from mobile app and return user + JWT.
     * Requires FACEBOOK_APP_ID and FACEBOOK_APP_SECRET in env.
     */
    async loginWithFacebookAccessToken(accessToken: string): Promise<{ user: Record<string, unknown>; accessToken: string }> {
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
        let user = await this.usersService.findByAuth0Sub(auth0Sub);
        if (!user) {
            const email = data.email || `${data.id}@facebook.oauth.local`;
            const profilePicture = data.picture?.data?.url;
            user = await this.usersService.create({
                email,
                auth0Sub,
                name: data.name ?? undefined,
                profilePicture: profilePicture ?? undefined,
            });
        }
        const jwt = this.generateToken(user);
        return { user: toPlainUser(user), accessToken: jwt };
    }
}
