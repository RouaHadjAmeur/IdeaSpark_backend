import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Persona, PersonaDocument } from './schemas/persona.schema';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonaService {
    constructor(
        @InjectModel(Persona.name) private personaModel: Model<PersonaDocument>,
    ) {}

    /**
     * Create a new persona for a user
     */
    async create(userId: string, createPersonaDto: CreatePersonaDto): Promise<Persona> {
        // Check if user already has a persona
        const existingPersona = await this.personaModel.findOne({ userId: new Types.ObjectId(userId) });
        if (existingPersona) {
            throw new ConflictException('User already has a persona. Use update instead.');
        }

        const persona = new this.personaModel({
            userId: new Types.ObjectId(userId),
            ...createPersonaDto,
        });

        return persona.save();
    }

    /**
     * Get persona by user ID
     */
    async findByUserId(userId: string): Promise<Persona | null> {
        return this.personaModel.findOne({ userId: new Types.ObjectId(userId) }).exec();
    }

    /**
     * Update persona
     */
    async update(userId: string, updatePersonaDto: UpdatePersonaDto): Promise<Persona> {
        const persona = await this.personaModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId) },
            { $set: updatePersonaDto },
            { new: true, runValidators: true },
        ).exec();

        if (!persona) {
            throw new NotFoundException('Persona not found');
        }

        return persona;
    }

    /**
     * Delete persona
     */
    async delete(userId: string): Promise<void> {
        const result = await this.personaModel.deleteOne({ userId: new Types.ObjectId(userId) }).exec();

        if (result.deletedCount === 0) {
            throw new NotFoundException('Persona not found');
        }
    }

    /**
     * Check if user has completed persona onboarding
     */
    async hasPersona(userId: string): Promise<boolean> {
        const count = await this.personaModel.countDocuments({ userId: new Types.ObjectId(userId) }).exec();
        return count > 0;
    }

    /**
     * Get all personas (admin only)
     */
    async findAll(): Promise<Persona[]> {
        return this.personaModel.find().exec();
    }
}
