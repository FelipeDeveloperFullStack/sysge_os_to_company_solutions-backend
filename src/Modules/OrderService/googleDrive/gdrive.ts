import * as fs from 'fs'
import {google} from 'googleapis'
import {authorizeToken} from './gdrive-auth'
import crypto from 'crypto'

/**
 * @param {String} folderName // Folder Name
 * @param {String} parents    // ID of the folder parents
 */
export const createFolder = async ({folderName, parents}): Promise<any> => {
  const auth = await authorizeToken()
  const drive = google.drive({version: 'v3', auth})
  const fileMetadata = {
    name: folderName,
    parents: [parents],
    mimeType: 'application/vnd.google-apps.folder',
  }
  const response = await drive.files.create({
    requestBody: fileMetadata,
    supportsAllDrives: true,
    fields: 'id',
  })
  return response
}

/**
 * Upload file type PNG
 * @param fileName Nome do arquivo
 * @param filePath Caminho do arquivo
 * @param parents ID da pasta que o arquivo será salvo no Google Drive
 */
export const uploadFile = async ({fileName, filePath, parents}) => {
  const auth = await authorizeToken()

  const drive = google.drive({version: 'v3', auth})

  try {
    const res = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [parents],
      },
      media: {
        mimeType: 'application/pdf',
        body: fs.createReadStream(filePath),
      },
      supportsAllDrives: true,
    })
    return res.data
  } catch (error) {
    console.log(error)
  }
}

export const moveFile = async ({fileId, newParents, removeParents}) => {
  const auth = await authorizeToken()

  const drive = google.drive({version: 'v3', auth})

  try {
    const res = await drive.files.update({
      fileId: fileId,
      addParents: newParents,
      removeParents,
      supportsAllDrives: true,
    })

    return res.data
  } catch (error) {
    console.log(error)
  }
}

/**
 * Listar nome dos arquivos
 * @param parents ID da pasta que será listada
 */
export const list = async ({parents}) => {
  try {
    const auth = await authorizeToken()

    const drive = google.drive({version: 'v3', auth})

    const temp = await drive.files.list({
      q: `'${parents}' in parents and trashed = false`, // lista os ultimos arquivos
      orderBy: 'name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
    })

    return temp.data
  } catch (error) {
    console.log(error)
  }
}

/**
 * Listar nome dos arquivos
 * @param parents ID da pasta que será listada
 */
export const listFolder = async ({parents}) => {
  try {
    const auth = await authorizeToken()

    const drive = google.drive({version: 'v3', auth})

    const temp = await drive.files.list({
      q: `'${parents}' in parents and trashed = false and mimeType = 'application/vnd.google-apps.folder'`, // List only folders
      orderBy: 'name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true,
      fields: 'nextPageToken, files(id, name)',
    })

    return temp.data
  } catch (error) {
    throw error
  }
}

/**
 * Apaga diretamente. NÃO VAI PRA LIXEIRA.
 * @param fileId ID da pasta ou arquivo que será apagado
 */
export const destroy = async ({fileId}) => {
  const auth = await authorizeToken()
  const drive = google.drive({version: 'v3', auth})
  await drive.files.delete({fileId, supportsAllDrives: true})
}

/**
 * @param fileId ID do arquivo
 */
export const getFileNameByFileId = async ({fileId}) => {
  const auth = await authorizeToken()
  const drive = google.drive({version: 'v3', auth})
  return await drive.files.get({fileId, supportsAllDrives: true})
}

export const about = async () => {
  try {
    const auth = await authorizeToken()
    const drive = google.drive({version: 'v3', auth})
    // const temp = await drive.about.get({ fields: '*' })
    const temp = await drive.about.get({fields: 'user'})
    return temp.data
  } catch (error) {
    console.log(error)
  }
}
