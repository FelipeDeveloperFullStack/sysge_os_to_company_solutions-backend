const fs = require('fs')
const readline = require('readline')
const {google} = require('googleapis')
const {resolve} = require('path')
import {JWT} from 'google-auth-library'
import open from 'open'
import url from 'url'
import destroyer from 'server-destroy'
import http from 'http'
import {isDevelopmentEnvironment} from 'src/Common/Functions'

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive']
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = resolve('secret_google_drive/token.json')
//const CREDENTIALS = resolve('secret_google_drive/credentials.json')

const CREDENTIALS = resolve('secret_google_drive/credentials.json')

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(callback) {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS).toString())
  const {client_secret, client_id, redirect_uris} = credentials.web
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0],
  )

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback)
    oAuth2Client.setCredentials(JSON.parse(token))
    callback(oAuth2Client)
  })
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getAccessToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  })
  console.log('Authorize this app by visiting this url:', authUrl)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close()
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err)
      oAuth2Client.setCredentials(token)
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err)
        console.log('Token stored to', TOKEN_PATH)
      })
      callback(oAuth2Client)
    })
  })
}

export const authorizeToken_ = async (): Promise<any> => {
  // Load client secrets from a local file.
  let credentials = null
  if (isDevelopmentEnvironment()) {
    // Development Environment
    const CREDENTIALS_DEVELOPMENT = resolve(
      'secret_google_drive/credentials_conta_felipe.json',
    )
    credentials = JSON.parse(
      fs.readFileSync(CREDENTIALS_DEVELOPMENT).toString(),
    )
  } else {
    // Prodution environment
    credentials = JSON.parse(fs.readFileSync(CREDENTIALS).toString())
  }
  // Configuração do JWT
  const auth = new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: SCOPES,
  })
  // await jwtClient.authorize()
  // const drive = google.drive({version: 'v3', auth})
  // drive.files.list({}, (err, res) => {
  //   if (err) throw err
  //   const files = res.data.files
  //   if (files.length) {
  //     files.map((file) => {
  //       console.log(file)
  //     })
  //   } else {
  //     console.log('No files found')
  //   }
  // })
  return auth
  // Gera o token de acesso
  // const authorizeToken = async () => {
  //   return jwtClient
  // }

  // Usa o token para chamar a API do Google Drive
  // const drive = google.drive({
  //   version: 'v3',
  //   auth: await authorizeToken(),
  // })

  // Authorize a client with credentials, then call the Google Drive API.
  // const oAuth2Client = new google.auth.OAuth2(
  //   client_id,
  //   client_secret,
  //   redirect_uris[0],
  // )

  // try {
  //   // Check if we have previously stored a token.
  //   const token = JSON.parse(fs.readFileSync(TOKEN_PATH))
  //   await oAuth2Client.setCredentials(token)
  //   return oAuth2Client
  // } catch (error) {
  //   if (error) return await getAccessToken(oAuth2Client, null)
  // }
}

export const authorizeToken = async () => {
  let credentials = null
  if (isDevelopmentEnvironment()) {
    credentials = resolve('secret_google_drive/credentials_conta_felipe.json')
  } else {
    credentials = CREDENTIALS
  }
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentials,
      scopes: ['https://www.googleapis.com/auth/drive'],
    })
    return auth
  } catch (error) {}
}
