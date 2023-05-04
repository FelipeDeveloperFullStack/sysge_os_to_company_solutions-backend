import * as XLSX from 'xlsx'
import * as fs from 'fs'

// interface Despesa {
//   ID: number
//   Despesa: string
//   Entrada: Date
//   Vencimento: Date
//   Valor: number
//   Status: string
//   Referente: string
// }

// interface Recebido {
//   ID: number
//   CLIENTE: string
//   'CPF/CNPJ': string
//   'OS Nº': number
//   VALOR: number
//   STATUS: string
//   'FORMA PG': string
//   'O.S GERADA': string
//   'Mês Referente': string
//   Extra: string
// }

// interface Cliente {
//   ID: number
//   CLIENTE: string
//   ENDEREÇO: string
//   CIDADE: string
//   UF: string
//   'CPF/CNPJ': string
//   EMAIL: string
//   'CEL/TEL': string
//   CEP: string
// }

// interface Laudo {
//   ID: number
//   'LAUDOS E SERVIÇOS': string
// }

// interface Peca {
//   ID: number
//   SERVIÇOS: string
//   VALORES: number
// }

// interface Equipamento {
//   ID: number
//   EQUIPAMENTOS: string
//   MARCAS: string
//   MODELOS: string
// }

// interface Servico {
//   ID: number
//   SERVIÇOS: string
//   VALORES: number
// }

function ReadFile() {
  //const workbook = XLSX.readFile('BackEndSolution.xlsm')
  //const despesaSheet = workbook.Sheets['Despesas']
  // const recebidoSheet = workbook.Sheets['RECEBIDOS']
  // const clienteSheet = workbook.Sheets['CLIENTE']
  // const laudoSheet = workbook.Sheets['LAUDOS']
  // const pecaSheet = workbook.Sheets['PEÇAS']
  // const equipamentoSheet = workbook.Sheets['EQUIPAMENTOS']
  // const servicoSheet = workbook.Sheets['SERVIÇOS']

  //const despesas = XLSX.utils.sheet_to_json<any>(despesaSheet, {header: 1})
  const workbook = XLSX.readFile('BackEndSolution.xlsm', {type: 'buffer'})
  const sheetNames = workbook.SheetNames

  for (let i = 0; i < sheetNames.length; i++) {
    console.log(workbook.Sheets[sheetNames[i]])
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNames[i]])
    console.log(sheet)
  }
  // const recebidos = XLSX.utils.sheet_to_json<Recebido>(recebidoSheet, {
  //   header: 1,
  // })
  // const clientes = XLSX.utils.sheet_to_json<Cliente>(clienteSheet, {header: 1})
  // const laudos = XLSX.utils.sheet_to_json<Laudo>(laudoSheet, {header: 1})
  // const pecas = XLSX.utils.sheet_to_json<Peca>(pecaSheet, {header: 1})
  // const equipamentos = XLSX.utils.sheet_to_json<Equipamento>(equipamentoSheet, {
  //   header: 1,
  // })
  // const servicos = XLSX.utils.sheet_to_json<Servico>(servicoSheet, {header: 1})
  // console.log({
  //   despesas,
  //   recebidos,
  //   clientes,
  //   laudos,
  //   pecas,
  //   equipamentos,
  //   servicos,
  // })
  // return [despesas, recebidos, clientes, laudos, pecas, equipamentos, servicos]
  return []
}

async function lerPlanilha(filename) {
  const stream = fs.createReadStream(filename, {encoding: 'binary'})
  const buffers = []
  for await (const chunk of stream) {
    buffers.push(Buffer.from(chunk, 'binary'))
  }
  const data = Buffer.concat(buffers)
  const workbook = XLSX.read(data, {type: 'buffer', cellDates: true})

  const sheetNames = workbook.SheetNames

  const dataObj = {}

  for (let i = 0; i < sheetNames.length; i++) {
    const sheet = XLSX.utils.sheet_to_json(workbook.Sheets['Despesas'])
    dataObj[sheetNames[i]] = sheet
  }
  console.log(dataObj)
  return dataObj
}

lerPlanilha('BackEndSolution.xlsm')
