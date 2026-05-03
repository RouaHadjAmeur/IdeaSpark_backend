import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VideoEditorController } from './video-editor.controller';
import { VideoEditorService } from './video-editor.service';
import { EditedVideo, EditedVideoSchema } from './schemas/edited-video.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: EditedVideo.name, schema: EditedVideoSchema }])],
  controllers: [VideoEditorController],
  providers: [VideoEditorService],
  exports: [VideoEditorService],
})
export class VideoEditorModule {}