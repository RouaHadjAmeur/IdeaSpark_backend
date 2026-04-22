import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class BrandOwnerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const brandId = request.params.brandId;

    if (!userId || !brandId) {
      throw new ForbiddenException('Missing user or brand ID');
    }

    // TODO: Implement brand ownership check with your database
    return true;
  }
}
