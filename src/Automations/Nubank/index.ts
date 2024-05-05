import {format, subDays} from 'date-fns'
import * as fs from 'fs'
import {Auth, google} from 'googleapis'
import * as path from 'path'
import * as readline from 'readline'
import {isDevelopmentEnvironment} from 'src/Common/Functions'

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
const PORT = process.env.PORT
const REDIRECT_URL = `http://localhost:${PORT}`
const getTokenGmailFile = () => {
  return isDevelopmentEnvironment()
    ? 'token_gmail.json'
    : 'token_gmail_production.json'
}

async function authenticate(): Promise<Auth.OAuth2Client> {
  const CREDENTIALS_DEVELOPMENT = isDevelopmentEnvironment()
    ? path.resolve('secret_google_drive/client_secret_gmail_development.json')
    : path.resolve('secret_google_drive/client_secret_gmail_production.json')

  const credentials = JSON.parse(
    fs.readFileSync(CREDENTIALS_DEVELOPMENT).toString(),
  )
  //const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'))

  const {client_id, client_secret, redirect_uris} = credentials.web

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  )

  if (fs.existsSync(getTokenGmailFile())) {
    const token = fs.readFileSync(getTokenGmailFile(), 'utf8')
    oAuth2Client.setCredentials(JSON.parse(token))
    return oAuth2Client
  } else {
    return getNewToken(oAuth2Client)
  }
}

async function getNewToken(
  oAuth2Client: Auth.OAuth2Client,
): Promise<Auth.OAuth2Client> {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })

  console.log('Authorize this app by visiting the following URL:')
  console.log(authUrl)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', async (code) => {
      rl.close()
      try {
        const {tokens} = await oAuth2Client.getToken(code)
        oAuth2Client.setCredentials(tokens)
        fs.writeFileSync(getTokenGmailFile(), JSON.stringify(tokens))
        console.log('Token stored successfully.')
        resolve(oAuth2Client)
      } catch (error) {
        console.error('Error retrieving access token:', error)
        reject(error)
      }
    })
  })
}

async function exchangeCodeForToken(
  code: string,
  oAuth2Client: Auth.OAuth2Client,
) {
  try {
    const {tokens} = await oAuth2Client.getToken(code)
    oAuth2Client.setCredentials(tokens)
    fs.writeFileSync(getTokenGmailFile(), JSON.stringify(tokens))
    console.log('Token stored successfully.')
  } catch (error) {
    console.error('Error retrieving access token:', error)
  }
}

async function downloadAttachments(auth: Auth.OAuth2Client, message: any) {
  const gmail = google.gmail({version: 'v1', auth})

  const attachments = message.payload.parts?.filter(
    (part: any) => part.filename && part.filename.endsWith('.csv'),
  )

  if (attachments && attachments.length > 0) {
    for (const attachment of attachments) {
      const attachmentId = attachment.body?.attachmentId
      if (attachmentId) {
        const response = await gmail.users.messages.attachments.get({
          userId: 'me',
          messageId: message.id,
          id: attachmentId,
        })

        const data = response.data
        const fileData = data.data
        const filename = attachment.filename

        if (fileData) {
          //const fileBuffer = Buffer.from(fileData, 'base64')
          // const filePath = `${destFolder}/${filename}`
          const folderPath = path.join('dist', 'Modules', 'files_gmail_nubank')
          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath)
          }
          const filePath = path.join(
            'dist',
            'Modules',
            'files_gmail_nubank',
            filename,
          )
          const csvFile = fileData.split(';base64,').pop()
          new Promise<void>((resolve, reject) => {
            fs.writeFile(filePath, csvFile, {encoding: 'base64'}, (err) => {
              if (err) {
                reject(err)
              } else {
                resolve()
              }
            })
          })
          //fs.writeFileSync(folderPath, fileBuffer)
          console.log(`Attachment saved: ${filePath}`)
        }
      }
    }
  }
}

export const readEmailsWithAttachments = async () => {
  try {
    const auth = await authenticate()

    const gmail = google.gmail({version: 'v1', auth})

    // Get the current date
    //const yesterday = subDays(new Date(), 0)
    //const currentDate = format(yesterday, 'yyyy/MM/dd')
    //const currentDate = new Date().toISOString().split('T')[0]
    //const currentDate = format(new Date(), 'yyyy-MM-dd') // Obtém a data atual no formato 'YYYY-MM-DD'

    const twoDaysAgo = subDays(new Date(), 5)
    const twoDaysAgoFormatted = format(twoDaysAgo, 'yyyy-MM-dd') // Obtém a data de 5 dias atrás no formato 'YYYY-MM-DD'

    let res = null
    if (!isDevelopmentEnvironment) {
      res = await gmail.users.messages.list({
        userId: 'me',
        q: `after:${twoDaysAgoFormatted} has:attachment from:todomundo@nubank.com.br filename:csv`,
        maxResults: 1,
      })
    } else {
      res = await gmail.users.messages.list({
        userId: 'me',
        q: `after:${twoDaysAgoFormatted} has:attachment from:solution.financeiro2012@gmail.com filename:csv`,
        maxResults: 1,
      })
    }
    console.log({res})
    let messages = null
    // Verificar se há mensagens correspondentes
    if (res.data.messages && res.data.messages.length > 0) {
      // Ordenar as mensagens pelo horário de recebimento (do mais recente ao mais antigo)
      res.data.messages.sort((a, b) => {
        return b.internalDate - a.internalDate
      })

      // Pegar a mensagem mais recente com anexo
      const messageId = res.data.messages[0].id
      messages = res.data.messages
      // Agora você tem o ID da mensagem mais recente com anexo que corresponde à sua consulta
      // Use o messageId para obter o conteúdo da mensagem, se necessário
      console.log('Mensagem mais recente com anexo:', messageId)
    } else {
      console.log('Nenhuma mensagem correspondente encontrada.')
      messages = res.data.messages
    }

    if (messages && messages.length > 0) {
      for (const message of messages) {
        const messageDetails = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        })
        await downloadAttachments(auth, messageDetails.data)

        // Mark the message as read
        // await gmail.users.messages.modify({
        //   userId: 'me',
        //   id: message.id,
        //   requestBody: {
        //     removeLabelIds: ['UNREAD'],
        //   },
        // })
      }
    }
    if (!messages && !messages?.length) {
      console.log('[SISTEMA] - Nenhum extrato encontrado.')
    }
  } catch (error) {
    console.error('Error reading emails:', error)
  }
}
