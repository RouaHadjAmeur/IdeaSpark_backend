import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class Auth0OAuthGuard extends AuthGuard('auth0-oauth') { }
