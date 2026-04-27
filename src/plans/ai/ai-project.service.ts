import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Plan, PlanDocument } from '../schemas/plan.schema';
import { User, UserDocument } from '../../users/schemas/user.schema';
import { Task, TaskDocument, TaskStatus } from '../../collaboration/schemas/task.schema';

@Injectable()
export class AIProjectService {
    private readonly logger = new Logger(AIProjectService.name);
    private readonly primaryModel = 'Qwen/Qwen2.5-72B-Instruct';
    private readonly fallbackModel = 'Qwen/Qwen2.5-7B-Instruct';
    private readonly apiKey: string;

    constructor(
        private readonly configService: ConfigService,
        @InjectModel(Plan.name) private readonly planModel: Model<PlanDocument>,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(Task.name) private readonly taskModel: Model<TaskDocument>,
    ) {
        this.apiKey = this.configService.get<string>('HUGGING_FACE_API_KEY') || '';
        if (!this.apiKey) {
            this.logger.warn('HUGGING_FACE_API_KEY is not configured. AI Project analytics will not work.');
        }
    }

    private async callHuggingFace(model: string, prompt: string): Promise<string> {
        if (!this.apiKey) {
            throw new Error('Hugging Face API key missing');
        }

        try {
            const response = await axios.post(
                'https://router.huggingface.co/v1/chat/completions',
                {
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 2048,
                    temperature: 0.7,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 45000,
                }
            );

            const content = response.data?.choices?.[0]?.message?.content;
            if (content) return content;
            throw new Error(`Unexpected response structure from HF: ${JSON.stringify(response.data)}`);
        } catch (error) {
            const status = error.response?.status;
            const errorMsg = error.response?.data?.error || error.message;
            this.logger.error(`Error calling Hugging Face model ${model}: [${status}] ${errorMsg}`);
            throw error;
        }
    }

    // ─── Readiness Score ────────────────────────────────────────────────────────
    async calculateReadinessScore(planId: string): Promise<number> {
        const plan = await this.planModel.findById(planId).exec();
        if (!plan) return 0;

        const tasks = await this.taskModel.find({ planId: new Types.ObjectId(planId) }).exec();
        
        let score = 0;
        
        // 1. DNA Completeness (30%)
        const dna = plan.projectDNA || {};
        const strategicFields = ['vision', 'offer', 'positioning', 'campaignAngle'];
        const filledStrategic = strategicFields.filter(f => (dna.strategic as any)?.[f]).length;
        score += (filledStrategic / strategicFields.length) * 30;

        // 2. Task Progress (40%)
        if (tasks.length > 0) {
            const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
            score += (completedTasks / tasks.length) * 40;
        }

        // 3. Team Readiness (30%)
        if (dna.skill?.requiredRoles?.length > 0) {
            const missingRolesCount = dna.skill.missingRoles?.length || 0;
            const filledRoles = dna.skill.requiredRoles.length - missingRolesCount;
            score += (filledRoles / dna.skill.requiredRoles.length) * 30;
        } else {
            score += 30; // Assume team is ready if no roles required yet
        }

        return Math.round(score);
    }

    // ─── Weak Point Detection ───────────────────────────────────────────────────
    async detectWeakPoints(planId: string): Promise<string[]> {
        if (!this.apiKey) return ['AI Service not configured'];

        const plan = await this.planModel.findById(planId).exec();
        const tasks = await this.taskModel.find({ planId: new Types.ObjectId(planId) }).exec();
        
        const prompt = `
            Analyze this campaign project and identify 3-5 weak points or risks.
            Project: ${plan?.name}
            Strategic DNA: ${JSON.stringify(plan?.projectDNA?.strategic)}
            Tasks: ${tasks.map(t => `${t.title} (${t.status})`).join(', ')}
            Missing Roles: ${plan?.projectDNA?.skill?.missingRoles?.join(', ')}
            
            Return a JSON array of strings representing weak points.
        `;

        try {
            let text = '';
            try {
                text = await this.callHuggingFace(this.primaryModel, prompt);
            } catch (err) {
                this.logger.warn('Primary model failed for weak point detection, trying fallback...');
                text = await this.callHuggingFace(this.fallbackModel, prompt);
            }

            // Basic extraction if not raw JSON
            const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
            const match = cleaned.match(/\[.*\]/s);
            return match ? JSON.parse(match[0]) : ['Unable to analyze project state'];
        } catch (e) {
            this.logger.error('Weak point detection failed', e);
            return ['Analytics currently unavailable'];
        }
    }

    // ─── Collaborator Suggestions ──────────────────────────────────────────────
    async suggestCollaborators(planId: string): Promise<any[]> {
        const plan = await this.planModel.findById(planId).exec();
        if (!plan || !plan.projectDNA?.skill?.requiredRoles?.length) return [];

        const missingRoles = plan.projectDNA.skill.missingRoles || plan.projectDNA.skill.requiredRoles;
        
        // Find users matching these roles or skills
        return this.userModel.find({
            $or: [
                { role: { $in: missingRoles } },
                { skills: { $in: missingRoles } }
            ]
        }).limit(5).exec();
    }

    // ─── DNA Auto-generation ────────────────────────────────────────────────────
    async suggestDNADetails(planId: string): Promise<Partial<Plan['projectDNA']>> {
        if (!this.apiKey) return {};

        const plan = await this.planModel.findById(planId).exec();
        
        const prompt = `
            Based on the project objective "${plan?.objective}" and name "${plan?.name}", 
            suggest missing fields for the Project DNA.
            Provide: vision, positioning, campaignAngle, and requiredRoles.
            Return as JSON.
        `;

        try {
            let text = '';
            try {
                text = await this.callHuggingFace(this.primaryModel, prompt);
            } catch (err) {
                this.logger.warn('Primary model failed for DNA details suggestion, trying fallback...');
                text = await this.callHuggingFace(this.fallbackModel, prompt);
            }

            const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
            const match = cleaned.match(/\{.*\}/s);
            return match ? JSON.parse(match[0]) : {};
        } catch (e) {
            this.logger.error('DNA suggestion failed', e);
            return {};
        }
    }

    // ─── Hook & Caption Generation ──────────────────────────────────────────────
    async generateHook(plan: Plan, block: any): Promise<string> {
        const prompt = `
            Generate a viral marketing HOOK for this content block.
            Campaign: ${plan.name} (Objective: ${plan.objective})
            Post Title: ${block.title}
            Pillar: ${block.pillar}
            Format: ${block.format}
            
            Return ONLY the hook text, concise and punchy.
        `;
        return this.callHuggingFace(this.primaryModel, prompt);
    }

    async generateCaption(plan: Plan, block: any): Promise<string> {
        const prompt = `
            Generate an engaging Instagram/TikTok CAPTION for this content block.
            Campaign: ${plan.name} (Objective: ${plan.objective})
            Post Title: ${block.title}
            Pillar: ${block.pillar}
            Format: ${block.format}
            CTA Type: ${block.ctaType}
            
            Include relevant emojis and hashtags. Return ONLY the caption text.
        `;
        return this.callHuggingFace(this.primaryModel, prompt);
    }
}
