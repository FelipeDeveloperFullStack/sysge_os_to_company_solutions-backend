import {Logger, ValidationPipe} from '@nestjs/common'
import {NestFactory} from '@nestjs/core'
import {AppModule} from './app.module'
import {json} from 'body-parser'

async function bootstrap() {
  const PORT = process.env.PORT || 3005
  const logger = new Logger()
  const app = await NestFactory.create(AppModule)

  app.enableCors()
  app.useGlobalPipes(new ValidationPipe({whitelist: true, transform: true}))
  app.use(json({limit: '50mb'}))
  await app.listen(PORT)
  logger.warn(`Server running on port: ${PORT}`)
}

bootstrap()
