import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand, BrandDocument } from './schemas/brand.schema';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';

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
    ) { }

    async create(createBrandDto: CreateBrandDto, userId: string): Promise<Brand> {
        if (createBrandDto.contentPillars && createBrandDto.contentPillars.length > 5) {
            throw new BadRequestException('contentPillars cannot exceed 5 items');
        }

        try {
            const brand = new this.brandModel({ ...createBrandDto, userId });
            return await brand.save();
        } catch (error) {
            if (error.code === 11000) {
                throw new ConflictException(
                    `A brand named "${createBrandDto.name}" already exists for your account`,
                );
            }
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
            throw error;
        }
    }

    async remove(id: string, userId: string): Promise<void> {
        const result = await this.brandModel.deleteOne({ _id: id, userId }).exec();
        if (result.deletedCount === 0) {
            throw new NotFoundException(`Brand with ID "${id}" not found`);
        }
    }
}
