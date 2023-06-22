import * as fs from 'fs'
import * as readline from 'readline'
import {google, Auth} from 'googleapis'
import {resolve} from 'path'
import express from 'express'
import opn from 'opn'

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']
const PORT = 3005
const REDIRECT_URL = `http://localhost:${PORT}`
const TOKEN_FILE_GMAIL = 'token_gmail.json'

async function authenticate(): Promise<Auth.OAuth2Client> {
  const CREDENTIALS_DEVELOPMENT = resolve(
    'secret_google_drive/client_secret_gmail_development.json',
  )
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

  if (fs.existsSync(TOKEN_FILE_GMAIL)) {
    const token = fs.readFileSync(TOKEN_FILE_GMAIL, 'utf8')
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

  // const app = express()
  // app.get('/', (req, res) => {
  //   const code = req.query.code as string
  //   res.send('Authentication successful. You can close this tab now.')
  //   exchangeCodeForToken(code, oAuth2Client)
  // })

  // const server = app.listen(PORT, () => {
  //   opn(authUrl)
  //   console.log('Authorize this app by visiting the following URL:')
  //   console.log(authUrl)
  //   console.log(`Listening on ${REDIRECT_URL}`)
  // })

  // return new Promise((resolve, reject) => {
  //   server.on('error', reject)
  //   server.on('close', () => {
  //     reject(new Error('Server closed before receiving authorization code.'))
  //   })
  // })

  return new Promise((resolve, reject) => {
    rl.question('Enter the code from that page here: ', async (code) => {
      rl.close()
      try {
        const {tokens} = await oAuth2Client.getToken(code)
        oAuth2Client.setCredentials(tokens)
        fs.writeFileSync(TOKEN_FILE_GMAIL, JSON.stringify(tokens))
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
    fs.writeFileSync(TOKEN_FILE_GMAIL, JSON.stringify(tokens))
    console.log('Token stored successfully.')
  } catch (error) {
    console.error('Error retrieving access token:', error)
  }
}

async function downloadAttachments(
  auth: Auth.OAuth2Client,
  message: any,
  destFolder: string,
) {
  const gmail = google.gmail({version: 'v1', auth})

  const attachments = message.payload.parts?.filter(
    (part: any) => part.filename && part.filename.endsWith('.pdf'),
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
          const fileBuffer = Buffer.from(fileData, 'base64')
          const filePath = `${destFolder}/${filename}`
          fs.writeFileSync(filePath, fileBuffer)
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

    const res = await gmail.users.messages.list({
      userId: 'me',
      q: 'has:attachment filename:pdf',
    })

    const messages = res.data.messages
    if (messages && messages.length > 0) {
      for (const message of messages) {
        const messageDetails = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        })

        await downloadAttachments(
          auth,
          messageDetails.data,
          'files_gmail_nubank',
        )
      }
    }
  } catch (error) {
    console.error('Error reading emails:', error)
  }
}
