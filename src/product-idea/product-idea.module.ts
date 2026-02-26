import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductIdeaController } from './product-idea.controller';
import { ProductIdeaService } from './product-idea.service';
import { ProductIdea, ProductIdeaSchema } from './schemas/product-idea.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductIdea.name, schema: ProductIdeaSchema },
    ]),
  ],
  controllers: [ProductIdeaController],
  providers: [ProductIdeaService],
  exports: [ProductIdeaService],
})
export class ProductIdeaModule {}
