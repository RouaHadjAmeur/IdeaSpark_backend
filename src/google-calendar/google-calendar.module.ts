import { Module } from '@nestjs/common';
import { GoogleCalendarService } from './google-calendar.service';
import { GoogleCalendarController } from './google-calendar.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarEntry, CalendarEntrySchema } from '../plans/schemas/calendar-entry.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarEntry.name, schema: CalendarEntrySchema },
    ]),
  ],
  controllers: [GoogleCalendarController],
  providers: [GoogleCalendarService],
  exports: [GoogleCalendarService],
})
export class GoogleCalendarModule {}
