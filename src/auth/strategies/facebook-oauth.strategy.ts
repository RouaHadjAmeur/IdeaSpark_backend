import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-oauth2';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class FacebookOAuthStrategy extends PassportStrategy(Strategy, 'facebook-oauth') {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        const domain = configService.get('AUTH0_DOMAIN');
        const clientID = configService.get('AUTH0_CLIENT_ID');
        const clientSecret = configService.get('AUTH0_CLIENT_SECRET');

        super({
            authorizationURL: `https://${domain}/authorize?connection=facebook`,
            tokenURL: `https://${domain}/oauth/token`,
            clientID: clientID,
            clientSecret: clientSecret,
            callbackURL: 'http://localhost:3000/auth/callback',
            scope: ['openid', 'profile', 'email'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: any,
    ): Promise<any> {
        try {
            // Fetch user info from Auth0
            const response = await fetch(
                `https://${this.configService.get('AUTH0_DOMAIN')}/userinfo`,
                {
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.statusText}`);
            }

            const userInfo = await response.json();

            // Find or create user
            let user = await this.usersService.findByAuth0Sub(userInfo.sub);

            if (!user) {
                // Generate fallback email if not provided by Facebook
                const email = userInfo.email || `${userInfo.sub.replace(/[^a-zA-Z0-9]/g, '_')}@oauth.local`;

                user = await this.usersService.create({
                    email: email,
                    auth0Sub: userInfo.sub,
                    name: userInfo.name || userInfo.nickname,
                    profilePicture: userInfo.picture,
                });
            }

            return done(null, user);
        } catch (error) {
            console.error('Facebook OAuth validation error:', error);
            return done(error, false);
        }
    }
}
