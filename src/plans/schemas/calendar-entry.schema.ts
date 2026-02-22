import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum CalendarEntryStatus {
    SCHEDULED = 'scheduled',
    PUBLISHED = 'published',
    CANCELLED = 'cancelled',
}

export type CalendarEntryDocument = CalendarEntry & Document;

@Schema({ timestamps: true })
export class CalendarEntry {
    @Prop({ required: true })
    planId: string;

    /** _id.toString() of the embedded ContentBlock inside the Plan */
    @Prop({ required: true })
    contentBlockId: string;

    @Prop({ required: true })
    brandId: string;

    @Prop({ required: true })
    userId: string;

    @Prop({ required: true })
    scheduledDate: Date;

    @Prop({ default: '12:00' })
    scheduledTime: string;

    /** e.g. 'instagram', 'tiktok' */
    @Prop({ required: true })
    platform: string;

    @Prop({ enum: Object.values(CalendarEntryStatus), default: CalendarEntryStatus.SCHEDULED })
    status: CalendarEntryStatus;

    createdAt: Date;
    updatedAt: Date;
}

export const CalendarEntrySchema = SchemaFactory.createForClass(CalendarEntry);

CalendarEntrySchema.index({ planId: 1 });
CalendarEntrySchema.index({ brandId: 1, scheduledDate: 1 });
CalendarEntrySchema.index({ userId: 1 });

CalendarEntrySchema.set('toJSON', {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
