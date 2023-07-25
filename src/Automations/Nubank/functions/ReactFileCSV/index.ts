import * as fs from 'fs'
import * as path from 'path'
import * as csvParser from 'csv-parser'

export interface CsvData {
  Data: string
  Valor: number
  Identificador: string
  Descricao: string
}

async function readCSVFile(): Promise<CsvData[] | null> {
  const folderPath = path.join('dist', 'Modules', 'files_gmail_nubank')
  const extension = '.csv'
  const results: CsvData[] = []

  try {
    // Read the contents of the folder
    const files = fs.readdirSync(folderPath)

    // Find the .ofx file in the folder
    const ofxFile = files.find((file) => path.extname(file) === extension)
    // If no .ofx file is found, return null
    if (!ofxFile) {
      return null
    }

    // Read the content of the .ofx file
    const filePath = path.join(folderPath, ofxFile)
    if (!fs.existsSync(filePath)) {
      throw new Error('O arquivo .csv não foi encontrado.')
    }
    // Fazer a leitura do arquivo .csv
    await new Promise<void>((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on('data', (data) => {
          // Adicionar os dados encontrados no array de resultados
          results.push(data)
        })
        .on('end', () => {
          resolve()
        })
        .on('error', (err) => {
          reject(err)
        })
    })

    return results
      .map((csvItem) => ({
        ...csvItem,
        Valor: Number(csvItem.Valor),
      }))
      .filter((csvItem) => csvItem.Valor < 0)
  } catch (err) {
    console.error('[SISTEMA] - Error accessing the folder or files:', err)
    return null
  }
}

export default readCSVFile
