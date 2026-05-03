import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';
import { BrandCollaborator, BrandCollaboratorDocument, BrandInviteStatus } from './schemas/brand-collaborator.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { UsersService } from '../users/users.service';
import { CollaborationGateway } from '../collaboration/gateways/collaboration.gateway';
import { Plan, PlanDocument, PlanStatus, PlanObjective } from '../plans/schemas/plan.schema';
import { UserRole } from '../users/schemas/user.schema';

export interface PaginatedBrands {
    data: Brand[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
}

@Injectable()
export class BrandsService {
    constructor(
        @InjectModel(Brand.name) private brandModel: Model<BrandDocument>,
        @InjectModel(BrandCollaborator.name) private brandCollabModel: Model<BrandCollaboratorDocument>,
        @InjectModel(Plan.name) private planModel: Model<PlanDocument>,
        private usersService: UsersService,
        private readonly gateway: CollaborationGateway,
    ) { }

    async create(createBrandDto: CreateBrandDto, userId: string): Promise<Brand> {
        const user = await this.usersService.findById(userId);
        if (!user || !user.isPremium) {
            throw new ForbiddenException('Only upgraded Brand Owner accounts can create a Brand.');
        }

        if (createBrandDto.contentPillars && createBrandDto.contentPillars.length > 5) {
            throw new BadRequestException('contentPillars cannot exceed 5 items');
        }

        if (!createBrandDto.platforms || createBrandDto.platforms.length === 0) {
            throw new BadRequestException('At least one platform is required');
        }

        try {
            const brand = new this.brandModel({ ...createBrandDto, userId });
            const savedBrand = await brand.save();

            // Auto-create default strategy
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 90); // Default 3 months

            const defaultPlan = new this.planModel({
                userId,
                brandId: (savedBrand as any).id ?? savedBrand._id.toString(),
                name: `${savedBrand.name} Strategy`,
                objective: PlanObjective.BRAND_AWARENESS,
                startDate,
                endDate,
                durationWeeks: 12,
                platforms: savedBrand.platforms || [],
                status: PlanStatus.DRAFT,
                phases: [],
                projectDNA: {
                    performance: { consistencyScore: 90, engagementScore: 85, budgetScore: 80, timingScore: 95 },
                    budget: { totalBudget: 1000, spentBudget: 0, platformROAS: [] }
                }
            });
            await defaultPlan.save();

            // Auto-upgrade user role to BRAND_OWNER if not already
            if (user.role !== UserRole.BRAND_OWNER) {
                await this.usersService.updateUserRole(userId, UserRole.BRAND_OWNER);
            }

            return savedBrand;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException(
                    `A brand named "${createBrandDto.name}" already exists for your account`,
                );
            }
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors)
                    .map((err: any) => err.message)
                    .join(', ');
                console.error('[BrandsService] Validation Error:', messages);
                console.error('[BrandsService] DTO received:', JSON.stringify(createBrandDto, null, 2));
                throw new BadRequestException(`Validation error: ${messages}`);
            }
            console.error('[BrandsService] Unexpected error:', error);
            throw error;
        }
    }

    async findAll(
        userId: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<PaginatedBrands> {
        const safePage = Math.max(1, page);
        const safeLimit = Math.min(Math.max(1, limit), 100); // cap at 100 per page
        const skip = (safePage - 1) * safeLimit;

        const [data, total] = await Promise.all([
            this.brandModel
                .find({ userId })
                .skip(skip)
                .limit(safeLimit)
                .sort({ createdAt: -1 })
                .exec(),
            this.brandModel.countDocuments({ userId }).exec(),
        ]);

        const totalPages = Math.ceil(total / safeLimit);

        return {
            data,
            total,
            page: safePage,
            limit: safeLimit,
            totalPages,
            hasNextPage: safePage < totalPages,
            hasPrevPage: safePage > 1,
        };
    }

    async findOne(id: string, userId: string): Promise<Brand> {
        const brand = await this.brandModel.findOne({ _id: id, userId }).exec();
        if (!brand) {
            throw new NotFoundException(`Brand with ID "${id}" not found`);
        }
        return brand;
    }

    async update(id: string, updateBrandDto: UpdateBrandDto, userId: string): Promise<Brand> {
        if (updateBrandDto.contentPillars && updateBrandDto.contentPillars.length > 5) {
            throw new BadRequestException('contentPillars cannot exceed 5 items');
        }

        try {
            const updated = await this.brandModel
                .findOneAndUpdate({ _id: id, userId }, { $set: updateBrandDto }, { new: true, runValidators: true })
                .exec();

            if (!updated) {
                throw new NotFoundException(`Brand with ID "${id}" not found`);
            }
            return updated;
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException(
                    `A brand named "${updateBrandDto.name}" already exists for your account`,
                );
            }
            if (error.name === 'ValidationError') {
                const messages = Object.values(error.errors)
                    .map((err: any) => err.message)
                    .join(', ');
                throw new BadRequestException(`Validation error: ${messages}`);
            }
            throw error;
        }
    }

    async remove(id: string, userId: string): Promise<void> {
        const result = await this.brandModel.deleteOne({ _id: id, userId }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Brand with ID "${id}" not found`);
        }
    }

    // ── Brand Collaboration ────────────────────────────────────────────────

    async inviteCollaborator(brandId: string, inviteeId: string, inviterId: string) {
        const brand = await this.brandModel.findOne({ _id: brandId, userId: inviterId }).exec();
        if (!brand) throw new ForbiddenException('You do not own this brand');

        const invitee = await this.usersService.findById(inviteeId);
        if (!invitee) throw new NotFoundException('User not found');

        const existing = await this.brandCollabModel.findOne({
            brandId: new Types.ObjectId(brandId),
            userId: new Types.ObjectId(inviteeId),
        }).exec();

        if (existing) {
            if (existing.status === BrandInviteStatus.ACCEPTED) {
                throw new ConflictException('User is already a collaborator of this brand');
            }
            if (existing.status === BrandInviteStatus.PENDING) {
                throw new ConflictException('Invitation already sent');
            }
            // Re-invite if previously declined
            existing.status = BrandInviteStatus.PENDING;
            await existing.save();
            this.gateway.emitNotification(inviteeId, {
                type: 'brand_invite_received',
                invitationId: existing._id,
                brandId,
                brandName: brand.name,
                message: `You have been invited to collaborate on brand "${brand.name}"`,
            });
            return existing;
        }

        const invite = await this.brandCollabModel.create({
            brandId: new Types.ObjectId(brandId),
            userId: new Types.ObjectId(inviteeId),
            inviterId: new Types.ObjectId(inviterId),
            status: BrandInviteStatus.PENDING,
        });

        this.gateway.emitNotification(inviteeId, {
            type: 'brand_invite_received',
            invitationId: invite._id,
            brandId,
            brandName: brand.name,
            message: `You have been invited to collaborate on brand "${brand.name}"`,
        });

        return invite;
    }

    async acceptBrandInvitation(invitationId: string, userId: string) {
        const invite = await this.brandCollabModel.findOne({
            _id: invitationId,
            userId: new Types.ObjectId(userId),
            status: BrandInviteStatus.PENDING,
        }).exec();

        if (!invite) throw new NotFoundException('Invitation not found or already handled');

        invite.status = BrandInviteStatus.ACCEPTED;
        await invite.save();

        const brand = await this.brandModel.findById(invite.brandId).exec();
        this.gateway.emitNotification(invite.inviterId.toString(), {
            type: 'brand_invite_accepted',
            brandId: invite.brandId,
            brandName: brand?.name,
            userId,
            message: `A user has accepted your invitation to collaborate on "${brand?.name}"`,
        });

        return invite;
    }

    async declineBrandInvitation(invitationId: string, userId: string) {
        const invite = await this.brandCollabModel.findOne({
            _id: invitationId,
            userId: new Types.ObjectId(userId),
            status: BrandInviteStatus.PENDING,
        }).exec();

        if (!invite) throw new NotFoundException('Invitation not found or already handled');

        invite.status = BrandInviteStatus.DECLINED;
        await invite.save();

        return invite;
    }

    async listBrandCollaborators(brandId: string, ownerId: string) {
        const brand = await this.brandModel.findOne({ _id: brandId, userId: ownerId }).exec();
        if (!brand) throw new ForbiddenException('You do not own this brand');

        return this.brandCollabModel
            .find({ brandId: new Types.ObjectId(brandId), status: { $in: [BrandInviteStatus.ACCEPTED, BrandInviteStatus.PENDING] } })
            .populate('userId', 'displayName email avatar')
            .exec();
    }

    async removeBrandCollaborator(brandId: string, collaboratorUserId: string, ownerId: string) {
        const brand = await this.brandModel.findOne({ _id: brandId, userId: ownerId }).exec();
        if (!brand) throw new ForbiddenException('You do not own this brand');

        const result = await this.brandCollabModel.deleteOne({
            brandId: new Types.ObjectId(brandId),
            userId: new Types.ObjectId(collaboratorUserId),
        }).exec();

        if (result.deletedCount === 0) throw new NotFoundException('Collaborator not found');

        this.gateway.emitNotification(collaboratorUserId, {
            type: 'brand_collaborator_removed',
            brandId,
            brandName: brand.name,
            message: `You have been removed from brand "${brand.name}"`,
        });

        return { success: true };
    }

    async getMyBrandCollaborations(userId: string) {
        const records = await this.brandCollabModel
            .find({ userId: new Types.ObjectId(userId), status: BrandInviteStatus.ACCEPTED })
            .populate('brandId')
            .exec();

        return records.map(r => r.brandId);
    }

    async getMyPendingBrandInvitations(userId: string) {
        return this.brandCollabModel
            .find({ userId: new Types.ObjectId(userId), status: BrandInviteStatus.PENDING })
            .populate('brandId', 'name')
            .populate('inviterId', 'displayName email')
            .exec();
    }

    async getAcceptedBrandCollaboratorIds(brandId: string): Promise<Types.ObjectId[]> {
        const records = await this.brandCollabModel
            .find({ brandId: new Types.ObjectId(brandId), status: BrandInviteStatus.ACCEPTED })
            .select('userId')
            .exec();
        return records.map(r => r.userId);
    }

    async getBrandIdsByCollaborator(userId: string): Promise<Types.ObjectId[]> {
        const records = await this.brandCollabModel
            .find({ userId: new Types.ObjectId(userId), status: BrandInviteStatus.ACCEPTED })
            .select('brandId')
            .exec();
        return records.map(r => r.brandId);
    }
}
