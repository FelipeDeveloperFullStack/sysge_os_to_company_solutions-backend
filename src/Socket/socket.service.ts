import {Injectable} from '@nestjs/common'
import {Server, Socket} from 'socket.io'

@Injectable()
export class SocketService {
  private io: Server

  setIo(io: Server) {
    this.io = io
  }

  getIo(): Server {
    return this.io
  }
}
