import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { Auth0Strategy } from './strategies/auth0.strategy';
import { GoogleOAuthStrategy } from './strategies/google-oauth.strategy';
import { FacebookOAuthStrategy } from './strategies/facebook-oauth.strategy';
import { LogsModule } from '../logs/logs.module';

@Module({
    imports: [
        UsersModule,
        LogsModule,
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET')!,
                signOptions: {
                    expiresIn: configService.get<string>('JWT_EXPIRATION') || '7d',
                },
            } as any),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, LocalStrategy, JwtStrategy, Auth0Strategy, GoogleOAuthStrategy, FacebookOAuthStrategy],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
