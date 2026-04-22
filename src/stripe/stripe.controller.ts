import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StripeService } from './stripe.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Stripe')
@Controller('stripe')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StripeController {
  constructor(private readonly stripeService: StripeService) {}

  @Post('create-subscription')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Create a Stripe PaymentIntent for Premium subscription',
    description:
      'Creates or finds a Stripe customer for the user, then creates a PaymentIntent. ' +
      'Returns the clientSecret for the Flutter PaymentSheet and the publishableKey.',
  })
  @ApiResponse({
    status: 200,
    description: 'PaymentIntent created successfully',
    schema: {
      example: {
        clientSecret: 'pi_xxx_secret_yyy',
        publishableKey: 'pk_test_...',
        paymentIntentId: 'pi_xxx',
      },
    },
  })
  async createSubscription(
    @CurrentUser() user: any,
    @Body() dto: CreateSubscriptionDto,
  ) {
    const customerId = await this.stripeService.createOrFindCustomer(
      dto.email,
      dto.name,
    );
    const { clientSecret, paymentIntentId } =
      await this.stripeService.createSubscriptionPaymentIntent(customerId);

    return {
      clientSecret,
      publishableKey: this.stripeService.publishableKey,
      paymentIntentId,
    };
  }
}
