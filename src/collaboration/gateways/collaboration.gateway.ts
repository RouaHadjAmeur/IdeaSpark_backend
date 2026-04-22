import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CollaborationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CollaborationGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // Extract token from handshake auth or headers
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Connection attempt without token: ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;
      if (!userId) {
        this.logger.warn(`Invalid token payload: ${client.id}`);
        client.disconnect();
        return;
      }

      // Join a private room for this user
      const roomName = `user:${userId}`;
      await client.join(roomName);
      
      this.logger.log(`Client connected: ${client.id} (User: ${userId}) joined room ${roomName}`);
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Emit a notification to a specific user
   */
  emitNotification(userId: string, notification: any) {
    const roomName = `user:${userId}`;
    this.server.to(roomName).emit('notification', notification);
    this.logger.log(`Notification emitted to room ${roomName}`);
  }

  /**
   * Emit a general activity update to a project room
   */
  emitActivity(planId: string, activity: any) {
    const roomName = `plan:${planId}`;
    this.server.to(roomName).emit('activity', activity);
  }
}
