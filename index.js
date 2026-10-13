const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const axios = require('axios')
const express = require('express')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3000
const MY_NUMBER = "40770811929"
let pairCodeGlobal = "Se genereaza... refresh in 10 sec"
let phoneGlobal = MY_NUMBER

app.get('/', (req,res)=>{
  res.send(`<h1>BMW-XMD ONLINE ✅</h1><h1 style="background:black;color:lime;padding:20px">COD: ${pairCodeGlobal}</h1><p>Numar: ${phoneGlobal}</p><p>Comenzi:.menu.play.tagall.waifu.meme</p>`)
})
app.listen(PORT, ()=> console.log('WEB PE '+PORT))

let ticTacToe = {}

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, printQRInTerminal: false, browser: ["Ubuntu","Chrome","20.0.04"] })
  sock.ev.on('creds.update', saveCreds)

  if(!state.creds.registered){
    setTimeout(async ()=>{
      try {
        const code = await sock.requestPairingCode(MY_NUMBER)
        pairCodeGlobal = code
        console.log(`\nCODUL TAU BMW-XMD: ${code}\n`)
      } catch(e){ console.log(e.message) }
    }, 4000)
  }

  sock.ev.on('connection.update', (u)=>{
    if(u.connection==='open') { console.log('✅ BMW-XMD CONECTAT'); pairCodeGlobal="✅ CONECTAT - BMW-XMD" }
    if(u.connection==='close' && u.lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot()
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    try {
      const m = messages[0]
      if (!m.message || m.key.fromMe) return
      const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ""
      if (!text.startsWith('.')) return

      const args = text.slice(1).trim().split(/ +/)
      const command = args.shift().toLowerCase()
      const chatId = m.key.remoteJid
      console.log('BMW-XMD comanda:', text)

      if (command === 'tagall') {
        const meta = await sock.groupMetadata(chatId)
        const members = meta.participants.map(p => p.id)
        let txt = `📢 *BMW-XMD TAGALL*\n${args.join(' ')}\n\n`
        members.forEach(id => txt += `@${id.split('@')[0]} `)
        await sock.sendMessage(chatId, { text: txt, mentions: members })
      }

      if (command === 'hidetag') {
        const meta = await sock.groupMetadata(chatId)
        const members = meta.participants.map(p => p.id)
        await sock.sendMessage(chatId, { text: args.join(' ') || '👀 BMW-XMD', mentions: members })
      }

      if (command === 'waifu' || command === 'neko') {
        try {
          const type = command === 'neko'? 'neko' : 'waifu'
          const res = await axios.get(`https://api.waifu.pics/sfw/${type}`, {timeout: 10000})
          await sock.sendMessage(chatId, { image: { url: res.data.url }, caption: `*${type}* 😏 | BMW-XMD` })
        } catch(e){ await sock.sendMessage(chatId, { text: 'API picat, incearca iar.waifu' }) }
      }

      if (command === 'anime') {
        try {
          const q = args.join(' ')
          if (!q) return sock.sendMessage(chatId, { text: 'Scrie:.anime naruto' })
          const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${q}&limit=1`)
          const a = res.data.data[0]
          if(!a) return sock.sendMessage(chatId, { text: 'Nu am gasit' })
          await sock.sendMessage(chatId, { image: { url: a.images.jpg.large_image_url }, caption: `*${a.title}* ⭐ ${a.score} | BMW-XMD` })
        } catch(e){ await sock.sendMessage(chatId, { text: 'Eroare anime api' }) }
      }

      if (command === 'meme') {
        try {
          const res = await axios.get('https://meme-api.com/gimme')
          await sock.sendMessage(chatId, { image: { url: res.data.url }, caption: `${res.data.title} | BMW-XMD` })
        } catch(e){ await sock.sendMessage(chatId, { text: 'Meme api picat' }) }
      }

      if (command === 'ppt') {
        const opt = ['piatra','hartie','foarfeca']
        const bot = opt[Math.floor(Math.random()*3)]
        const user = args[0]?.toLowerCase()
        if(!opt.includes(user)) return sock.sendMessage(chatId,{text:'Scrie:.ppt piatra'})
        let rez = user===bot?'Egal!':(user==='piatra'&&bot==='foarfeca'||user==='hartie'&&bot==='piatra'||user==='foarfeca'&&bot==='hartie')?'Ai castigat!':'Ai pierdut!'
        await sock.sendMessage(chatId,{text:`Tu: ${user}\nBot: ${bot}\n${rez} | BMW-XMD`})
      }

      if (command === 'xox') {
        if(!ticTacToe[chatId]) ticTacToe[chatId]=['1','2','3','4','5','6','7','8','9']
        const pos = parseInt(args[0])-1
        if(!isNaN(pos) && pos>=0 && pos<=8 && ticTacToe[chatId][pos]!=='❌' && ticTacToe[chatId][pos]!=='⭕') {
          ticTacToe[chatId][pos]='❌'
          let empty = ticTacToe[chatId].map((v,i)=>v!=='❌'&&v!=='⭕'?i:null).filter(v=>v!==null)
          if(empty.length>0) ticTacToe[chatId][empty[Math.floor(Math.random()*empty.length)]]='⭕'
        }
        let b=ticTacToe[chatId]
        let msg=`${b[0]} | ${b[1]} | ${b[2]}\n${b[3]} | ${b[4]} | ${b[5]}\n${b[6]} | ${b[7]} | ${b[8]}\nScrie.xox 1-9 | BMW-XMD`
        await sock.sendMessage(chatId,{text:msg})
      }

      if (command === 'kick' || command === 'ban') {
        const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if(target) { await sock.groupParticipantsUpdate(chatId, [target], 'remove'); await sock.sendMessage(chatId,{text:'Scos 👋 | BMW-XMD'}) }
      }

      if (command === 'play') {
        try {
          const query = args.join(' ')
          if(!query) return sock.sendMessage(chatId,{text:'Scrie:.play totul meu'})
          await sock.sendMessage(chatId,{text:`🎧 *BMW-XMD* cauta: ${query}`})
          const yts = require('yt-search')
          const ytdl = require('@distube/ytdl-core')
          const search = await yts(query)
          const video = search.videos[0]
          if(!video) return sock.sendMessage(chatId,{text:'Nu am gasit melodia'})

          await sock.sendMessage(chatId,{
            image: { url: video.thumbnail },
            caption: `• AUDIO DOWNLOADER 🎧\n\n◎ Title - ${video.title}\n◎ Duration - ${video.timestamp}\n◎ Views - ${video.views}\n◎ Uploaded - ${video.ago}\n\nPowered by BMW-XMD`
          })

          const file = `./${Date.now()}.mp3`
          const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' })
          const write = fs.createWriteStream(file)
          stream.pipe(write)
          write.on('finish', async ()=>{
            await sock.sendMessage(chatId,{ audio: fs.readFileSync(file), mimetype: 'audio/mp4' }, { quoted: m })
            fs.unlinkSync(file)
          })
        } catch(e){
          await sock.sendMessage(chatId,{text:'Eroare.play: '+e.message})
        }
      }

      if (command === 'help' || command === 'menu' || command === 'meniu') {
        await sock.sendMessage(chatId,{text:
`🤖 *BMW-XMD v1.0*
Owner: 40770811929

👥 *GRUP*
•.tagall mesaj - tag la toti
•.hidetag mesaj - mesaj invizibil
•.kick @user
•.ban @user

🎌 *ANIME*
•.anime naruto
•.waifu
•.neko

😂 *FUN*
•.meme
•.ppt piatra/hartie/foarfeca
•.xox 1-9

🎧 *MUZICA*
•.play nume melodie

Powered by BMW-XMD`
        })
      }

    } catch(err){ console.log('EROARE:', err.message) }
  })
}
startBot()
