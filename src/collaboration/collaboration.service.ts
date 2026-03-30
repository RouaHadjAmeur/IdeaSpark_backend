import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
    CollaborationInvitation,
    CollaborationInvitationDocument,
    InvitationStatus,
} from './schemas/collaboration-invitation.schema';
import { ProjectCollaborator, ProjectCollaboratorDocument } from './schemas/project-collaborator.schema';
import { ProjectActivity, ProjectActivityDocument } from './schemas/project-activity.schema';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { PlansService } from '../plans/plans.service';

@Injectable()
export class CollaborationService {
    constructor(
        @InjectModel(CollaborationInvitation.name)
        private invitationModel: Model<CollaborationInvitationDocument>,
        @InjectModel(ProjectCollaborator.name)
        private collaboratorModel: Model<ProjectCollaboratorDocument>,
        @InjectModel(ProjectActivity.name)
        private activityModel: Model<ProjectActivityDocument>,
        @InjectModel(Notification.name)
        private notificationModel: Model<NotificationDocument>,
        @Inject(forwardRef(() => PlansService))
        private plansService: PlansService,
    ) { }

    // ─── Assert Access ────────────────────────────────────────────────────────────
    async assertAccess(planId: string, userId: string): Promise<boolean> {
        // Owner check
        try {
            const plan = await this.plansService.findOne(planId, userId, true);
            if (plan) return true;
        } catch (e) {
            // Not owner
        }
        // Collaborator check
        const isCollaborator = await this.collaboratorModel.exists({
            planId: new Types.ObjectId(planId),
            userId: new Types.ObjectId(userId),
        });
        if (isCollaborator) return true;
        
        throw new ForbiddenException('You do not have access to this project');
    }

    async getCollaboratorPlanIds(userId: string): Promise<string[]> {
        if (!userId || !Types.ObjectId.isValid(userId)) return [];
        const collabs = await this.collaboratorModel.find({ userId: new Types.ObjectId(userId) }).select('planId').exec();
        return collabs.map(c => c.planId.toString());
    }

    async getSharedPlans(userId1: string, userId2: string) {
        if (!Types.ObjectId.isValid(userId1) || !Types.ObjectId.isValid(userId2)) return [];

        const [plans1, plans2] = await Promise.all([
            this.getUserAssociatedPlanIds(userId1),
            this.getUserAssociatedPlanIds(userId2)
        ]);

        const commonIds = plans1.filter(id => plans2.includes(id));
        if (commonIds.length === 0) return [];

        return this.plansService.findMany(commonIds);
    }

    private async getUserAssociatedPlanIds(userId: string): Promise<string[]> {
        const [ownedPlans, collabPlanIds] = await Promise.all([
            this.plansService.findOwnedPlanIds(userId),
            this.getCollaboratorPlanIds(userId)
        ]);
        return Array.from(new Set([...ownedPlans, ...collabPlanIds]));
    }

    // ─── Invitations ──────────────────────────────────────────────────────────────
    async inviteCollaborator(planId: string, inviterId: string, inviteeId: string, role: string = 'collaborator') {
        // Validate all IDs before touching ObjectId constructor
        if (!planId || !Types.ObjectId.isValid(planId))
            throw new BadRequestException('Invalid planId');
        if (!inviterId || !Types.ObjectId.isValid(inviterId))
            throw new BadRequestException('Invalid inviterId');
        if (!inviteeId || !Types.ObjectId.isValid(inviteeId))
            throw new BadRequestException('Invalid inviteeId');

        if (inviterId === inviteeId)
            throw new BadRequestException('Owner cannot invite themselves');

        // Strict owner-only check (skipCollaboratorCheck = true means collaborators are NOT found)
        let plan: any = null;
        try {
            plan = await this.plansService.findOne(planId, inviterId, true);
        } catch {
            throw new ForbiddenException('Only the plan owner can send invitations');
        }
        if (!plan) throw new ForbiddenException('Only the plan owner can send invitations');

        const [existingCollab, existingInvite] = await Promise.all([
            this.collaboratorModel.findOne({ planId: new Types.ObjectId(planId), userId: new Types.ObjectId(inviteeId) }),
            this.invitationModel.findOne({ planId: new Types.ObjectId(planId), inviteeId: new Types.ObjectId(inviteeId), status: InvitationStatus.PENDING }),
        ]);

        if (existingCollab)
            throw new BadRequestException('User is already a collaborator');
        if (existingInvite)
            throw new BadRequestException('An active invitation is already pending for this user');

        const invitation = await this.invitationModel.create({
            planId: new Types.ObjectId(planId),
            inviterId: new Types.ObjectId(inviterId),
            inviteeId: new Types.ObjectId(inviteeId),
            role,
        });

        // Create notification
        await this.notificationModel.create({
            userId: new Types.ObjectId(inviteeId),
            type: 'invite_received',
            message: `You have been invited to collaborate on a project.`,
            relatedPlanId: new Types.ObjectId(planId),
            relatedUserId: new Types.ObjectId(inviterId),
        });

        return invitation;
    }

