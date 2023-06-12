import {HttpException, HttpStatus} from '@nestjs/common'
import {listFolder} from './gdrive'

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
          }
          if (status === 'PENDENTE') {
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
