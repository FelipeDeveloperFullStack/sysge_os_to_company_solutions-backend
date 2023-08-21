const clearSpecialCharacters = (value: string): string => {
  if (!value || typeof value !== 'string') return ''

  return value.replace(/[^a-zA-Z0-9]/g, '')
}

export default clearSpecialCharacters
