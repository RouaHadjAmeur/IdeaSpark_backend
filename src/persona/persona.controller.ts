import { Controller, Get, Post, Put, Delete, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PersonaService } from './persona.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Persona')
@Controller('persona')
// @UseGuards(JwtAuthGuard) // COMMENTED OUT FOR DEVELOPMENT TESTING
// @ApiBearerAuth()
export class PersonaController {
    constructor(private readonly personaService: PersonaService) {}

    /**
     * Create or update persona for authenticated user
     * POST /persona
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({
        summary: 'Create or update user persona',
        description: 'Complete the onboarding by creating a persona or update existing persona. This persona will be used to personalize AI-generated video content.',
    })
    @ApiBody({
        type: CreatePersonaDto,
        description: 'Persona onboarding data (10 questions)',
        examples: {
            example1: {
                summary: 'E-commerce influencer',
                value: {
                    userType: 'Influenceur',
                    mainGoal: 'Vendre',
                    niche: 'E-commerce',
                    mainPlatform: 'TikTok',
                    frequentPlatforms: ['TikTok', 'Instagram'],
                    contentStyle: 'Facecam',
                    preferredTone: 'Fun',
                    mainAudience: 'Jeunes actifs',
                    audienceAge: '18–24',
                    language: 'FR',
                    preferredCTA: 'Lien en bio',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'Persona created or updated successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - JWT token required',
    })
    async createOrUpdate(@Request() req, @Body() createPersonaDto: CreatePersonaDto) {
        // For testing: use a default test user ID if not authenticated
        const userId = req.user ? (req.user.userId || req.user._id) : '675b7e8a2e3f4d1234567890';

        // Check if persona exists
        const existingPersona = await this.personaService.findByUserId(userId);

        if (existingPersona) {
            // Update existing persona
            return this.personaService.update(userId, createPersonaDto);
        } else {
            // Create new persona
            return this.personaService.create(userId, createPersonaDto);
        }
    }

    /**
     * Get current user's persona
     * GET /persona/me
     */
    @Get('me')
    @ApiOperation({
        summary: 'Get current user persona',
        description: 'Retrieve the persona profile of the authenticated user.',
    })
    @ApiResponse({
        status: 200,
        description: 'Persona retrieved successfully',
        schema: {
            example: {
                hasPersona: true,
                persona: {
                    _id: '507f1f77bcf86cd799439011',
                    userId: '507f1f77bcf86cd799439012',
                    userType: 'Influenceur',
                    mainGoal: 'Vendre',
                    niche: 'E-commerce',
                    mainPlatform: 'TikTok',
                    frequentPlatforms: ['TikTok', 'Instagram'],
                    contentStyle: 'Facecam',
                    preferredTone: 'Fun',
                    mainAudience: 'Jeunes actifs',
                    audienceAge: '18–24',
                    language: 'FR',
                    preferredCTA: 'Lien en bio',
                    createdAt: '2026-02-10T20:00:00.000Z',
                    updatedAt: '2026-02-10T20:00:00.000Z',
                },
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - JWT token required',
    })
    async getMyPersona(@Request() req) {
        // For testing: use a default test user ID if not authenticated
        const userId = req.user ? (req.user.userId || req.user._id) : '675b7e8a2e3f4d1234567890';
        const persona = await this.personaService.findByUserId(userId);

        if (!persona) {
            return {
                hasPersona: false,
                message: 'No persona found. Please complete onboarding.',
            };
        }

        return {
            hasPersona: true,
            persona,
        };
    }

    /**
     * Check if user has completed persona onboarding
     * GET /persona/status
     */
    @Get('status')
    @ApiOperation({
        summary: 'Check persona onboarding status',
        description: 'Check if the authenticated user has completed the persona onboarding.',
    })
    @ApiResponse({
        status: 200,
        description: 'Status retrieved successfully',
        schema: {
            example: {
                hasPersona: true,
                message: 'Persona completed',
            },
        },
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - JWT token required',
    })
    async checkStatus(@Request() req) {
        // For testing: use a default test user ID if not authenticated
        const userId = req.user ? (req.user.userId || req.user._id) : '675b7e8a2e3f4d1234567890';
        const hasPersona = await this.personaService.hasPersona(userId);

        return {
            hasPersona,
            message: hasPersona ? 'Persona completed' : 'Persona onboarding required',
        };
    }

    /**
     * Update current user's persona
     * PUT /persona
     */
    @Put()
    @ApiOperation({
        summary: 'Update user persona',
        description: 'Update specific fields of the authenticated user\'s persona.',
    })
    @ApiBody({
        type: UpdatePersonaDto,
        description: 'Persona fields to update (partial update)',
    })
    @ApiResponse({
        status: 200,
        description: 'Persona updated successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - JWT token required',
    })
    @ApiResponse({
        status: 404,
        description: 'Persona not found',
    })
    async update(@Request() req, @Body() updatePersonaDto: UpdatePersonaDto) {
        // For testing: use a default test user ID if not authenticated
        const userId = req.user ? (req.user.userId || req.user._id) : '675b7e8a2e3f4d1234567890';
        return this.personaService.update(userId, updatePersonaDto);
    }

    /**
     * Delete current user's persona
     * DELETE /persona
     */
    @Delete()
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({
        summary: 'Delete user persona',
        description: 'Delete the authenticated user\'s persona. This will reset the onboarding process.',
    })
    @ApiResponse({
        status: 204,
        description: 'Persona deleted successfully',
    })
    @ApiResponse({
        status: 401,
        description: 'Unauthorized - JWT token required',
    })
    @ApiResponse({
        status: 404,
        description: 'Persona not found',
    })
    async delete(@Request() req) {
        // For testing: use a default test user ID if not authenticated
        const userId = req.user ? (req.user.userId || req.user._id) : '675b7e8a2e3f4d1234567890';
        await this.personaService.delete(userId);
    }
}
