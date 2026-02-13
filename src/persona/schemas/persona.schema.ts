import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PersonaDocument = Persona & Document;

export enum UserType {
    Student = 'Étudiant(e)',
    Ecommerce = 'E-commerce',
    Influencer = 'Influenceur',
    Entrepreneur = 'Entrepreneur',
    Other = 'Autre',
}

export enum MainGoal {
    Views = 'Vues',
    Community = 'Communauté',
    Sell = 'Vendre',
    Leads = 'Leads',
    Educate = 'Éduquer',
}

export enum Niche {
    Business = 'Business',
    Ecommerce = 'E-commerce',
    Beauty = 'Beauté',
    Fitness = 'Fitness',
    Tech = 'Tech',
    Lifestyle = 'Lifestyle',
    Education = 'Éducation',
    Other = 'Autre',
}

export enum MainPlatform {
    TikTok = 'TikTok',
    Instagram = 'Instagram',
    YouTube = 'YouTube',
    Facebook = 'Facebook',
}

export enum FrequentPlatform {
    TikTok = 'TikTok',
    InstagramReels = 'Instagram Reels',
    InstagramStories = 'Instagram Stories',
    YouTubeShorts = 'YouTube Shorts',
    YouTubeLong = 'YouTube Long',
    Facebook = 'Facebook',
}

export enum ContentStyle {
    Facecam = 'Facecam',
    VoiceOver = 'Voice-over',
    TextScreen = 'Texte écran',
    Demo = 'Démo',
    Storytime = 'Storytime',
    Other = 'Autre',
}

export enum PreferredTone {
    Fun = 'Fun',
    Expert = 'Expert',
    Reassuring = 'Rassurant',
    Motivation = 'Motivation',
    Direct = 'Direct',
    Mixed = 'Mixte',
}

export enum MainAudience {
    Students = 'Étudiants',
    YoungProfessionals = 'Jeunes actifs',
    Women = 'Femmes',
    Men = 'Hommes',
    Entrepreneurs = 'Entrepreneurs',
    Mixed = 'Mixte',
}

export enum AudienceAge {
    Teen = '-17',
    Adult = '18-44',
    Senior = '+45',
    Mixed = 'Mixte',
}

export enum Language {
    French = 'Français',
    Arabic = 'Arabe',
    English = 'English',
    Mixed = 'Mixte',
}

export enum CTA {
    Subscribe = 'Abonne-toi',
    Comment = 'Commente',
    LinkInBio = 'Lien en bio',
    DM = 'DM',
    WhatsApp = 'WhatsApp',
    Order = 'Commander',
}

@Schema({ timestamps: true })
export class Persona {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    userId: Types.ObjectId;

    @Prop({ required: true, enum: UserType })
    userType: UserType;

    @Prop({ required: true, enum: MainGoal })
    mainGoal: MainGoal;

    @Prop({ type: [String], enum: Niche, required: true })
    niches: Niche[];

    @Prop({ required: true, enum: MainPlatform })
    mainPlatform: MainPlatform;

    @Prop({ type: [String], enum: FrequentPlatform, default: [] })
    frequentPlatforms: FrequentPlatform[];

    @Prop({ type: [String], enum: ContentStyle, required: true })
    contentStyles: ContentStyle[];

    @Prop({ required: true, enum: PreferredTone })
    preferredTone: PreferredTone;

    @Prop({ type: [String], enum: MainAudience, required: true })
    audiences: MainAudience[];

    @Prop({ required: true, enum: AudienceAge })
    audienceAge: AudienceAge;

    @Prop({ required: true, enum: Language })
    language: Language;

    @Prop({ type: [String], enum: CTA, required: true })
    preferredCTAs: CTA[];

    @Prop({ default: true })
    isActive: boolean;
}

export const PersonaSchema = SchemaFactory.createForClass(Persona);

// Add index for faster lookups by userId
PersonaSchema.index({ userId: 1 });
