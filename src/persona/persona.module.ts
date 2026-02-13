import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonaService } from './persona.service';
import { PersonaController } from './persona.controller';
import { Persona, PersonaSchema } from './schemas/persona.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Persona.name, schema: PersonaSchema }]),
    ],
    controllers: [PersonaController],
    providers: [PersonaService],
    exports: [PersonaService], // Export service so other modules can use it
})
export class PersonaModule {}
