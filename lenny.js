const lennyConfig = {
  soundBase: "https://s3.us-east-2.amazonaws.com/files.signalwire.com/173aba80-58fc-415d-b6ed-df6e357e766f/d1a906e8-f5e5-4939-8c07-31105b56ec41/Files/Lenny",
  background: "backgroundnoise.mp3",
  responses: [
    "Lenny1.mp3",
    "Lenny2.mp3",
    "Lenny3.mp3",
    "Lenny4.mp3",
    "Lenny5.mp3",
    "Lenny6.mp3",
    "Lenny7.mp3",
    "Lenny8.mp3",
    "Lenny9.mp3",
    "Lenny10.mp3",
    "Lenny11.mp3",
    "Lenny12.mp3",
    "Lenny13.mp3",
    "Lenny14.mp3",
    "Lenny15.mp3",
    "Lenny16.mp3"
  ]
}

async function promptLenny(call, responseId) {
  console.log("Prompting with: ", lennyConfig.responses[responseId]);

  await call.playAudio({
    url: lennyConfig.soundBase + '/' + lennyConfig.responses[responseId]
  });

  return await call.prompt({
    type: 'speech',
    end_silence_timeout: 1.0,
    media: [{
      type: 'audio',
      url: lennyConfig.soundBase + '/' + lennyConfig.background
    }]
  });
}

export async function lenny(call) {
  let i;

  for (i = 0; i < lennyConfig.responses.length; i++) {
    if (!call.active)
      return

    await promptLenny(call, i)
  }

  while (call.active) {
    const new_i = Math.floor(Math.random() * lennyConfig.responses.length)
    if (i === new_i)
      continue

    i = new_i
    await promptLenny(call, i)
  }
}
