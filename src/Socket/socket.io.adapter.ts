import {IoAdapter} from '@nestjs/platform-socket.io'
import * as socketio from 'socket.io'

export class SocketIOAdapter extends IoAdapter {
  private static io: socketio.Server

  createIOServer(
    port: number,
    options?: socketio.ServerOptions,
  ): socketio.Server {
    if (!SocketIOAdapter.io) {
      SocketIOAdapter.io = super.createIOServer(port, options)
    }
    return SocketIOAdapter.io
  }
}
