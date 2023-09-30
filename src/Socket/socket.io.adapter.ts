import {IoAdapter} from '@nestjs/platform-socket.io'

export class CustomIoAdapter extends IoAdapter {
  constructor(private readonly server: any) {
    super(server)
  }

  // Método para enviar uma mensagem para um cliente específico
  sendToClient(clientId: string, event: string, data: any) {
    this.server.to(clientId).emit(event, data)
  }

  // Outros métodos personalizados conforme necessário
}
