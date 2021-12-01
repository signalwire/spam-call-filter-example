import storage from 'node-persist'

/**
 * Given a call object, connects the caller to the specified destination number.
 * During the call, listens for DTMF '**' and, if one is provided by the callee,
 * marks the caller as a scammer and hangs up the destination number. The
 * original call remains active.
 *
 * @param {*} call 
 * @param {*} destinationNumber 
 * @returns false if the number gets marked as scammer, true if the call ends
 * without getting marked as scammer.
 */
export async function transfer(call, destinationNumber) {
  /* TODO: */
  // Connect the call to our real phone number
  const dial = null
  /*
  const dial = await call.connect({
    type: 'phone',
    to: destinationNumber,
    from: call.from,
    timeout: 30
  });
  */

  if (!dial.successful) {
    await call.playTTS({ text: "Sorry, there was an error completing your call, Goodbye!" })
    await call.hangup();
    return
  }

  // Detect if the user presses '**'. If so, mark caller as spammer.
  let dialed = ''
  dial.call.on('detect.update', async (call, params) => {
    if (params.detect.type === "digit") {
      const digit = params.detect.params.event
      console.log('Dialed', digit)
      dialed += digit

      if (dialed.endsWith('**')) {
        console.log("Marking as scammer")
        await storage.set(call.from, { isHuman: true, isScammer: true })
        dial.call.hangup()  // Hangup the nested call
      }
    }
  });

  /* TODO: Start the asynchronous detection */

  // Wait until the nested call ends
  await dial.call.waitForEnded();

  const { isScammer } = await storage.get(call.from)
  console.log('isScammer:', isScammer)

  return isScammer
}