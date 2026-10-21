const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const axios = require('axios')
const express = require('express')
const yts = require('yt-search')

const app = express()
const PORT = process.env.PORT || 3000
const MY_NUMBER = "40770811929"
let pairCodeGlobal = "Se genereaza..."

app.get('/', (req,res)=> res.send(`<h1>BMW-XMD V5 ONLINE ✅</h1><h1 style="background:black;color:lime;padding:20px">COD: ${pairCodeGlobal}</h1>`))
app.listen(PORT, ()=> console.log('WEB PE '+PORT))

let ticTacToe = {}
let groupSettings = {} // pentru antilink

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, browser: ["Ubuntu","Chrome","20.0.04"] })
  sock.ev.on('creds.update', saveCreds)

  if(!state.creds.registered){
    setTimeout(async ()=>{
      try { pairCodeGlobal = await sock.requestPairingCode(MY_NUMBER) } catch(e){}
    }, 3000)
  }
  sock.ev.on('connection.update', (u)=>{
    if(u.connection==='open') { console.log('✅ CONECTAT'); pairCodeGlobal="✅ CONECTAT" }
    if(u.connection==='close' && u.lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut) startBot()
  })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]
    if (!m.message) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || ""
    const args = text.slice(1).trim().split(/ +/)
    const command = args.shift()?.toLowerCase()
    const chatId = m.key.remoteJid
    const q = args.join(' ')
    const senderId = m.key.participant || m.key.remoteJid

    async function isAdmin(chatId, userId){
      try{
        const meta = await sock.groupMetadata(chatId)
        const p = meta.participants.find(x=>x.id===userId)
        return p && (p.admin==='admin' || p.admin==='superadmin')
      }catch{ return false }
    }

    try {
      // AUTO ANTILINK - merge non-stop
      if(chatId.endsWith('@g.us') && groupSettings[chatId]?.antilink && !text.startsWith('.')){
        if(/chat\.whatsapp\.com\//i.test(text)){
          if(!(await isAdmin(chatId, senderId))){
            await sock.sendMessage(chatId,{text:`⚠️ Link detectat!`,mentions:[senderId]})
            await sock.groupParticipantsUpdate(chatId,[senderId],'remove')
            return
          }
        }
      }

      if (!text.startsWith('.')) return

      // INFO
      if(command==='alive'||command==='ping'||command==='bot'){
        return sock.sendMessage(chatId,{text:`✅ *BMW-XMD V5 ONLINE*\n🚀 V5 GRUP + ANIME\n👑 Owner: ${MY_NUMBER}\nScrie .menu`})
      }

      // --- GRUP COMPLET ---
      if(command==='tagall'){
        if(!chatId.endsWith('@g.us')) return
        if(!(await isAdmin(chatId, senderId))) return sock.sendMessage(chatId,{text:'❌ Doar admin'})
        const meta = await sock.groupMetadata(chatId); const members = meta.participants.map(p=>p.id)
        let txt=`📢 *TAGALL*\n${q}\n\n`; members.forEach(id=>txt+=`@${id.split('@')[0]} `)
        return sock.sendMessage(chatId,{text:txt,mentions:members})
      }
      if(command==='hidetag'||command==='ht'){
        if(!(await isAdmin(chatId, senderId))) return sock.sendMessage(chatId,{text:'❌ Doar admin'})
        const meta = await sock.groupMetadata(chatId); return sock.sendMessage(chatId,{text:q||'BMW-XMD',mentions:meta.participants.map(p=>p.id)})
      }
      if(command==='kick'||command==='ban'){
        if(!(await isAdmin(chatId, senderId))) return sock.sendMessage(chatId,{text:'❌ Doar admin'})
        const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        if(!target) return sock.sendMessage(chatId,{text:'Tag: .kick @user'})
        await sock.groupParticipantsUpdate(chatId,[target],'remove')
        return sock.sendMessage(chatId,{text:`✅ Scos @${target.split('@')[0]}`,mentions:[target]})
      }
      if(command==='add'){
        if(!(await isAdmin(chatId, senderId))) return sock.sendMessage(chatId,{text:'❌ Doar admin'})
        let num = q.replace(/[^0-9]/g,''); if(!num) return sock.sendMessage(chatId,{text:'.add 40770xxx'})
        try{ await sock.groupParticipantsUpdate(chatId,[num+'@s.whatsapp.net'],'add'); return sock.sendMessage(chatId,{text:`✅ Adaugat ${num}`}) } catch{ return sock.sendMessage(chatId,{text:'❌ Nu am putut adauga'}) }
      }
      if(command==='promote'){
        if(!(await isAdmin(chatId, senderId))) return
        const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(!target) return
        await sock.groupParticipantsUpdate(chatId,[target],'promote'); return sock.sendMessage(chatId,{text:`✅ Promovat @${target.split('@')[0]}`,mentions:[target]})
      }
      if(command==='demote'){
        if(!(await isAdmin(chatId, senderId))) return
        const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(!target) return
        await sock.groupParticipantsUpdate(chatId,[target],'demote'); return sock.sendMessage(chatId,{text:`✅ Retrogradat @${target.split('@')[0]}`,mentions:[target]})
      }
      if(command==='group'){
        if(!(await isAdmin(chatId, senderId))) return
        if(q==='open'){ await sock.groupSettingUpdate(chatId,'not_announcement'); return sock.sendMessage(chatId,{text:'✅ Grup deschis'}) }
        if(q==='close'){ await sock.groupSettingUpdate(chatId,'announcement'); return sock.sendMessage(chatId,{text:'✅ Grup inchis - doar admini'}) }
        return sock.sendMessage(chatId,{text:'.group open / close'})
      }
      if(command==='link'){
        if(!(await isAdmin(chatId, senderId))) return
        const code = await sock.groupInviteCode(chatId); return sock.sendMessage(chatId,{text:`🔗 https://chat.whatsapp.com/${code}`})
      }
      if(command==='setname'){
        if(!(await isAdmin(chatId, senderId))) return
        await sock.groupUpdateSubject(chatId,q); return sock.sendMessage(chatId,{text:`✅ Nume: ${q}`})
      }
      if(command==='setdesc'){
        if(!(await isAdmin(chatId, senderId))) return
        await sock.groupUpdateDescription(chatId,q); return sock.sendMessage(chatId,{text:`✅ Descriere schimbata`})
      }
      if(command==='admins'){
        const meta = await sock.groupMetadata(chatId); const admins = meta.participants.filter(p=>p.admin)
        let txt=`👑 *Admini*\n`; admins.forEach(a=>txt+=`@${a.id.split('@')[0]}\n`); return sock.sendMessage(chatId,{text:txt,mentions:admins.map(a=>a.id)})
      }
      if(command==='antilink'){
        if(!(await isAdmin(chatId, senderId))) return
        if(!groupSettings[chatId]) groupSettings[chatId]={antilink:false}
        if(q==='on'){ groupSettings[chatId].antilink=true; return sock.sendMessage(chatId,{text:'✅ Antilink ON - dau afara pe cine da link'}) }
        if(q==='off'){ groupSettings[chatId].antilink=false; return sock.sendMessage(chatId,{text:'❌ Antilink OFF'}) }
        return sock.sendMessage(chatId,{text:`Antilink: ${groupSettings[chatId].antilink?'ON':'OFF'} - .antilink on/off`})
      }
      if(command==='leave'){
        if(!(await isAdmin(chatId, senderId))) return
        await sock.sendMessage(chatId,{text:'👋 Pa!'}); return sock.groupLeave(chatId)
      }

      // --- DOWNLOAD ---
      if(command==='play'){
        if(!q) return sock.sendMessage(chatId,{text:'.play nume'})
        const search = await yts(q); const video = search.videos[0]
        await sock.sendMessage(chatId,{image:{url:video.thumbnail},caption:`🎧 ${video.title}`})
        const res = await axios.get(`https://api.davidcyriltech.my.id/youtube/mp3?url=${video.url}`)
        if(!res.data?.result?.downloadUrl) return sock.sendMessage(chatId,{text:'Eroare mp3'})
        return sock.sendMessage(chatId,{audio:{url:res.data.result.downloadUrl},mimetype:'audio/mp4'}, {quoted:m})
      }
      if(command==='video'){
        const search = await yts(q); const video = search.videos[0]; const url = q.includes('youtu')? q : video.url
        const res = await axios.get(`https://api.davidcyriltech.my.id/youtube/mp4?url=${url}`)
        return sock.sendMessage(chatId,{video:{url:res.data.result.downloadUrl},caption:video.title})
      }
      if(command==='tiktok'){ const res=await axios.get(`https://api.davidcyriltech.my.id/tiktok?url=${q}`); return sock.sendMessage(chatId,{video:{url:res.data.result.video},caption:'TT | BMW-XMD'}) }
      if(command==='fb'){ const res=await axios.get(`https://api.davidcyriltech.my.id/facebook?url=${q}`); return sock.sendMessage(chatId,{video:{url:res.data.result.downloadUrl},caption:'FB'}) }
      if(command==='ig'){ const res=await axios.get(`https://api.davidcyriltech.my.id/instagram?url=${q}`); return sock.sendMessage(chatId,{video:{url:res.data.result[0].url},caption:'IG'}) }

      // --- ANIME ANIMAT ---
      const animatedActions = ['slap','kiss','hug','pat','cuddle','bonk','yeet','bite','poke','kill','kick','happy','wink','blush','smile','wave','highfive','handhold','nom','glomp','dance','cringe','cry','bully','shinobu']
      if(animatedActions.includes(command)){
        const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
        const mentions = target ? [senderId, target] : [senderId]
        const ro = {slap:'a palmuit pe',kiss:'a pupat pe',hug:'a imbratisat pe',pat:'a mangaiat pe',cuddle:'se cuibareste cu',bonk:'bonk lui',kick:'kick lui',kill:'omoara pe',bite:'musca pe',poke:'impunge pe',dance:'danseaza cu',cry:'plange dupa'}
        const res = await axios.get(`https://api.waifu.pics/sfw/${command}`)
        const url = res.data.url
        const cap = `*${command.toUpperCase()}* 💥\n@${senderId.split('@')[0]} ${ro[command]||command} ${target?`@${target.split('@')[0]}`:''}`
        if(url.endsWith('.gif')) return sock.sendMessage(chatId,{video:{url},gifPlayback:true,caption:cap,mentions},{quoted:m})
        return sock.sendMessage(chatId,{image:{url},caption:cap,mentions},{quoted:m})
      }
      if(command==='waifu'||command==='neko'){ const res=await axios.get(`https://api.waifu.pics/sfw/${command}`); return sock.sendMessage(chatId,{image:{url:res.data.url},caption:command}) }
      if(command==='meme'){ const res=await axios.get('https://meme-api.com/gimme'); return sock.sendMessage(chatId,{image:{url:res.data.url},caption:res.data.title}) }

      // --- FUN ---
      if(command==='joke'){ const res=await axios.get('https://official-joke-api.appspot.com/random_joke'); return sock.sendMessage(chatId,{text:`😂 ${res.data.setup}\n${res.data.punchline}`}) }
      if(command==='ppt'){ const opt=['piatra','hartie','foarfeca']; const bot=opt[Math.floor(Math.random()*3)]; const user=args[0]?.toLowerCase(); if(!opt.includes(user)) return sock.sendMessage(chatId,{text:'.ppt piatra'}); let rez=user===bot?'Egal':(user==='piatra'&&bot==='foarfeca'||user==='hartie'&&bot==='piatra'||user==='foarfeca'&&bot==='hartie')?'Ai castigat':'Ai pierdut'; return sock.sendMessage(chatId,{text:`Tu:${user} Bot:${bot} - ${rez}`}) }
      if(command==='xox'){ if(!ticTacToe[chatId]||q==='reset') ticTacToe[chatId]=['1','2','3','4','5','6','7','8','9']; const pos=parseInt(args[0])-1; if(!isNaN(pos)&&pos>=0&&pos<=8){ if(ticTacToe[chatId][pos]!=='❌'&&ticTacToe[chatId][pos]!=='⭕'){ ticTacToe[chatId][pos]='❌'; let e=ticTacToe[chatId].map((v,i)=>v!=='❌'&&v!=='⭕'?i:null).filter(v=>v!==null); if(e.length>0) ticTacToe[chatId][e[Math.floor(Math.random()*e.length)]]='⭕' } } let b=ticTacToe[chatId]; return sock.sendMessage(chatId,{text:`${b[0]}|${b[1]}|${b[2]}\n${b[3]}|${b[4]}|${b[5]}\n${b[6]}|${b[7]}|${b[8]}\n.xox 1-9`}) }

      // TOOLS
      if(command==='s'){ try{ const buf=await sock.downloadMediaMessage(m); return sock.sendMessage(chatId,{sticker:buf},{quoted:m}) } catch{ return sock.sendMessage(chatId,{text:'Trimite poza cu .s'}) } }
      if(command==='ai'){ if(!q) return; const res=await axios.get(`https://api.davidcyriltech.my.id/ai/chatbot?query=${encodeURIComponent(q)}`); return sock.sendMessage(chatId,{text:res.data.result||res.data.response}) }

      if(command==='menu'){
        return sock.sendMessage(chatId,{text:
`🤖 *BMW-XMD V5 MENU*

👑 GRUP ADMIN
- .tagall text - tag toti
- .hidetag text - tag invizibil
- .kick @user - scoate
- .add 40770xxx - adauga
- .promote @user - fa admin
- .demote @user - scoate admin
- .group open/close
- .link - link grup
- .setname / .setdesc
- .admins - lista admini
- .antilink on/off - anti link
- .leave - bot iese

🎧 DOWNLOAD
- .play / .video / .tiktok / .fb / .ig

💥 ANIME ANIMAT - GIF
- .slap @user / .kiss @user
- .hug / .pat / .cuddle / .bonk
- .kick / .kill / .bite / .poke
- .dance / .cry / .smile / .wave
- .highfive / .handhold / .yeet
- .blush / .wink / .nom / .glomp
- .cringe / .bully / .happy

🎌 RANDOM
- .waifu / .neko / .meme / .joke

😂 FUN
- .ppt / .xox / .s / .ai

Powered by BMW-XMD V5`
        })
      }

    } catch(err){ console.log('EROARE:', err.message) }
  })
}
startBot()
