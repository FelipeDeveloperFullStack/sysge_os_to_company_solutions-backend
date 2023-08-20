type MimeType =
  | 'text/plain'
  | 'image/jpeg'
  | 'application/pdf'
  | 'audio/mp3'
  | 'video/mp4'

// export const converBase64ToFile = async (
//   photoBase64: string,
//   filename = 'foto',
//   type = 'pdf',
// ): Promise<File> => {
//   if (!photoBase64) {
//     return
//   }
//   const typeName = type === 'pdf' ? 'application/' : 'image/'
//   const base64 = await fetch(photoBase64)
//   const blob = await base64.blob()
//   console.log({blob, base64})
//   const file = new File(
//     [blob],
//     `${filename !== 'foto' ? filename : `${filename}.${type}`}`,
//     {
//       type: typeName + type,
//     },
//   )
//   return file
// }

export const base64ToFile = (
  base64: string,
  filename: string,
  mimeType: MimeType,
): File => {
  const byteCharacters = atob(base64)
  const byteArrays = []

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512)

    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    byteArrays.push(byteArray)
  }

  const blob = new Blob(byteArrays, {type: mimeType})
  return new File([blob], filename, {type: mimeType})
}
