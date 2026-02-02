import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Entity()
export class User {
    @ApiProperty({
        description: 'Unique identifier for the user',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ApiProperty({
        description: 'User email address (must be unique)',
        example: 'user@example.com',
    })
    @Column({ unique: true })
    email: string;

    @Exclude()
    @Column({ select: false, nullable: true })
    password?: string;

    @ApiProperty({
        description: 'User full name',
        example: 'John Doe',
        required: false,
    })
    @Column({ nullable: true })
    name?: string;

    @ApiProperty({
        description: 'User phone number',
        example: '+1234567890',
        required: false,
    })
    @Column({ nullable: true })
    phone?: string;

    @ApiProperty({
        description: 'Profile picture URL',
        example: 'https://example.com/profile.jpg',
        required: false,
    })
    @Column({ nullable: true })
    profilePicture?: string;

    @ApiProperty({
        description: 'Auth0 subject identifier',
        example: 'auth0|123456789',
        required: false,
    })
    @Column({ nullable: true })
    auth0Sub?: string;

    @ApiProperty({
        description: 'Account creation timestamp',
        example: '2026-02-01T20:19:52.000Z',
    })
    @CreateDateColumn()
    createdAt: Date;

    @ApiProperty({
        description: 'Last update timestamp',
        example: '2026-02-01T20:19:52.000Z',
    })
    @UpdateDateColumn()
    updatedAt: Date;
}
