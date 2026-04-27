import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ImageEditorController } from './image-editor.controller';
import { ImageEditorService } from './image-editor.service';
import { EditedImage, EditedImageSchema } from './schemas/edited-image.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: EditedImage.name, schema: EditedImageSchema }])],
  controllers: [ImageEditorController],
  providers: [ImageEditorService],
  exports: [ImageEditorService],
})
export class ImageEditorModule {}