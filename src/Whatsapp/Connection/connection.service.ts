import {Injectable, Logger} from '@nestjs/common'
// import * as QrCodeTerminal from 'qrcode-terminal'
import {Client, LocalAuth} from 'whatsapp-web.js'
import EventsGateway from '../Events/events.gateway'
import {Session} from '../Types'

@Injectable()
export class ConnectionService {
  private sessions: Session[] = []
  private logger = new Logger()
  public client: Session

  public waitReadingQRCode: boolean = false

  private static instance: ConnectionService

  public getInstance(cpf: string): Session {
    if (!this.client) {
      this.client = new Client({
        authStrategy: new LocalAuth({clientId: cpf}),
        puppeteer: {
          args: ['--no-sandbox'],
        },
      })
    }
    this.client.initialize()
    return this.client
  }

  constructor(private eventGateway?: EventsGateway) {}

  public async getConnection(cpf: string | any) {
    // this.client = new Client({
    //   authStrategy: new LocalAuth({clientId: cpf}),
    //   puppeteer: {
    //     args: ['--no-sandbox'],
    //   },
    // })

    this.client = this.getInstance(cpf)

    if (cpf === 'disconnected') {
      this.logger.debug('Connection canceled')
      await this.client.destroy()
    }

    this.client.on('loading_screen', (percent, message) => {
      this.logger.log('LOADING SCREEN', percent, message)
    })

    this.client.on('qr', (qr) => {
      // QrCodeTerminal.generate(qr, {small: true})
      this.eventGateway.socket.emit(
        'connectionService.getConnection.client.qr',
        {status: 'qrCodeGenerated'},
      )
      this.eventGateway.socket.emit(
        'connectionService.getConnection.client.qr',
        {qrCode: qr},
      )
    })

    this.client.on('authenticated', (session) => {
      this.logger.log(`Session: ${cpf} AUTHENTICATED`)
      this.eventGateway.socket.emit(
        'connectionService.getConnection.client.authenticated',
        {status: 'authenticated'},
      )
    })

    this.client.on('auth_failure', (message) => {
      this.logger.error(
        `Session: ${cpf} AUTHENTICATION FAILURE! Reason: ${message}`,
      )
      this.eventGateway.socket.emit(
        'connectionService.getConnection.client.auth_failure',
        {status: 'auth_failure'},
      )
    })

    this.client.on('ready', async () => {
      this.logger.debug(`Session: ${cpf} READY`)
      this.eventGateway.socket.emit(
        'connectionService.getConnection.client.ready',
        {
          status: 'ready',
          info: {
            name: this.client.info.pushname,
            number: this.client.info.wid._serialized,
          },
          sessionState: await this.client.getState(),
        },
      )
    })

    this.client.on('disconnected', (reason) => {
      this.logger.log(`Session: ${cpf} DISCONNECTED, reason: ${reason}`)
      this.eventGateway.socket.emit(
        'connectionService.getConnection.client.disconnected',
        {status: 'disconnected'},
      )
    })

    this.client.on('change_battery', (batteryInfo) => {
      const {battery, plugged} = batteryInfo
      this.logger.log(
        `Battery session: ${cpf} ${battery}% - Charging? ${plugged}`,
      )
      this.eventGateway.socket.emit(
        'connectionService.getConnection.client.change_battery',
        {status: `${battery}% - Charging? ${plugged}`},
      )
    })

    this.client.on('change_state', (newState) => {
      this.logger.log(`Battery session: ${cpf}, ${newState}`)
      this.eventGateway.socket.emit(
        'connectionService.getConnection.client.battery.change_state',
        {status: `${newState}`},
      )
    })

    return this.client
  }

  private async syncUnreadMessages(wbot: Session) {
    const chats = await wbot.getChats()

    /* eslint-disable no-restricted-syntax */
    /* eslint-disable no-await-in-loop */
    for (const chat of chats) {
      if (chat.unreadCount > 0) {
        const unreadMessages = await chat.fetchMessages({
          limit: chat.unreadCount,
        })

        for (const msg of unreadMessages) {
          // await handleMessage(msg, wbot);
          console.log({msg, wbot})
        }

        await chat.sendSeen()
      }
    }
  }
}
