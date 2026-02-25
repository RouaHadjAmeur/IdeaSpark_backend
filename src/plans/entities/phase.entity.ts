import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index,
} from 'typeorm';
import { Plan } from './plan.entity';
import { ContentBlock } from './content-block.entity';

@Entity('phases')
@Index(['planId'])
export class Phase {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'plan_id' })
    planId: string;

    @ManyToOne(() => Plan, (plan) => plan.phases, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'plan_id' })
    plan: Plan;

    /** e.g. "Tease", "Launch", "Nurture", "Retarget" */
    @Column({ length: 100 })
    name: string;

    /** 1-based week within the plan */
    @Column({ name: 'week_number' })
    weekNumber: number;

    @Column({ nullable: true, type: 'text' })
    description: string | null;

    @OneToMany(() => ContentBlock, (block) => block.phase, { cascade: true, eager: false })
    contentBlocks: ContentBlock[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
