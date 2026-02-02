import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ) { }

    async create(userData: Partial<User>): Promise<User> {
        try {
            const user = this.usersRepository.create(userData);
            return await this.usersRepository.save(user);
        } catch (error) {
            if (error.code === '23505') {
                // PostgreSQL unique violation error code
                throw new ConflictException('Email already exists');
            }
            throw error;
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { email },
            select: ['id', 'email', 'password', 'name', 'phone', 'profilePicture', 'auth0Sub', 'createdAt', 'updatedAt'],
        });
    }

    async findById(id: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { id },
        });
    }

    async findByAuth0Sub(auth0Sub: string): Promise<User | null> {
        return this.usersRepository.findOne({
            where: { auth0Sub },
        });
    }

    async updateUser(id: string, updateData: Partial<User>): Promise<User> {
        const user = await this.findById(id);
        if (!user) {
            throw new NotFoundException('User not found');
        }

        Object.assign(user, updateData);
        return this.usersRepository.save(user);
    }
}
