import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: InstanceType<typeof Stripe>;

  constructor(private readonly configService: ConfigService) {
    const secretKey =
      this.configService.get<string>('STRIPE_SECRET_KEY') ||
      'sk_test_REPLACE_WITH_YOUR_STRIPE_SECRET_KEY';
    this.stripe = new Stripe(secretKey, { apiVersion: '2026-03-25.dahlia' });
  }

  async createOrFindCustomer(email: string, name: string): Promise<string> {
    const existing = await this.stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      return existing.data[0].id;
    }
    const customer = await this.stripe.customers.create({ email, name });
    return customer.id;
  }

  /**
   * Creates a PaymentIntent for a one-time Premium subscription charge.
   * Returns the clientSecret to pass to the Flutter PaymentSheet.
   */
  async createSubscriptionPaymentIntent(
    customerId: string,
  ): Promise<{ clientSecret: string; paymentIntentId: string }> {
    const priceAmount =
      this.configService.get<number>('STRIPE_PREMIUM_PRICE_CENTS') ?? 999; // $9.99

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: priceAmount,
      currency: 'usd',
      customer: customerId,
      automatic_payment_methods: { enabled: true },
      metadata: { plan: 'premium_brand_owner' },
    });

    if (!paymentIntent.client_secret) {
      throw new BadRequestException('Failed to create payment intent');
    }

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  }

  /**
   * Verifies that a PaymentIntent reached 'succeeded' status.
   * Called by confirm-subscription before setting isPremium = true.
   */
  async verifyPaymentSucceeded(paymentIntentId: string): Promise<boolean> {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  }

  get publishableKey(): string {
    return (
      this.configService.get<string>('STRIPE_PUBLISHABLE_KEY') ||
      'pk_test_REPLACE_WITH_YOUR_STRIPE_PUBLISHABLE_KEY'
    );
  }
}
