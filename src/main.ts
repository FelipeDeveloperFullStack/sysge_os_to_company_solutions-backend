import {Logger, ValidationPipe} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './app.module'
import {json} from 'body-parser'
import {Server} from 'socket.io'
import {SocketIOAdapter} from './Socket/socket.io.adapter'
import {SocketService} from './Socket/socket.service'
import * as cors from 'cors'

async function bootstrap() {
  const PORT = process.env.PORT || 3005
  const logger = new Logger()
  const app = await NestFactory.create(AppModule)
  //app.use(cors())
  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true}))
  app.use(json({limit: '50mb'}))
  //app.useWebSocketAdapter(new SocketIOAdapter())
  const io = new Server(app.getHttpServer(), {
    cors: {
      origin: 'http://localhost:3000', // Adicione a origem do seu frontend aqui
      methods: ['*'], // Adicione os métodos permitidos
      allowedHeaders: ['Content-Type'], // Adicione os cabeçalhos permitidos
    },
  })
  const socketService = app.get(SocketService)
  socketService.setIo(io)
  await app.listen(PORT)
  logger.warn(`Server running on port: ${PORT}`)
}

bootstrap()
