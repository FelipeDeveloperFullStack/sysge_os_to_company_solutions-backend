import * as CryptoJS from 'crypto-js';
import * as bcrypt from 'bcryptjs'
import 'dotenv/config'

export class Encrypt {

  private static ENCRYPTION_KEY = process.env.ENCRYPTION_KEY

  public static async decrypt(data: any) {
    let bytes = CryptoJS.AES.decrypt(data, this.ENCRYPTION_KEY)
    return bytes.toString(CryptoJS.enc.Utf8)
  }

  public static async encrypt(data: any) {
    var ciphertext = CryptoJS.AES.encrypt(data, this.ENCRYPTION_KEY).toString();
    return ciphertext
  }

  /** 
   * @description bcryptjs
   * @link https://www.npmjs.com/package/bcryptjs
   */
  public static hashSync(data: any) {
    const salt = bcrypt.genSaltSync(8)
    return bcrypt.hashSync(data, salt)
  }

  /** 
   * @description bcryptjs
   * @link https://www.npmjs.com/package/bcryptjs
   */
  public static compareHashSync(data: any, hash: string): boolean {
    return bcrypt.compareSync(data, hash)
  }
}
