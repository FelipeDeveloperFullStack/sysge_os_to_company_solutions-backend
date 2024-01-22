import axios from "axios"

export const getPublicIP = async () => {
    try {
      console.log('Searching public IP address, please wait...')
      const response = await axios.get('https://api.ipify.org?format=json')
      return response.data.ip
    } catch (error) {
     console.log(
        'An error occurred when try to search public ip address. trying again...',
      )
      await getPublicIP()
    }
  }