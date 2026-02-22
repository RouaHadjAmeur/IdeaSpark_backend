import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    Index,
} from 'typeorm';
import { Phase } from './phase.entity';
import { CalendarEntry } from './calendar-entry.entity';

// ─── Enums ───────────────────────────────────────────────────

export enum PlanObjective {
    BRAND_AWARENESS   = 'brand_awareness',
    LEAD_GENERATION   = 'lead_generation',
    SALES_CONVERSION  = 'sales_conversion',
    AUDIENCE_GROWTH   = 'audience_growth',
    PRODUCT_LAUNCH    = 'product_launch',
    SEASONAL_CAMPAIGN = 'seasonal_campaign',
}

export enum PlanStatus {
    DRAFT     = 'draft',
    ACTIVE    = 'active',
    COMPLETED = 'completed',
}

export enum PlanPromotionIntensity {
    LOW        = 'low',
    BALANCED   = 'balanced',
    AGGRESSIVE = 'aggressive',
}

// ─── Interfaces ──────────────────────────────────────────────

export interface ContentMixPreference {
    educational:  number;
    promotional:  number;
    storytelling: number;
    authority:    number;
}

// ─── Entity ──────────────────────────────────────────────────

@Entity('plans')
@Index(['brandId'])
@Index(['userId'])
export class Plan {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /** MongoDB ObjectId of the owning brand */
    @Column({ name: 'brand_id', length: 24 })
    brandId: string;

    /** MongoDB ObjectId of the owning user */
    @Column({ name: 'user_id', length: 24 })
    userId: string;

    @Column({ length: 200 })
    name: string;

    @Column({ type: 'enum', enum: PlanObjective })
    objective: PlanObjective;

    @Column({ name: 'start_date', type: 'date' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'date' })
    endDate: Date;

    @Column({ name: 'duration_weeks' })
    durationWeeks: number;

    @Column({
        name: 'promotion_intensity',
        type: 'varchar',
        length: 20,
        default: PlanPromotionIntensity.BALANCED,
    })
    promotionIntensity: PlanPromotionIntensity;

    /** Number of posts per week */
    @Column({ name: 'posting_frequency', default: 3 })
    postingFrequency: number;

    @Column({ type: 'text', array: true, default: [] })
    platforms: string[];

    @Column({ name: 'product_ids', type: 'text', array: true, default: [] })
    productIds: string[];

    @Column({
        name: 'content_mix_preference',
        type: 'jsonb',
        default: { educational: 25, promotional: 25, storytelling: 25, authority: 25 },
    })
    contentMixPreference: ContentMixPreference;

    @Column({ type: 'enum', enum: PlanStatus, default: PlanStatus.DRAFT })
    status: PlanStatus;

    @OneToMany(() => Phase, (phase) => phase.plan, { cascade: true, eager: false })
    phases: Phase[];

    @OneToMany(() => CalendarEntry, (entry) => entry.plan, { cascade: false })
    calendarEntries: CalendarEntry[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
