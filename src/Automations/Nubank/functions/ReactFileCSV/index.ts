import * as csvParser from 'csv-parser'
import * as fs from 'fs'
import * as path from 'path'

export interface CsvData {
  Data: string
  Valor: number
  Identificador: string
  Descricao: string
}

// Helper function to remove duplicates based on a property value
function removeDuplicatesByProperty<T>(arr: T[], prop: keyof T): T[] {
  const uniqueMap = new Map<T[keyof T], T>()
  for (const item of arr) {
    if (!uniqueMap.has(item[prop])) {
      uniqueMap.set(item[prop], item)
    }
  }
  return Array.from(uniqueMap.values())
}

async function readCSVFiles(
  isAllowPositiveValues?: boolean,
): Promise<CsvData[] | null> {
  const folderPath = path.join('dist', 'Modules', 'files_gmail_nubank')
  if (fs.existsSync(folderPath)) {
    const extension = '.csv'
    const results: CsvData[] = []
    const fileResults: CsvData[] = []

    try {
      // Read the contents of the folder asynchronously
      const files = await fs.promises.readdir(folderPath)
      // Find the .csv files in the folder and read them concurrently
      const fileReadPromises = files
        .filter((file) => path.extname(file) === extension)
        .map((csvFile) => {
          const filePath = path.join(folderPath, csvFile)
          return new Promise<CsvData[]>((resolve, reject) => {
            fs.createReadStream(filePath)
              .pipe(csvParser())
              .on('data', (data) => {
                fileResults.push(data)
              })
              .on('end', () => {
                resolve(fileResults)
              })
              .on('error', (err) => {
                reject(err)
              })
          })
        })

      // Wait for all the files to be read and collect the data
      const allFileContents = await Promise.all(fileReadPromises)

      // Merge the data from all files into the "results" array
      for (const fileContents of allFileContents) {
        fileContents.forEach((item) => {
          results.push(item)
        })
      }

      // Process the results array as before
      // return results
      //   .map((csvItem) => ({
      //     ...csvItem,
      //     Valor: Number(csvItem.Valor),
      //   }))
      //   .filter((csvItem) => csvItem.Valor < 0)

      // Process the results array as before
      const processedResults = results
        .map((csvItem) => ({
          ...csvItem,
          Valor: Number(csvItem.Valor),
        }))
        .filter((csvItem) =>
          isAllowPositiveValues ? csvItem.Valor > 0 : csvItem.Valor < 0,
        )

      // Remove duplicates based on a property value (assuming 'Valor' is the unique identifier)
      const uniqueResults = removeDuplicatesByProperty<CsvData>(
        processedResults,
        'Identificador',
      )

      return processedResults
    } catch (err) {
      console.error('[SISTEMA] - Error accessing the folder or files:', err)
      return null
    }
  }
}

async function readCSVFile(): Promise<CsvData[] | null> {
  const folderPath = path.join('dist', 'Modules', 'files_gmail_nubank')
  const extension = '.csv'
  const results: CsvData[] = []

  try {
    // Read the contents of the folder
    const files = fs.readdirSync(folderPath)

    // Find the .ofx file in the folder
    console.log('[SISTEMA] - Procurando o arquivo .csv...')
    const ofxFile = files.find((file) => path.extname(file) === extension)
    if (!ofxFile) {
      console.log('[SISTEMA] - O arquivo .csv não foi encontrado.')
      return null
    }

    const filePath = path.join(folderPath, ofxFile)
    if (!fs.existsSync(filePath)) {
      console.log('O arquivo .csv não foi encontrado.')
    }
    // Fazer a leitura do arquivo .csv
    console.log('[SISTEMA] - Fazendo a leitura do arquivo...')
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
    console.log('[SISTEMA] - Fazendo a leitura do arquivo...')
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

export default readCSVFiles
