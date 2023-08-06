import {Injectable} from '@nestjs/common'
import {OnEvent} from '@nestjs/event-emitter'
import {QRCODE} from '../WhatsappConnection/WebhookStatus'

@Injectable()
export class WhatsappQrcodeService {
  constructor(private eventGateway: any) {}

  @OnEvent(QRCODE)
  onQrCode(data: any) {
    this.eventGateway.socket?.emit(
      `connectionService.getConnection.client.qr-${data?.session}`,
      {
        qrCode: data?.qrcode,
        session: data?.session,
      },
    )
  }
}