    async acceptInvitation(invitationId: string, userId: string) {
        const invitation = await this.invitationModel.findOne({ _id: new Types.ObjectId(invitationId), inviteeId: new Types.ObjectId(userId) });
        if (!invitation) throw new NotFoundException('Invitation not found');
        if (invitation.status !== InvitationStatus.PENDING) throw new BadRequestException(`Invitation is already ${invitation.status}`);

        invitation.status = InvitationStatus.ACCEPTED;
        await invitation.save();

        const collaborator = await this.collaboratorModel.create({
            planId: invitation.planId,
            userId: invitation.inviteeId,
            role: invitation.role,
        });

        await this.logActivity(
            invitation.planId.toString(),
            userId,
            'User', // Could fetch actual name
            'accept',
            'collaborator',
            undefined,
            'joined'
        );

        // Notify inviter
        await this.notificationModel.create({
            userId: invitation.inviterId,
            type: 'invite_accepted',
            message: `Your invitation has been accepted.`,
            relatedPlanId: invitation.planId,
            relatedUserId: new Types.ObjectId(userId),
        });

        return collaborator;
    }

    async declineInvitation(invitationId: string, userId: string) {
        const invitation = await this.invitationModel.findOne({ _id: new Types.ObjectId(invitationId), inviteeId: new Types.ObjectId(userId) });
        if (!invitation) throw new NotFoundException('Invitation not found');
        if (invitation.status !== InvitationStatus.PENDING) throw new BadRequestException(`Invitation is already ${invitation.status}`);

        invitation.status = InvitationStatus.DECLINED;
        await invitation.save();

        // Notify inviter
        await this.notificationModel.create({
            userId: invitation.inviterId,
            type: 'invite_declined',
            message: `Your invitation was declined.`,
            relatedPlanId: invitation.planId,
            relatedUserId: new Types.ObjectId(userId),
        });

        return { success: true };
    }

    // ─── Manage Collaborators ───────────────────────────────────────────────────
    async getCollaborators(planId: string, userId: string) {
        await this.assertAccess(planId, userId);
        return this.collaboratorModel.find({ planId: new Types.ObjectId(planId) }).populate('userId', 'name email profile_img username role').exec();
    }

    async removeCollaborator(planId: string, ownerId: string, userIdToRemove: string) {
        // Only owner can remove
        await this.plansService.findOne(planId, ownerId);
        
        const removed = await this.collaboratorModel.findOneAndDelete({
            planId: new Types.ObjectId(planId),
            userId: new Types.ObjectId(userIdToRemove),
        });

        if (removed) {
            await this.notificationModel.create({
                userId: new Types.ObjectId(userIdToRemove),
                type: 'collaborator_removed',
                message: `You were removed from the project.`,
                relatedPlanId: new Types.ObjectId(planId),
            });
            await this.logActivity(
                planId,
                ownerId,
                'Owner', // Could fetch actual name
                'remove',
                'collaborator',
                userIdToRemove,
                undefined
            );
        }
        return { success: !!removed };
    }

    // ─── Activity Log ───────────────────────────────────────────────────────────
    async logActivity(planId: string, userId: string, userName: string, actionType: string, fieldChanged?: string, oldValue?: string, newValue?: string) {
        return this.activityModel.create({
            planId: new Types.ObjectId(planId),
            userId: new Types.ObjectId(userId),
            userName,
            actionType,
            fieldChanged,
            oldValue,
            newValue,
        });
    }

    async getActivityLog(planId: string, userId: string) {
        await this.assertAccess(planId, userId);
        return this.activityModel.find({ planId: new Types.ObjectId(planId) }).sort({ createdAt: -1 }).limit(100).exec();
    }

    // ─── Notifications ──────────────────────────────────────────────────────────
    async getNotifications(userId: string) {
        return this.notificationModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(20).populate('relatedUserId', 'name profile_img username').exec();
    }

    async markNotificationRead(notificationId: string, userId: string) {
        return this.notificationModel.findOneAndUpdate(
            { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
            { $set: { read: true } },
            { new: true }
        ).exec();
    }
}
