import * as os from 'os'

export const getLocalIP = () => {
  const interfaces = os.networkInterfaces()
  for (const interfaceName in interfaces) {
    const interfaceData = interfaces[interfaceName]
    for (const info of interfaceData) {
      if (
        info.family === 'IPv4' &&
        !info.internal &&
        info.address !== '127.0.0.1'
      ) {
        return info.address
      }
    }
  }
  return null
}
