import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @ApiProperty({
        description: 'Unique identifier for the user',
        example: '507f1f77bcf86cd799439011',
    })
    id?: string;

    _id?: string;

    @ApiProperty({ description: 'User email address (must be unique)', example: 'user@example.com' })
    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ select: false })
    password?: string;

    @ApiProperty({ description: 'User full name', example: 'John Doe', required: false })
    @Prop()
    name?: string;

    @ApiProperty({ description: 'User phone number', example: '+1234567890', required: false })
    @Prop()
    phone?: string;

    @ApiProperty({ description: 'Profile picture URL', required: false })
    @Prop()
    profilePicture?: string;

    @ApiProperty({ description: 'Profile image URL (specific requested field)', required: false })
    @Prop()
    profile_img?: string;

    @ApiProperty({ description: 'Auth0/OAuth subject identifier', required: false })
    @Prop()
    auth0Sub?: string;

    /** Account status: pending until email is verified, then active. */
    @Prop({ default: 'active' })
    status?: 'pending' | 'active';

    @Prop({ select: false })
    emailVerificationCode?: string;

    @Prop({ select: false })
    emailVerificationCodeExpiresAt?: Date;

    /** 6-digit code sent by email to confirm account deletion. */
    @Prop({ select: false })
    deleteAccountCode?: string;

    @Prop({ select: false })
    deleteAccountCodeExpiresAt?: Date;

    /** 6-digit code for forgot-password flow. */
    @Prop({ select: false })
    resetPasswordCode?: string;

    @Prop({ select: false })
    resetPasswordCodeExpiresAt?: Date;

    @ApiProperty({ description: 'Account creation timestamp' })
    createdAt?: Date;

    @ApiProperty({ description: 'Last update timestamp' })
    updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Expose id as string for API compatibility (JWT sub, Flutter app)
UserSchema.virtual('id').get(function () {
    return this._id?.toString();
});
UserSchema.set('toJSON', {
    virtuals: true,
    transform: (_doc: any, ret: any) => {
        ret.id = ret._id?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
    },
});
UserSchema.set('toObject', { virtuals: true });
