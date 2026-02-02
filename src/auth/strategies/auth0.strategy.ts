import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class Auth0Strategy extends PassportStrategy(Strategy, 'auth0') {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            secretOrKeyProvider: passportJwtSecret({
                cache: true,
                rateLimit: true,
                jwksRequestsPerMinute: 5,
                jwksUri: `https://${configService.get('AUTH0_DOMAIN')}/.well-known/jwks.json`,
            }),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            audience: configService.get('AUTH0_AUDIENCE'),
            issuer: `https://${configService.get('AUTH0_DOMAIN')}/`,
            algorithms: ['RS256'],
        });
    }

    async validate(payload: any) {
        // Find or create user based on Auth0 sub
        let user = await this.usersService.findByAuth0Sub(payload.sub);

        if (!user) {
            // Create a new user if they don't exist
            user = await this.usersService.create({
                email: payload.email,
                auth0Sub: payload.sub,
                name: payload.name,
                profilePicture: payload.picture,
            });
        }

        if (!user) {
            throw new UnauthorizedException();
        }

        return user;
    }
}
