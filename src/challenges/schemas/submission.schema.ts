import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SubmissionStatus {
  PENDING = 'pending',
  SHORTLISTED = 'shortlisted',
  REVISION_REQUESTED = 'revision_requested',
  WINNER = 'winner',
  RUNNER_UP = 'runner_up',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Submission extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Challenge', required: true })
  challengeId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  creatorId: Types.ObjectId;

  @Prop({ required: true })
  videoUrl: string;

  @Prop()
  thumbnailUrl: string;

  @Prop({ enum: Object.values(SubmissionStatus), default: SubmissionStatus.PENDING })
  status: SubmissionStatus;

  @Prop()
  rating: number; // 1-5

  @Prop({ type: [String], default: [] })
  contentTags: string[];

  @Prop()
  feedback: string;

  @Prop({
    type: [
      {
        videoUrl: String,
        thumbnailUrl: String,
        submittedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  revisionHistory: any[];

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const SubmissionSchema = SchemaFactory.createForClass(Submission);

// Fast submission feed retrieval
SubmissionSchema.index({ challengeId: 1, status: 1, rating: -1 });
SubmissionSchema.index({ creatorId: 1, createdAt: -1 });

// Prevent duplicate submissions
SubmissionSchema.index({ challengeId: 1, creatorId: 1 }, { unique: true });
