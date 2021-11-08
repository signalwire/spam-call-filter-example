import 'dotenv/config'
import storage from 'node-persist'
import { RelayConsumer } from '@signalwire/node'

import { captcha } from './captcha.js'
import { lenny } from './lenny.js'
import { transfer } from './transfer.js'

await storage.init()

const MY_NUMBER = '+393406092541'

const consumer = new RelayConsumer({
  project: process.env.SIGNALWIRE_PROJECT_ID,
  token: process.env.SIGNALWIRE_API_TOKEN,
  contexts: [process.env.SIGNALWIRE_CONTEXT],
  
  ready: async ({ client }) => {
    //client.__logger.setLevel(client.__logger.levels.DEBUG)
  },
  
  teardown: (consumer) => {
    //console.log('Consumer teardown. Cleanup..')
  },
  
  onIncomingCall: async (call) => {
    console.log('Inbound call', call.id, call.from, call.to);
    const answerResult = await call.answer();

    if (!answerResult.successful) {
      console.error('Error during call answer')
      return;
    }

    await call.playSilence(1);

    // TODO record

    //
    //        +--> HANGUP <---+ 
    //        |               |
    // START -+--> CAPTCHA ---+
    //        |       |       |
    //        |       v       |
    //        +--> TRANSFER --+
    //        |       |       |
    //        |       v       |
    //        +---> LENNY ----+
    //

    let state = 'START'

    while (true) {
      console.log("State:", state)

      if (state === 'START') {
        const { isHuman, isScammer } = await storage.get(call.from) ?? { }
        console.log("isHuman:", isHuman)

        if (isHuman === undefined) {
          // We don't know yet whether they're a human... let's check
          state = 'CAPTCHA'
        } else if (isHuman && isScammer) {
          // Human scammer. Send them to Lenny.
          state = 'LENNY'
        } else if (isHuman && !isScammer) {
          // Legitimate human. Transfer the call to our real phone number.
          state = 'TRANSFER'
        } else {
          // It's a bot. We do nothing and hangup.
          await call.playTTS({ text: "You are a bot." })
          state = 'HANGUP'
        }

      } else if (state === 'HANGUP') {
        await call.hangup()
        break

      } else if (state === 'CAPTCHA') {
        const isHuman = await captcha(call)
        state = isHuman ? 'TRANSFER' : 'HANGUP'

      } else if (state === 'TRANSFER') {
        const isScammer = await transfer(call, MY_NUMBER)
        state = isScammer ? 'LENNY' : 'HANGUP'

      } else if (state === 'LENNY') {
        await lenny(call)
        state = 'HANGUP'
      }
    }
  }
})

consumer.run()