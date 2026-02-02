import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto): Promise<{ user: User; accessToken: string }> {
        const hashedPassword = await this.hashPassword(registerDto.password);

        const user = await this.usersService.create({
            email: registerDto.email,
            password: hashedPassword,
            name: registerDto.name,
            phone: registerDto.phone,
        });

        const accessToken = this.generateToken(user);

        // Remove password from response
        delete user.password;

        return {
            user,
            accessToken,
        };
    }

    async login(loginDto: LoginDto): Promise<{ user: User; accessToken: string }> {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid email or password');
        }

        const accessToken = this.generateToken(user);

        // Remove password from response
        delete user.password;

        return {
            user,
            accessToken,
        };
    }

    async validateUser(email: string, password: string): Promise<User | null> {
        const user = await this.usersService.findByEmail(email);

        if (!user || !user.password) {
            return null;
        }

        const isPasswordValid = await this.comparePasswords(password, user.password);

        if (!isPasswordValid) {
            return null;
        }

        return user;
    }

    private async hashPassword(password: string): Promise<string> {
        const saltRounds = 10;
        return bcrypt.hash(password, saltRounds);
    }

    private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return bcrypt.compare(plainPassword, hashedPassword);
    }

    generateToken(user: User): string {
        const payload = {
            sub: user.id,
            email: user.email,
            name: user.name,
        };

        return this.jwtService.sign(payload);
    }

    async validateUserById(id: string): Promise<User | null> {
        return this.usersService.findById(id);
    }
}
