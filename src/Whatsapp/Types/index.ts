import { Client } from "whatsapp-web.js";

export interface Session extends Client {
  id?: number
}