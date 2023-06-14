import {HttpException, HttpStatus} from '@nestjs/common'
import {
  listFolder,
  createFolder as createDirectory,
  list,
  uploadFile as upload,
  destroy,
  moveFile,
} from './gdrive'
import * as fs from 'fs'
import * as path from 'path'

const uploadFile = async (
  idFolder: string,
  fileName: string,
  status: string,
) => {
  try {
    const result = await list({parents: idFolder})
    const filePath = path.join(__dirname, '..', 'pdfs', fileName)

    const resultFilderFileName = result.files.filter(
      (file) => file.name === `${fileName}.pdf`,
    )
    if (!resultFilderFileName.length) {
      /** Quando não encontrar o arquivo */
      /** Fazer o upload do arquivo */
      console.log(
        `[Sistema] - Fazendo o upload do arquivo ${fileName} no Google drive...`,
      )
      await upload({
        fileName: `${fileName}.pdf`,
        filePath: `${filePath}.pdf`,
        parents: idFolder,
      })
    } else {
      /** Quando encontrar o arquivo */
      /** Excluir o arquivo e fazer o upload do novo arquivo */
      const {id} = resultFilderFileName[0]
      await destroy({fileId: id})
      console.log(
        `[Sistema] - Fazendo o upload do arquivo ${fileName} no Google drive...`,
      )
      await upload({
        fileName: `${fileName}.pdf`,
        filePath: `${filePath}.pdf`,
        parents: idFolder,
      })
    }
  } catch (error) {
    console.log(error)
    throw new HttpException(
      {
        message: error,
      },
      HttpStatus.EXPECTATION_FAILED,
    )
  }
}

const createFolder = async (
  idFolder: string,
  folderName: string,
  filename: string,
  status: string,
) => {
  try {
    const result = await listFolder({
      parents: idFolder,
    })
    const resultFolderOSPagas = result.files.filter(
      (folder) => folder.name === folderName,
    )
    /** Se a pasta não existir */
    if (!resultFolderOSPagas.length) {
      /** Cria a pasta */
      const {data} = await createDirectory({
        folderName,
        parents: idFolder,
      })
      const id = data?.id
      /** Faz upload do arquivo dentro da pasta */
      await uploadFile(id, filename, status)
    } else {
      const {id} = resultFolderOSPagas[0]
      /** Faz upload do arquivo dentro da pasta */
      await uploadFile(id, filename, status)
    }
  } catch (error) {
    console.log(error)
    throw new HttpException(
      {
        message: error,
      },
      HttpStatus.EXPECTATION_FAILED,
    )
  }
}

export const moveFileFolderClientByStatus = async (
  clientName: string,
  status: string,
  typeDocument: string,
  filename: string,
) => {
  const ID_FOLDER_MAIN = process.env.ID_FOLDER_MAIN_GOOGLE_DRIVE

  try {
    console.log('[Sistema] - Verificando se a pasta CLIENTES já existe...')
    const listResult = await listFolder({
      parents: ID_FOLDER_MAIN,
    })
    if (listResult.files.length) {
      /** Quando existir a pasta CLIENTES */
      const resultFilterFoldersName = listResult.files.filter(
        (folder) => folder.name === 'CLIENTES',
      )
      console.log({resultFilterFoldersName})
      if (resultFilterFoldersName.length) {
        const {id} = resultFilterFoldersName[0]
        const result = await listFolder({
          parents: id,
        })
        console.log(
          `[Sistema] - Verificando se a pasta do cliente ${clientName} já existe...`,
        )
        const resultFolderClients = result.files.filter(
          (folder) => folder.name?.trim() === clientName?.trim(),
        )
        console.log({resultFolderClients})
        if (resultFolderClients.length) {
          if (typeDocument === 'ORCAMENTO') {
            console.log({typeDocument})
          }
          if (status === 'PAGO') {
            console.log({status})
            // await createFolder(
            //   resultFolderClients[0].id,
            //   'O.S PENDENTES',
            //   filename,
            //   status,
            // )
            await moveFile({
              fileId: '1weaxbdYyseCpSHl1N4aGCLPOL9WWWwtK',
              newParents: '1Q3Nwf-x5K7aeiHfJy0ipoIUFz1NgtSvh',
              removeParents: '1UsIhZjirJ7ijDSXOxvQG8Tx7ua7n_O2Q',
            })
            //await this.deleteFileByStatusFolder('O.S PAGAS', idFolder, filename)
          }
          if (status === 'PENDENTE') {
            /** Enviar para a pasta de OS PAGOS */
            // await createFolder(
            //   resultFolderClients[0].id,
            //   'O.S PAGAS',
            //   filename,
            //   status,
            // )
            // await this.deleteFileByStatusFolder('O.S PAGAS', idFolder, filename)
            await moveFile({
              fileId: '1weaxbdYyseCpSHl1N4aGCLPOL9WWWwtK',
              newParents: '1Q3Nwf-x5K7aeiHfJy0ipoIUFz1NgtSvh',
              removeParents: '1UsIhZjirJ7ijDSXOxvQG8Tx7ua7n_O2Q',
            })
            console.log({status})
          }
        }
      }
    }
  } catch (error) {
    console.log(error)
    throw new HttpException(
      {
        message: error,
      },
      HttpStatus.EXPECTATION_FAILED,
    )
  }
}
