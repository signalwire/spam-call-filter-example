import storage from 'node-persist'

/**
 * Given a call object, this function asks the caller to solve a captcha. Then,
 * it returns `true` if the caller solve the captcha (i.e., it is a human),
 * `false` otherwise.
 *
 * @param {*} call 
 * @returns true if human, false otherwise
 */
export async function captcha(call) {
  const MAX_TRIES = 3

  /*
    TODO: Play a message such as:  

        Hello! To complete your call, Please verify you are a human, by dialing
        or speaking the answer to this simple question.
  */

  for (let i = MAX_TRIES - 1; i >= 0; i--) {
    const digit1 = Math.floor(Math.random() * 10)
    const digit2 = Math.floor(Math.random() * 10)
    const expectedAnswer = digit1 + digit2

    /* TODO: Prompt for captcha solution using TTS */
    const result = null

    if (result && result.successful) {
      console.log(`Answered ${result.result}`)

      // Is it the correct answer?
      if (result.result.trim() == expectedAnswer) {
        await call.playTTS({ text: "That is correct. You are probably a human, enjoy your call!" })
        storage.set(call.from, { isHuman: true })
        return true

      } else if (i > 0) {
        await call.playTTS({ text: `That is wrong, you are probably a robot. That's ok, I am a robot too!` +
                                   `I will give you ${i} more ${i == 1 ? 'try' : 'tries'}.` })
      }

    } else {
      await call.playTTS({ text: "I didn't quite catch that." })
      i++
    }
  }

  await call.playTTS({ text: 'You got it wrong too many times. Bye.' })
  storage.set(call.from, { isHuman: false })
  return false
}
