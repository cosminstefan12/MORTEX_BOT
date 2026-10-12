const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const axios = require('axios')
const express = require('express')

const app = express()
const PORT = process.env.PORT || 3000
let pairCodeGlobal = "Se genereaza..."
let phoneGlobal = ""

app.get('/', (req,res)=>{
  res.send(`<h1>🤖 BOT FUN ROMANIA</h1>
  <p>Numar: ${phoneGlobal || 'Nu e setat'}</p>
  <h2>Pair Code-ul tau: <b style="font-size:40px">${pairCodeGlobal}</b></h2>
  <p>Intra pe Whatsapp > Dispozitive conectate > Conecteaza cu numar de telefon > Baga codul</p>
  <p>Dupa conectare scrie.help in grup</p>
  <p><a href="/pair?number=40712345678">Genereaza cod nou: /pair?number=NUMARUL_TAU_CU_PREFIX</a></p>
  `)
})

app.get('/pair', async (req,res)=>{
  const num = req.query.number
  if(!num) return res.send('40770811929')
  phoneGlobal = num
  try {
    const code = await global.requestPair(num)
    pairCodeGlobal = code
    res.send(`<h1>Codul tau pentru ${num} este: ${code}</h1><a href="/">Inapoi</a>`)
  } catch(e){ res.send('Eroare: '+e.message) }
})

app.listen(PORT, ()=> console.log('WEB SERVER PE PORT '+PORT))

let ticTacToe = {}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, printQRInTerminal: false, browser: ["Bot Fun", "Chrome", "1.0"] })
  sock.ev.on('creds.update', saveCreds)

  global.requestPair = async (number) => {
    const clean = number.replace(/[^0-9]/g,'')
    const code = await sock.requestPairingCode(clean)
    pairCodeGlobal = code
    console.log(`PAIR CODE PENTRU ${clean}: ${code}`)
    return code
  }

  sock.ev.on('connection.update', (u)=>{
    if(u.connection==='open') console.log('✅ BOT CONECTAT CU SUCCES!')
    if(u.connection==='close') {
      if(u.lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot()
    }
  })

  // --- AICI INCEPE COMENZILE ---
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message || m.key.fromMe) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    if (!text.startsWith('.')) return
    const args = text.slice(1).trim().split(/ +/)
    const command = args.shift().toLowerCase()
    const chatId = m.key.remoteJid

    if (command === 'tagall') {
      const meta = await sock.groupMetadata(chatId)
      const members = meta.participants.map(p => p.id)
      let txt = `📢 TAGALL:\n${args.join(' ')}\n\n`
      members.forEach(id => txt += `@${id.split('@')[0]} `)
      await sock.sendMessage(chatId, { text: txt, mentions: members })
    }
    if (command === 'hidetag') {
      const meta = await sock.groupMetadata(chatId)
      const members = meta.participants.map(p => p.id)
      await sock.sendMessage(chatId, { text: args.join(' ') || '👀', mentions: members })
    }
    if (command === 'waifu' || command === 'neko') {
      const type = command === 'neko'? 'neko' : 'waifu'
      const res = await axios.get(`https://api.waifu.pics/sfw/${type}`)
      await sock.sendMessage(chatId, { image: { url: res.data.url }, caption: type })
    }
    if (command === 'anime') {
      const q = args.join(' ')
      if (!q) return sock.sendMessage(chatId, { text: 'Scrie:.anime naruto' })
      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${q}&limit=1`)
      const a = res.data.data[0]
      await sock.sendMessage(chatId, { image: { url: a.images.jpg.large_image_url }, caption: `*${a.title}* ⭐ ${a.score}\n${a.synopsis.slice(0,300)}` })
    }
    if (command === 'meme') {
      const res = await axios.get('https://meme-api.com/gimme')
      await sock.sendMessage(chatId, { image: { url: res.data.url }, caption: res.data.title })
    }
    if (command === 'ppt') {
      const opt = ['piatra','hartie','foarfeca']
      const bot = opt[Math.floor(Math.random()*3)]
      const user = args[0]?.toLowerCase()
      if(!opt.includes(user)) return sock.sendMessage(chatId,{text:'Foloseste:.ppt piatra'})
      let rez = user===bot?'Egal!':(user==='piatra'&&bot==='foarfeca'||user==='hartie'&&bot==='piatra'||user==='foarfeca'&&bot==='hartie')?'Ai castigat!':'Ai pierdut!'
      await sock.sendMessage(chatId,{text:`Tu:${user} Bot:${bot}\n${rez}`})
    }
    if (command === 'xox') {
      if(!ticTacToe[chatId]) ticTacToe[chatId]=['1','2','3','4','5','6','7','8','9']
      const pos = parseInt(args[0])-1
      if(!isNaN(pos)) {
        ticTacToe[chatId][pos]='❌'
        let empty = ticTacToe[chatId].map((v,i)=>v!=='❌'&&v!=='⭕'?i:null).filter(v=>v!==null)
        if(empty.length>0) ticTacToe[chatId][empty[Math.floor(Math.random()*empty.length)]]='⭕'
      }
      let b=ticTacToe[chatId]
      let msg=`${b[0]}|${b[1]}|${b[2]}\n${b[3]}|${b[4]}|${b[5]}\n${b[6]}|${b[7]}|${b[8]}\nScrie.xox 1-9`
      await sock.sendMessage(chatId,{text:msg})
    }
    if (command === 'kick' || command === 'ban') {
      const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      if(target) { await sock.groupParticipantsUpdate(chatId, [target], 'remove'); await sock.sendMessage(chatId,{text:'Scos 👋'}) }
    }
    if (command === 'help') {
      await sock.sendMessage(chatId,{text:`🤖 MENU\n.tagall.hidetag.waifu.neko.anime.meme.ppt.xox.kick.help`})
    }
  })
}
startBot()
