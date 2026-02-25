import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Plan } from './plan.entity';
import { ContentBlock } from './content-block.entity';

export enum CalendarEntryStatus {
    SCHEDULED = 'scheduled',
    PUBLISHED = 'published',
    CANCELLED = 'cancelled',
}

@Entity('calendar_entries')
@Index(['brandId', 'scheduledDate'])
@Index(['planId'])
export class CalendarEntry {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'plan_id' })
    planId: string;

    @ManyToOne(() => Plan, (plan) => plan.calendarEntries, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'plan_id' })
    plan: Plan;

    @Column({ name: 'content_block_id' })
    contentBlockId: string;

    @ManyToOne(() => ContentBlock)
    @JoinColumn({ name: 'content_block_id' })
    contentBlock: ContentBlock;

    /** MongoDB ObjectId — denormalised for fast calendar queries */
    @Column({ name: 'brand_id', length: 24 })
    brandId: string;

    @Column({ name: 'user_id', length: 24 })
    userId: string;

    @Column({ name: 'scheduled_date', type: 'date' })
    scheduledDate: Date;

    @Column({ name: 'scheduled_time', nullable: true, length: 10 })
    scheduledTime: string | null;

    /** One entry per platform (a single block can yield multiple entries) */
    @Column({ length: 50 })
    platform: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: CalendarEntryStatus.SCHEDULED,
    })
    status: CalendarEntryStatus;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
