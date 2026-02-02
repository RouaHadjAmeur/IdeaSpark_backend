import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OAuthCallbackGuard extends AuthGuard(['google-oauth', 'facebook-oauth']) {
    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Try both strategies - whichever one was used for login will succeed
        return (await super.canActivate(context)) as boolean;
    }
}
