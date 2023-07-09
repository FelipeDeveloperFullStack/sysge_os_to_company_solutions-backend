import {PDFDocument} from 'pdf-lib'
import {promises as fs} from 'fs'
import * as path from 'path'
import {Logger} from '@nestjs/common'

export const countAndDeletePDFs = async (
  length: number,
  clientName: string,
  folderPath: string,
): Promise<boolean> => {
  let foundPDFs = 0

  while (foundPDFs !== length) {
    const files = await fs.readdir(folderPath)

    for (const file of files) {
      const filePath = path.join(folderPath, file)
      const stat = await fs.stat(filePath)

      if (
        stat.isFile() &&
        path.extname(file).toLowerCase() === '.pdf' &&
        file.includes(clientName)
      ) {
        foundPDFs++
      }
    }

    if (foundPDFs === length) {
      return true
    }
  }
}

export const deleteAllFilesInFolder = async (
  folderPath: string,
  clientName: string,
): Promise<void> => {
  const files = await fs.readdir(folderPath)
  const logger = new Logger()

  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const stat = await fs.stat(filePath)
    if (
      stat.isFile() &&
      path.extname(file).toLowerCase() === '.pdf' &&
      file.includes(clientName)
    ) {
      await fs.unlink(filePath)
    }
  }

  logger.log('[Sistema] - All files deleted successfull')
}

export const deleteMergedPDFs = async (folderPath: string): Promise<void> => {
  const files = await fs.readdir(folderPath)
  const logger = new Logger()

  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const stat = await fs.stat(filePath)

    if (
      stat.isFile() &&
      path.extname(file).toLowerCase() === '.pdf' &&
      file.includes('UNIFICADO')
    ) {
      await fs.unlink(filePath)
      logger.log(`[Sistema] - Deleted file: ${file}`)
    }
  }

  logger.log('[Sistema] - Deletion completed.')
}

const mergePDFs = async (
  pdfPathFilesWithExtention: string[],
  outputFileName: string,
  folderPath: string,
): Promise<void> => {
  const pdfDoc = await PDFDocument.create()
  const logger = new Logger()

  for (const pdfFile of pdfPathFilesWithExtention) {
    const pdfContent = await fs.readFile(pdfFile)
    const pdf = await PDFDocument.load(pdfContent)
    const pageCount = pdf.getPageCount()

    for (let i = 0; i < pageCount; i++) {
      const [copiedPage] = await pdfDoc.copyPages(pdf, [i])
      pdfDoc.addPage(copiedPage)
    }
  }

  const pdfBytes = await pdfDoc.save()
  await fs.writeFile(folderPath.concat(`/${outputFileName}.pdf`), pdfBytes)

  logger.debug('--------------------------------------------')
  logger.log(
    `[Sistema] - PDF files successfully merged into '${outputFileName}'!`,
  )
  logger.debug('--------------------------------------------')
}

export const mergePDFsInFolder = async (
  folderPath: string,
  outputFileName: string,
  clientName: string,
): Promise<void> => {
  const pdfFiles: string[] = []
  const files = await fs.readdir(folderPath)

  for (const file of files) {
    const filePath = path.join(folderPath, file)
    const stat = await fs.stat(filePath)

    if (
      stat.isFile() &&
      path.extname(file).toLowerCase() === '.pdf' &&
      file.includes(clientName)
    ) {
      pdfFiles.push(filePath)
    }
  }
  await mergePDFs(pdfFiles, outputFileName, folderPath)
}
