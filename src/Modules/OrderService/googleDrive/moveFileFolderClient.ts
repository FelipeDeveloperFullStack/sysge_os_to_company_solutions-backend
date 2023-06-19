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

export const moveFileGoogleDrive = async (
  fileId: string,
  newParents: string[],
  removeParents: string[],
) => {
  try {
    console.log('[Sistema] - Movendo o arquivo de pasta no Google Drive...')
    await moveFile({
      fileId,
      newParents,
      removeParents,
    })
    console.log(`[Sistema] - Procedimento finalizado com sucesso.`)
    console.log(`✅-----------------------------------✅`)
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
