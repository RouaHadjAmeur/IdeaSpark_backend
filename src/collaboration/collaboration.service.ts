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
import { Task, TaskDocument, TaskStatus } from './schemas/task.schema';
import { Deliverable, DeliverableDocument, DeliverableStatus } from './schemas/deliverable.schema';
import { PlansService } from '../plans/plans.service';
import { UsersService } from '../users/users.service';
import { CollaborationGateway } from './gateways/collaboration.gateway';

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
        @InjectModel(Task.name)
        private taskModel: Model<TaskDocument>,
        @InjectModel(Deliverable.name)
        private deliverableModel: Model<DeliverableDocument>,
        @Inject(forwardRef(() => PlansService))
        private plansService: PlansService,
        @Inject(forwardRef(() => UsersService))
        private usersService: UsersService,
        private collaborationGateway: CollaborationGateway,
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

    async getMyCollaborationPlans(userId: string) {
        console.log('[getMyCollaborationPlans] userId:', userId);
        const allCollabs = await this.collaboratorModel.find({}).select('userId planId').lean().exec();
        console.log('[getMyCollaborationPlans] all collaborators in DB:', JSON.stringify(allCollabs));
        const planIds = await this.getCollaboratorPlanIds(userId);
        console.log('[getMyCollaborationPlans] planIds for user:', planIds);
        if (planIds.length === 0) return [];
        return this.plansService.findMany(planIds);
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
        const inviterOptions = await this.usersService.findById(inviterId);
        if (!inviterOptions || !inviterOptions.isPremium) {
            throw new ForbiddenException('Only upgraded Brand Owner accounts can invite collaborators.');
        }

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
        const notification = await this.notificationModel.create({
            userId: new Types.ObjectId(inviteeId),
            type: 'invite_received',
            message: `You have been invited to collaborate on a project.`,
            relatedPlanId: new Types.ObjectId(planId),
            relatedUserId: new Types.ObjectId(inviterId),
            relatedInvitationId: invitation._id,
        });

        // Emit real-time notification
        this.collaborationGateway.emitNotification(inviteeId, notification.toObject());

        return invitation;
    }

    async acceptInvitationByPlan(planId: string, userId: string) {
        const invitation = await this.invitationModel.findOne({
            planId: new Types.ObjectId(planId),
            inviteeId: new Types.ObjectId(userId),
            status: InvitationStatus.PENDING,
        });
        if (!invitation) throw new NotFoundException('No pending invitation found for this plan');
        return this.acceptInvitation(invitation._id.toString(), userId);
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
        const notification = await this.notificationModel.create({
            userId: invitation.inviterId,
            type: 'invite_accepted',
            message: `Your invitation has been accepted.`,
            relatedPlanId: invitation.planId,
            relatedUserId: new Types.ObjectId(userId),
        });

        // Emit real-time notification
        this.collaborationGateway.emitNotification(invitation.inviterId.toString(), notification.toObject());

        return collaborator;
    }

    async declineInvitation(invitationId: string, userId: string) {
        const invitation = await this.invitationModel.findOne({ _id: new Types.ObjectId(invitationId), inviteeId: new Types.ObjectId(userId) });
        if (!invitation) throw new NotFoundException('Invitation not found');
        if (invitation.status !== InvitationStatus.PENDING) throw new BadRequestException(`Invitation is already ${invitation.status}`);

        invitation.status = InvitationStatus.DECLINED;
        await invitation.save();

        // Notify inviter
        const notification = await this.notificationModel.create({
            userId: invitation.inviterId,
            type: 'invite_declined',
            message: `Your invitation was declined.`,
            relatedPlanId: invitation.planId,
            relatedUserId: new Types.ObjectId(userId),
        });

        // Emit real-time notification
        this.collaborationGateway.emitNotification(invitation.inviterId.toString(), notification.toObject());

        return { success: true };
    }

    // ─── Manage Collaborators ───────────────────────────────────────────────────
    async getCollaborators(planId: string, userId: string) {
        await this.assertAccess(planId, userId);
        // Get all collaborators
        const collaborators = await this.collaboratorModel
            .find({ planId: new Types.ObjectId(planId) })
            .populate('userId', 'name email profile_img username role')
            .exec();
        // Also include the plan owner so the member list is complete
        const plan = await this.plansService.findOne(planId, userId, true).catch(() =>
            this.plansService.findOne(planId, (collaborators[0]?.userId as any)?._id?.toString() ?? userId, true).catch(() => null)
        );
        const ownerUser = plan ? await this.usersService.findById(plan.userId.toString()).catch(() => null) : null;
        const collaboratorUserIds = new Set(collaborators.map(c => (c.userId as any)?._id?.toString()));
        const result: any[] = [];
        if (ownerUser && !collaboratorUserIds.has(ownerUser.id?.toString() ?? ownerUser._id?.toString())) {
            result.push({
                _id: ownerUser.id ?? ownerUser._id,
                userId: {
                    _id: ownerUser.id ?? ownerUser._id,
                    name: ownerUser.name,
                    email: ownerUser.email,
                    profile_img: ownerUser.profile_img,
                    username: ownerUser.username,
                    role: 'brand_owner',
                },
                planId,
                role: 'admin',
                isOwner: true,
            });
        }
        result.push(...collaborators);
        return result;
    }

    async removeCollaborator(planId: string, ownerId: string, userIdToRemove: string) {
        // Only owner can remove
        await this.plansService.findOne(planId, ownerId);
        
        const removed = await this.collaboratorModel.findOneAndDelete({
            planId: new Types.ObjectId(planId),
            userId: new Types.ObjectId(userIdToRemove),
        });

        if (removed) {
            const notification = await this.notificationModel.create({
                userId: new Types.ObjectId(userIdToRemove),
                type: 'collaborator_removed',
                message: `You were removed from the project.`,
                relatedPlanId: new Types.ObjectId(planId),
            });
            // Emit real-time notification
            this.collaborationGateway.emitNotification(userIdToRemove, notification.toObject());
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
        if (!Types.ObjectId.isValid(planId) || !Types.ObjectId.isValid(userId)) {
            return; // Skip logging if IDs are not valid ObjectIds
        }
        // Always resolve the real user name from DB, ignore the passed-in placeholder
        let resolvedName = userName;
        try {
            const user = await this.usersService.findById(userId);
            if (user) {
                resolvedName = user.username || user.name || user.email || userName;
            }
        } catch (_) { /* keep fallback */ }
        return this.activityModel.create({
            planId: new Types.ObjectId(planId),
            userId: new Types.ObjectId(userId),
            userName: resolvedName,
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
        return this.notificationModel
            .find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .limit(20)
            .populate('relatedUserId', 'name profile_img username')
            .populate('relatedPlanId', 'name objective brandId startDate endDate platforms durationWeeks')
            .exec();
    }

    async markNotificationRead(notificationId: string, userId: string) {
        return this.notificationModel.findOneAndUpdate(
            { _id: new Types.ObjectId(notificationId), userId: new Types.ObjectId(userId) },
            { $set: { read: true } },
            { new: true }
        ).exec();
    }

    // ─── Tasks ──────────────────────────────────────────────────────────────────
    async createTask(planId: string, userId: string, data: Partial<Task>) {
        await this.assertAccess(planId, userId);
        const task = await this.taskModel.create({
            ...data,
            planId: new Types.ObjectId(planId),
            status: TaskStatus.TODO,
        });

        await this.logActivity(planId, userId, 'User', 'create', 'task', undefined, task.title);

        if (data.assignedTo) {
            const notification = await this.notificationModel.create({
                userId: data.assignedTo,
                type: 'task_assigned',
                message: `You have been assigned a new task: ${task.title}`,
                relatedPlanId: new Types.ObjectId(planId),
            });
            // Emit real-time notification
            this.collaborationGateway.emitNotification(data.assignedTo.toString(), notification.toObject());
        }

        return task;
    }

    async getTasks(planId: string, userId: string) {
        await this.assertAccess(planId, userId);
        return this.taskModel.find({ planId: new Types.ObjectId(planId) }).populate('assignedTo', 'name profile_img').exec();
    }

    async updateTask(taskId: string, userId: string, update: Partial<Task>) {
        const task = await this.taskModel.findById(taskId);
        if (!task) throw new NotFoundException('Task not found');
        await this.assertAccess(task.planId.toString(), userId);

        const oldStatus = task.status;
        Object.assign(task, update);
        await task.save();

        if (update.status && update.status !== oldStatus) {
            await this.logActivity(task.planId.toString(), userId, 'User', 'update', 'task_status', oldStatus, update.status);
            
            // If done, update project progress? Later in AI service.
        }

        return task;
    }

    // ─── Deliverables ───────────────────────────────────────────────────────────
    async submitDeliverable(taskId: string, userId: string, data: { fileUrl?: string; textContent?: string }) {
        const task = await this.taskModel.findById(taskId);
        if (!task) throw new NotFoundException('Task not found');
        await this.assertAccess(task.planId.toString(), userId);

        // Check if user is assigned to this task? (Strict permission)
        // if (task.assignedTo?.toString() !== userId) throw new ForbiddenException('You are not assigned to this task');

        const deliverable = await this.deliverableModel.create({
            ...data,
            taskId: task._id,
            planId: task.planId,
            userId: new Types.ObjectId(userId),
            status: DeliverableStatus.SUBMITTED,
        });

        task.deliverableId = deliverable._id as Types.ObjectId;
        task.status = TaskStatus.DONE; // Auto-mark as done upon submission? Or keep IN_PROGRESS?
        await task.save();

        await this.logActivity(task.planId.toString(), userId, 'User', 'submit', 'deliverable', undefined, task.title);

        // Notify Plan Owner
        const plan = await this.plansService.findOne(task.planId.toString(), userId, true);
        const notification = await this.notificationModel.create({
            userId: plan.userId,
            type: 'deliverable_submitted',
            message: `A deliverable has been submitted for task: ${task.title}`,
            relatedPlanId: task.planId,
        });
        // Emit real-time notification
        this.collaborationGateway.emitNotification(plan.userId.toString(), notification.toObject());

        return deliverable;
    }

    async reviewDeliverable(deliverableId: string, userId: string, status: DeliverableStatus, feedback?: string) {
        const deliverable = await this.deliverableModel.findById(deliverableId);
        if (!deliverable) throw new NotFoundException('Deliverable not found');
        
        // Only owner can review
        const plan = await this.plansService.findOne(deliverable.planId.toString(), userId);
        if (!plan) throw new ForbiddenException('Only the plan owner can review deliverables');

        deliverable.status = status;
        deliverable.feedback = feedback;
        await deliverable.save();

        await this.logActivity(deliverable.planId.toString(), userId, 'Owner', 'review', 'deliverable', undefined, status);

        // Notify collaborator
        const notification = await this.notificationModel.create({
            userId: deliverable.userId,
            type: 'deliverable_reviewed',
            message: `Your deliverable has been ${status}.`,
            relatedPlanId: deliverable.planId,
        });
        // Emit real-time notification
        this.collaborationGateway.emitNotification(deliverable.userId.toString(), notification.toObject());

        return deliverable;
    }
}
