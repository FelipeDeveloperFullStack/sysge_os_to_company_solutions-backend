import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MESSAGE_STATUS, RECEIVE_MESSAGE } from '../WhatsappConnection/WebhookStatus';

@Injectable()
export class WhatsappMessageService {

  @OnEvent(RECEIVE_MESSAGE)
  onMessageReceive(data: any){
    console.log(data)
    /**
     * if (type === 'ptt')
     * <audio controls>
        <source src="data.file" type='audio/ogg; codecs=opus'>
       </audio>
     * 
     */
  }

  @OnEvent(MESSAGE_STATUS)
  onMessageSend(data: any){
    console.log(data)
  }
}
