import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    HttpStatus,
    HttpCode,
    UnauthorizedException,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiParam,
} from '@nestjs/swagger';
import { BrandsService } from './brands.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';

@ApiTags('Brands')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('brands')
export class BrandsController {
    constructor(private readonly brandsService: BrandsService) { }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    private resolveUserId(user: User): string {
        const id = (user as any).id ?? (user as any)._id?.toString();
        if (!id) throw new UnauthorizedException('Could not resolve user identity');
        return id;
    }

    // ─── POST /brands ─────────────────────────────────────────────────────────────

    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Create a new brand' })
    @ApiResponse({ status: 201, description: 'Brand created successfully.' })
    @ApiResponse({ status: 400, description: 'Validation error (e.g. >5 pillars).' })
    @ApiResponse({ status: 409, description: 'Brand name already exists for this user.' })
    create(@Body() createBrandDto: CreateBrandDto, @CurrentUser() user: User) {
        return this.brandsService.create(createBrandDto, this.resolveUserId(user));
    }

    // ─── GET /brands ──────────────────────────────────────────────────────────────

    @Get()
    @ApiOperation({ summary: 'List all brands for the authenticated user (paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number, example: 1, description: 'Page number (default: 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, example: 10, description: 'Items per page (default: 10, max: 100)' })
    @ApiResponse({ status: 200, description: 'Paginated list of brands.' })
    findAll(
        @CurrentUser() user: User,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
    ) {
        return this.brandsService.findAll(
            this.resolveUserId(user),
            page ? parseInt(page, 10) : 1,
            limit ? parseInt(limit, 10) : 10,
        );
    }

    // ─── GET /brands/:id ──────────────────────────────────────────────────────────

    @Get(':id')
    @ApiOperation({ summary: 'Get a single brand by ID' })
    @ApiParam({ name: 'id', description: 'Brand MongoDB ObjectId' })
    @ApiResponse({ status: 200, description: 'Brand details.' })
    @ApiResponse({ status: 404, description: 'Brand not found.' })
    findOne(@Param('id') id: string, @CurrentUser() user: User) {
        return this.brandsService.findOne(id, this.resolveUserId(user));
    }

    // ─── PATCH /brands/:id ────────────────────────────────────────────────────────

    @Patch(':id')
    @ApiOperation({ summary: 'Update a brand (partial update supported)' })
    @ApiParam({ name: 'id', description: 'Brand MongoDB ObjectId' })
    @ApiResponse({ status: 200, description: 'Brand updated successfully.' })
    @ApiResponse({ status: 400, description: 'Validation error.' })
    @ApiResponse({ status: 404, description: 'Brand not found.' })
    @ApiResponse({ status: 409, description: 'Brand name already exists.' })
    update(
        @Param('id') id: string,
        @Body() updateBrandDto: UpdateBrandDto,
        @CurrentUser() user: User,
    ) {
        return this.brandsService.update(id, updateBrandDto, this.resolveUserId(user));
    }

    // ─── DELETE /brands/:id ───────────────────────────────────────────────────────

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete a brand' })
    @ApiParam({ name: 'id', description: 'Brand MongoDB ObjectId' })
    @ApiResponse({ status: 204, description: 'Brand deleted successfully.' })
    @ApiResponse({ status: 404, description: 'Brand not found.' })
    remove(@Param('id') id: string, @CurrentUser() user: User) {
        return this.brandsService.remove(id, this.resolveUserId(user));
    }
}
