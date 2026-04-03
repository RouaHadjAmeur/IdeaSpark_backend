import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { PlanMember, PlanMemberDocument, MemberRole, MemberStatus } from './schemas/plan-member.schema';
import { PostComment, PostCommentDocument } from './schemas/post-comment.schema';
import { PlanHistory, PlanHistoryDocument } from './schemas/plan-history.schema';
import { InviteMemberDto } from './dto/invite-member.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { AddHistoryDto } from './dto/add-history.dto';

@Injectable()
export class CollaborationService {
  constructor(
    @InjectModel(PlanMember.name) private memberModel: Model<PlanMemberDocument>,
    @InjectModel(PostComment.name) private commentModel: Model<PostCommentDocument>,
    @InjectModel(PlanHistory.name) private historyModel: Model<PlanHistoryDocument>,
    private mailService: MailService,
    private configService: ConfigService,
  ) {}

  // ─── Members ────────────────────────────────────────────────────────────────

  async inviteMember(dto: InviteMemberDto, inviterName: string, inviterId: string) {
    const token = randomUUID();
    const appUrl = this.configService.get<string>('APP_URL') || 'http://localhost:3000';

    const member = await this.memberModel.create({
      planId: dto.planId,
      email: dto.email,
      name: dto.name,
      role: dto.role,
      status: MemberStatus.PENDING,
      inviteToken: token,
    });

    const acceptUrl = `${appUrl}/collaboration/accept/${token}`;
    await this.sendInvitationEmail(dto.email, dto.name, inviterName, dto.planId, dto.role, acceptUrl);

    await this.addHistory(dto.planId, inviterId, inviterName, 'invitation',
      `${dto.email} invité comme ${dto.role}`);

    return member;
  }

  async getMembers(planId: string) {
    return this.memberModel.find({ planId }).sort({ createdAt: -1 });
  }

  async updateMemberRole(planId: string, memberId: string, role: MemberRole) {
    const member = await this.memberModel.findOneAndUpdate(
      { _id: memberId, planId },
      { role },
      { new: true },
    );
    if (!member) throw new NotFoundException('Membre introuvable');
    return member;
  }

  async removeMember(planId: string, memberId: string) {
    const result = await this.memberModel.findOneAndDelete({ _id: memberId, planId });
    if (!result) throw new NotFoundException('Membre introuvable');
    return { success: true };
  }

  async acceptInvitation(token: string) {
    const member = await this.memberModel.findOne({ inviteToken: token });
    if (!member) throw new NotFoundException('Invitation invalide ou expirée');
    if (member.status === MemberStatus.ACCEPTED) return { success: true, planId: member.planId, alreadyAccepted: true };

    member.status = MemberStatus.ACCEPTED;
    member.acceptedAt = new Date();
    await member.save();

    return { success: true, planId: member.planId };
  }

  // ─── Comments ────────────────────────────────────────────────────────────────

  async getComments(postId: string) {
    return this.commentModel.find({ postId }).sort({ createdAt: -1 });
  }

  async addComment(dto: AddCommentDto, authorId: string, authorName: string) {
    return this.commentModel.create({
      postId: dto.postId,
      planId: dto.planId,
      authorId,
      authorName,
      text: dto.text,
      action: dto.action,
    });
  }

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) throw new NotFoundException('Commentaire introuvable');
    if (comment.authorId !== userId) throw new ForbiddenException('Non autorisé');
    await comment.deleteOne();
    return { success: true };
  }

  // ─── History ─────────────────────────────────────────────────────────────────

  async getHistory(planId: string) {
    return this.historyModel.find({ planId }).sort({ createdAt: -1 });
  }

  async addHistory(planId: string, authorId: string, authorName: string, action: string, description: string) {
    return this.historyModel.create({ planId, authorId, authorName, action, description });
  }

  async addHistoryFromDto(planId: string, dto: AddHistoryDto, authorId: string, authorName: string) {
    return this.addHistory(planId, authorId, authorName, dto.action, dto.description);
  }

  // ─── Email ───────────────────────────────────────────────────────────────────

  private async sendInvitationEmail(
    to: string, recipientName: string, inviterName: string,
    planId: string, role: string, acceptUrl: string,
  ) {
    const roleLabels: Record<string, string> = {
      admin: 'Administrateur', editor: 'Éditeur', viewer: 'Lecteur',
    };
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6C63FF;">Invitation à collaborer sur IdeaSpark</h2>
        <p>Bonjour <strong>${recipientName}</strong>,</p>
        <p><strong>${inviterName}</strong> vous invite à rejoindre un plan sur IdeaSpark.</p>
        <p>Votre rôle : <strong>${roleLabels[role] || role}</strong></p>
        <a href="${acceptUrl}" style="display:inline-block;padding:12px 24px;background:#6C63FF;color:white;text-decoration:none;border-radius:8px;margin-top:16px;">
          Accepter l'invitation
        </a>
        <p style="color:#888;margin-top:24px;font-size:12px;">Si vous n'attendiez pas cette invitation, ignorez cet email.</p>
      </div>
    `;
    try {
      await this.mailService['transporter']?.sendMail({
        from: 'IdeaSpark <noreply@ideaspark.com>',
        to,
        subject: `Invitation à collaborer sur IdeaSpark`,
        html,
      });
    } catch {
      console.log(`[Collaboration] Invitation email to ${to}: ${acceptUrl}`);
    }
  }
}
