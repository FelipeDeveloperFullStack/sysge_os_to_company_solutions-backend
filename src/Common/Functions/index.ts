export const isDevelopmentEnvironment = (): boolean => {
  const environment = process.env.ENVIRONMENT || ''
  return environment.toLowerCase() === 'development'
}
