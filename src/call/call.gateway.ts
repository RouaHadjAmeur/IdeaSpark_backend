import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MessageService } from '../message/message.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/call',
})
export class CallGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(private readonly messageService: MessageService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      console.log(`User ${userId} connecté au WebSocket CALL (${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socketId] of this.connectedUsers.entries()) {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} déconnecté du WebSocket CALL`);
        break;
      }
    }
  }

  @SubscribeMessage('initCall')
  async handleInitCall(
    @MessageBody() data: { callerId: string; receiverId: string; callerName: string; type?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    
    // Save call trace in MongoDB
    const callType = data.type === 'video' ? 'call_video' : 'call_audio';
    try {
      await this.messageService.create({
        content: data.type === 'video' ? 'Appel vidéo' : 'Appel vocal',
        receiver: data.receiverId,
        messageType: callType as any,
      }, data.callerId);
      console.log(`Trace d'appel (${callType}) enregistrée pour ${data.callerId} -> ${data.receiverId}`);
    } catch (e) {
      console.error(`Erreur lors de l'enregistrement de la trace d'appel: ${e.message}`);
    }

    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('incomingCall', {
        callerId: data.callerId,
        callerName: data.callerName,
        type: data.type || 'audio',
      });
    }
  }

  @SubscribeMessage('offer')
  handleOffer(
    @MessageBody() data: { sdp: any; receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('offer', {
        sdp: data.sdp,
        callerId: Array.from(this.connectedUsers.entries()).find(([_, id]) => id === client.id)?.[0],
      });
    }
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @MessageBody() data: { sdp: any; callerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const callerSocketId = this.connectedUsers.get(data.callerId);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('answer', {
        sdp: data.sdp,
      });
    }
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @MessageBody() data: { candidate: any; receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('ice-candidate', {
        candidate: data.candidate,
      });
    }
  }

  @SubscribeMessage('endCall')
  handleEndCall(
    @MessageBody() data: { receiverId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('callEnded');
    }
  }

  @SubscribeMessage('rejectCall')
  handleRejectCall(
    @MessageBody() data: { callerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const callerSocketId = this.connectedUsers.get(data.callerId);
    if (callerSocketId) {
      this.server.to(callerSocketId).emit('callRejected');
    }
  }
}
