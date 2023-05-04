import makeMASocket, {
  AnyMessageContent,
  delay,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeInMemoryStore,
  MessageRetryMap,
  useMultiFileAuthState,
} from '@adiwajshing/baileys'
import { Boom } from '@hapi/boom'
import { Injectable, Logger } from '@nestjs/common'
// import { InitAuthDocument, InitAuthCreds } from '../../Mongodb/Schema/InitAuthCreds/initAuthCreds.schema'
import MAIN_LOGGER from '@adiwajshing/baileys/lib/Utils/logger'

@Injectable()
export class ConnectionService {

  private static instance: ConnectionService
  private collection: any
  private log = new Logger()
  // constructor(@InjectModel('InitAuthCreds') private readonly initAuthModel?: Model<initAuthCredsModel>) {}
  
  public static getInstance(): ConnectionService {
    if (!ConnectionService.instance) {
      ConnectionService.instance = new ConnectionService()
    }
    return ConnectionService.instance
  }
  
  public async getConnection(cpf: string) {
    const logger = MAIN_LOGGER.child({})
    const msgRetryCounterMap: MessageRetryMap = {}

    const { state, saveCreds } = await useMultiFileAuthState(
      `${cpf}-baileys_store_session`,
    )

    const { version, isLatest } = await fetchLatestBaileysVersion()
    
    console.log(`using WA ${version.join('.')}`, `isLatest: ${isLatest}`)
    let socket: any  
    try {
      socket = makeMASocket({
        version,
        logger: logger,
        printQRInTerminal: true,
        auth: state,
        msgRetryCounterMap: msgRetryCounterMap,
      })

      socket.ev.process(
        async (events) => {
          if (events['connection.update']) {
            const update = events['connection.update']
            const { connection, lastDisconnect, qr } = update
            if (connection === 'close') {
              const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut
              if (shouldReconnect) {
                await new ConnectionService().getConnection(cpf)
              } else {
                console.log('Connection closed. You are logged out.')
              }
            }
            if (qr) {
              console.log('QRCode:', qr)
            }
          }
          if (events['creds.update']) {
            await saveCreds()
          }
        }
      )
    } catch (error) {
      await new ConnectionService().getConnection(cpf)
    }

    // socket.ev.on('connection.update', async (update) => {
    //   const { connection, lastDisconnect, isOnline, legacy, qr } = update

    //   if (connection === 'close') {
    //     const shouldReconnect =
    //       (lastDisconnect?.error as Boom)?.output?.statusCode !==
    //       DisconnectReason.loggedOut
    //     if (shouldReconnect) {
    //       console.log({ shouldReconnect, connection, lastDisconnect })
    //       await new ConnectionService().getConnection(cpf)
    //     }
    //   } else if (connection === 'open') {
    //     console.log('opened connection', { connection })
    //   }
    // })

    // socket.ev.on('creds.update', saveCreds)
    return socket
  }
}
