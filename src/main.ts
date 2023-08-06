import {Logger, ValidationPipe} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './app.module'
import {json} from 'body-parser'
import {Server} from 'socket.io'
import * as os from 'os'
// import {SocketIOAdapter} from './Socket/socket.io.adapter'
// import * as cors from 'cors'
import {SocketService} from './Socket/socket.service'
import {promisify} from 'util'
import axios from 'axios'
import * as fs from 'fs'
import {isDevelopmentEnvironment} from './Common/Functions'

const writeFileAsync = promisify(fs.writeFile)

async function getLocalIP(logger: Logger) {
  const interfaces = os.networkInterfaces()
  for (const interfaceName in interfaces) {
    const interfaceData = interfaces[interfaceName]
    for (const info of interfaceData) {
      if (
        info.family === 'IPv4' &&
        !info.internal &&
        info.address !== '127.0.0.1'
      ) {
        return info.address
      }
    }
  }

  logger.error(
    'Could not be able do get local ip address. Please restart the server',
  )
  return null
}

async function getPublicIP(logger: Logger) {
  try {
    logger.warn('Searching public IP address, please wait...')
    const response = await axios.get('https://api.ipify.org?format=json')
    return response.data.ip
  } catch (error) {
    logger.error(
      'An error occurred when try to search public ip address. trying again...',
    )
    await getPublicIP(logger)
  }
}

async function bootstrap() {
  const PORT = process.env.PORT || 3005
  const logger = new Logger()
  const app = await NestFactory.create(AppModule)
  let publicIP = ''
  if (!isDevelopmentEnvironment()) {
    publicIP = await getPublicIP(logger)
    if (publicIP) {
      const ipData = {ip: publicIP}
      await writeFileAsync('ip.json', JSON.stringify(ipData))
      logger.debug(`Public IP address: ${publicIP}`)
      // setInterval(() => {
      //   io.emit('ip-address', ipData)
      //   /** Send to front end IP address updated */
      // }, 1000)
    } else {
      logger.error(
        'Could not be able to get public ip address. Please restart the server.',
      )
    }
  } else {
    publicIP = await getLocalIP(logger)
    if (publicIP) {
      const ipData = {ip: publicIP}
      await writeFileAsync('ip.json', JSON.stringify(ipData))
      // setInterval(() => {
      //   io.emit('ip-address', ipData)
      //   /** Send to front end IP address updated */
      // }, 1000)
      logger.debug(`Local environmnet development IP address: ${publicIP}`)
    }
  }

  publicIP = await getPublicIP(logger)
  const io = new Server(app.getHttpServer(), {
    cors: {
      origin: [
        'http://localhost:3000',
        'https://solution-os.vercel.app',
        publicIP ? `http://${publicIP}:3000` : undefined,
        publicIP ? `http://${publicIP}:8080` : undefined,
      ], // Adicione a origem do seu frontend aqui
      methods: ['*'], // Adicione os métodos permitidos
      allowedHeaders: ['Content-Type'], // Adicione os cabeçalhos permitidos
    },
  })
  const socketService = app.get(SocketService)
  socketService.setIo(io)

  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true}))
  app.use(json({limit: '50mb'}))
  //app.useWebSocketAdapter(new SocketIOAdapter())
  await app.listen(PORT)
  logger.warn(`Server running on port: ${PORT}`)
}

bootstrap()
