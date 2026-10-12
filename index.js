const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys')
const P = require('pino')
const axios = require('axios')

let ticTacToe = {} // salveaza jocurile xox

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, printQRInTerminal: true })
  sock.ev.on('creds.update', saveCreds)
  sock.ev.on('connection.update', (u) => { if(u.connection==='open') console.log('BOT ONLINE') })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message || m.key.fromMe) return
    const isGroup = m.key.remoteJid.endsWith('@g.us')
    const text = m.message.conversation || m.message.extendedTextMessage?.text || ''
    if (!text.startsWith('.')) return

    const args = text.slice(1).trim().split(/ +/)
    const command = args.shift().toLowerCase()
    const chatId = m.key.remoteJid

    //.tagall
    if (command === 'tagall') {
      const meta = await sock.groupMetadata(chatId)
      const members = meta.participants.map(p => p.id)
      let txt = `📢 TAGALL de la ${m.pushName}:\n${args.join(' ')}\n\n`
      members.forEach(id => txt += `@${id.split('@')[0]} `)
      await sock.sendMessage(chatId, { text: txt, mentions: members })
    }

    //.hidetag
    if (command === 'hidetag') {
      const meta = await sock.groupMetadata(chatId)
      const members = meta.participants.map(p => p.id)
      await sock.sendMessage(chatId, { text: args.join(' ') || '👀', mentions: members })
    }

    //.waifu.neko
    if (command === 'waifu' || command === 'neko') {
      const type = command === 'neko'? 'neko' : 'waifu'
      const res = await axios.get(`https://api.waifu.pics/sfw/${type}`)
      await sock.sendMessage(chatId, { image: { url: res.data.url }, caption: `${type} pentru tine 😏` })
    }

    //.anime
    if (command === 'anime') {
      const q = args.join(' ')
      if (!q) return sock.sendMessage(chatId, { text: 'Foloseste:.anime naruto' })
      const res = await axios.get(`https://api.jikan.moe/v4/anime?q=${q}&limit=1`)
      const a = res.data.data[0]
      if(!a) return sock.sendMessage(chatId,{text:'Nu am gasit anime'})
      await sock.sendMessage(chatId, { image: { url: a.images.jpg.large_image_url }, caption: `*${a.title}*\n⭐ ${a.score} | 📺 ${a.episodes} ep\n${a.synopsis.slice(0,350)}...` })
    }

    //.meme
    if (command === 'meme') {
      const res = await axios.get('https://meme-api.com/gimme')
      await sock.sendMessage(chatId, { image: { url: res.data.url }, caption: res.data.title })
    }

    //.ppt - piatra hartie foarfeca
    if (command === 'ppt') {
      const opt = ['piatra','hartie','foarfeca']
      const bot = opt[Math.floor(Math.random()*3)]
      const user = args[0]?.toLowerCase()
      if(!opt.includes(user)) return sock.sendMessage(chatId,{text:'Scrie:.ppt piatra / hartie / foarfeca'})
      let rez = ''
      if(user===bot) rez='Egalitate! 😅'
      else if((user==='piatra'&&bot==='foarfeca')||(user==='hartie'&&bot==='piatra')||(user==='foarfeca'&&bot==='hartie')) rez='Ai castigat! 🎉'
      else rez='Ai pierdut! 😂'
      await sock.sendMessage(chatId,{text:`Tu: ${user}\nBot: ${bot}\n${rez}`})
    }

    //.xox - joc x si 0
    if (command === 'xox') {
      if(!isGroup) return
      const id = chatId
      if(!ticTacToe[id]) {
        ticTacToe[id] = ['1','2','3','4','5','6','7','8','9']
        return sock.sendMessage(chatId,{text:`Joc X si 0 inceput!\n${board(ticTacToe[id])}\nScrie.xox 1-9 sa pui X`})
      }
      const pos = parseInt(args[0])-1
      if(isNaN(pos)||pos<0||pos>8) return
      ticTacToe[id][pos]='❌'
      // mutare bot random
      let empty = ticTacToe[id].map((v,i)=>v!=='❌'&&v!=='⭕'?i:null).filter(v=>v!==null)
      if(empty.length>0) ticTacToe[id][empty[Math.floor(Math.random()*empty.length)]]='⭕'
      let msg = board(ticTacToe[id])
      if(checkWin(ticTacToe[id])) { msg+='\nJoc terminat!'; delete ticTacToe[id] }
      await sock.sendMessage(chatId,{text:msg})
    }

    //.kick /.ban
    if (command === 'kick' || command === 'ban') {
      const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      if(!target) return sock.sendMessage(chatId,{text:'Tag:.kick @user'})
      await sock.groupParticipantsUpdate(chatId, [target], 'remove')
      await sock.sendMessage(chatId,{text:'A fost scos 👋'})
    }

    //.promote /.demote
    if (command === 'promote' || command === 'demote') {
      const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
      if(!target) return
      await sock.groupParticipantsUpdate(chatId, [target], command)
      await sock.sendMessage(chatId,{text:`${command} facut!`})
    }

    //.help
    if (command === 'help' || command === 'menu') {
      await sock.sendMessage(chatId,{text:`🤖 *BOT FUN ROMANIA*\n\n👥 GRUP:\n.tagall mesaj\n.hidetag mesaj\n.kick @user\n.ban @user\n.promote @user\n.demote @user\n\n🎌 ANIME:\n.anime nume\n.waifu\n.neko\n\n😂 FUN & JOCURI:\n.meme\n.ppt piatra/hartie/foarfeca\n.xox 1-9 (x si 0)\n.help`})
    }
  })
}
function board(b){ return `${b[0]} | ${b[1]} | ${b[2]}\n${b[3]} | ${b[4]} | ${b[5]}\n${b[6]} | ${b[7]} | ${b[8]}` }
function checkWin(b){ const w=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]]; return w.some(([a,c,d])=>b[a]===b[c]&&b[c]===b[d]) }

startBot()
