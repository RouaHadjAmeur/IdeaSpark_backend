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
import { MessageService } from './message.service';
import { CreateMessageDto } from './dto/create-message.dto';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/chat',
})
export class MessageGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>();

  constructor(private readonly messageService: MessageService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedUsers.set(userId, client.id);
      console.log(`User ${userId} connecté au WebSocket chat`);
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.forEach((socketId, userId) => {
      if (socketId === client.id) {
        this.connectedUsers.delete(userId);
        console.log(`User ${userId} déconnecté du WebSocket chat`);
      }
    });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const senderId = client.handshake.query.userId as string;
    if (!senderId) return;

    const savedMessage = await this.messageService.create(createMessageDto, senderId);

    const receiverSocketId = this.connectedUsers.get(createMessageDto.receiver);

    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('newMessage', savedMessage);
    }

    client.emit('messageSent', savedMessage);
    return savedMessage;
  }

  @SubscribeMessage('typing')
  handleTyping(@MessageBody() data: { receiverId: string; senderId: string }) {
    const receiverSocketId = this.connectedUsers.get(data.receiverId);
    if (receiverSocketId) {
      this.server.to(receiverSocketId).emit('userTyping', {
        senderId: data.senderId,
      });
    }
  }
}
