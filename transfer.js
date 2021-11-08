import storage from 'node-persist'

/**
 * 
 * @param {*} call 
 * @param {*} destinationNumber 
 * @returns false if the number is marked as scammer, true otherwise.
 */
export async function transfer(call, destinationNumber) {
  var dial = await call.connect({
    type: 'phone',
    to: destinationNumber,
    from: call.from,
    timeout: 30
  });

  if (!dial.successful) {
    await call.playTTS({ text: "Sorry, there was an error completing your call, Goodbye!" })
    await call.hangup();
    return
  }

  const dialed = []
  dial.call.on('detect.update', async (call, params) => {
    if (params.detect.type === "digit") {
      const digit = params.detect.params.event
      dialed.push(digit)
      console.log("Dialed", dialed)
      if (dialed.join('').endsWith('**')) {
        console.log("Marking as scammer")
        await storage.set(call.from, { isHuman: true, isScammer: true })
        dial.call.hangup()
      }
    }
  });

  dial.call.detectAsync({
    type: "digit",
    timeout: 0
  });

  await dial.call.waitForEnded();

  const { isScammer } = await storage.get(call.from)
  console.log('isScammer:', isScammer)

  return isScammer
}