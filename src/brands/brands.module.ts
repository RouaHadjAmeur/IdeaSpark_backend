import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BrandsService } from './brands.service';
import { BrandsController } from './brands.controller';
import { Brand, BrandSchema } from './schemas/brand.schema';
import { BrandCollaborator, BrandCollaboratorSchema } from './schemas/brand-collaborator.schema';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Brand.name, schema: BrandSchema },
            { name: BrandCollaborator.name, schema: BrandCollaboratorSchema },
        ]),
        UsersModule,
    ],
    controllers: [BrandsController],
    providers: [BrandsService],
    exports: [BrandsService, MongooseModule],
})
export class BrandsModule { }
