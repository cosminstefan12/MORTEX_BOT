const { default: makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys')
const P = require('pino')
const axios = require('axios')
const express = require('express')
const yts = require('yt-search')

const app = express()
const PORT = process.env.PORT || 3000
const MY_NUMBER = "40770811929"
let pairCodeGlobal = "Se genereaza..."

app.get('/', (req,res)=> res.send(`<h1>BMW-XMD V6 FINAL 100% COBALT</h1><h1 style="background:black;color:lime;padding:30px">COD: ${pairCodeGlobal}</h1>`))
app.listen(PORT, ()=> console.log('WEB PE '+PORT))

let ticTacToe = {}
let groupSettings = {}

const AXIOS = { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth')
  const sock = makeWASocket({ logger: P({ level: 'silent' }), auth: state, browser: ["Ubuntu","Chrome","20.0.04"] })
  sock.ev.on('creds.update', saveCreds)
  if(!state.creds.registered){ setTimeout(async ()=>{ try{ pairCodeGlobal = await sock.requestPairingCode(MY_NUMBER) }catch{} },3000) }
  sock.ev.on('connection.update', (u)=>{ if(u.connection==='open'){ console.log('✅ CONECTAT'); pairCodeGlobal="✅ CONECTAT" } if(u.connection==='close' && u.lastDisconnect?.error?.output?.statusCode!==DisconnectReason.loggedOut) startBot() })

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0]; if(!m.message) return
    const text = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || ""
    const args = text.slice(1).trim().split(/ +/); const command = args.shift()?.toLowerCase()
    const chatId = m.key.remoteJid; const q = args.join(' '); const senderId = m.key.participant || m.key.remoteJid
    async function isAdmin(cid,uid){ try{ const meta=await sock.groupMetadata(cid); const p=meta.participants.find(x=>x.id===uid); return p&&(p.admin==='admin'||p.admin==='superadmin') }catch{ return false } }

    try{
      if(chatId.endsWith('@g.us') && groupSettings[chatId]?.antilink && !text.startsWith('.')){
        if(/chat\.whatsapp\.com\//i.test(text)){ if(!(await isAdmin(chatId,senderId))){ await sock.sendMessage(chatId,{text:`⚠️ Link sters @${senderId.split('@')[0]}`,mentions:[senderId]}); await sock.groupParticipantsUpdate(chatId,[senderId],'remove'); return } }
      }
      if (!text.startsWith('.')) return
      if(command==='alive'||command==='ping'){ return sock.sendMessage(chatId,{text:'✅ BMW-XMD V6 ONLINE COBALT - .menu'}) }

      if(command==='tagall'){ if(!chatId.endsWith('@g.us')) return; if(!(await isAdmin(chatId,senderId))) return sock.sendMessage(chatId,{text:'❌ Doar admin'}); const meta=await sock.groupMetadata(chatId); const mem=meta.participants.map(p=>p.id); let txt=`📢 *TAGALL*\n${q||'BMW-XMD'}\n\n`; mem.forEach(id=>txt+=`@${id.split('@')[0]} `); return sock.sendMessage(chatId,{text:txt,mentions:mem}) }
      if(command==='hidetag'||command==='ht'){ if(!(await isAdmin(chatId,senderId))) return; const meta=await sock.groupMetadata(chatId); return sock.sendMessage(chatId,{text:q||'BMW-XMD V6',mentions:meta.participants.map(p=>p.id)}) }
      if(command==='kick'||command==='ban'){ if(!(await isAdmin(chatId,senderId))) return; const t=m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(!t) return sock.sendMessage(chatId,{text:'Tag: .kick @user'}); await sock.groupParticipantsUpdate(chatId,[t],'remove'); return sock.sendMessage(chatId,{text:`Scos @${t.split('@')[0]}`,mentions:[t]}) }
      if(command==='add'){ if(!(await isAdmin(chatId,senderId))) return; let num=q.replace(/[^0-9]/g,''); if(!num) return sock.sendMessage(chatId,{text:'.add 40770xxx'}); try{ await sock.groupParticipantsUpdate(chatId,[num+'@s.whatsapp.net'],'add'); return sock.sendMessage(chatId,{text:`Adaugat ${num}`}) }catch{ return sock.sendMessage(chatId,{text:'Nu pot adauga, are privat'}) } }
      if(command==='promote'){ if(!(await isAdmin(chatId,senderId))) return; const t=m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(!t) return; await sock.groupParticipantsUpdate(chatId,[t],'promote'); return sock.sendMessage(chatId,{text:`Promovat @${t.split('@')[0]}`,mentions:[t]}) }
      if(command==='demote'){ if(!(await isAdmin(chatId,senderId))) return; const t=m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]; if(!t) return; await sock.groupParticipantsUpdate(chatId,[t],'demote'); return sock.sendMessage(chatId,{text:`Retrogradat @${t.split('@')[0]}`,mentions:[t]}) }
      if(command==='group'){ if(!(await isAdmin(chatId,senderId))) return; if(q==='open'){ await sock.groupSettingUpdate(chatId,'not_announcement'); return sock.sendMessage(chatId,{text:'✅ Grup deschis'}) } if(q==='close'){ await sock.groupSettingUpdate(chatId,'announcement'); return sock.sendMessage(chatId,{text:'✅ Grup inchis'}) } return sock.sendMessage(chatId,{text:'.group open / close'}) }
      if(command==='link'){ const code=await sock.groupInviteCode(chatId); return sock.sendMessage(chatId,{text:`🔗 https://chat.whatsapp.com/${code}`}) }
      if(command==='setname'){ if(!(await isAdmin(chatId,senderId))) return; await sock.groupUpdateSubject(chatId,q); return sock.sendMessage(chatId,{text:`Nume: ${q}`}) }
      if(command==='setdesc'){ if(!(await isAdmin(chatId,senderId))) return; await sock.groupUpdateDescription(chatId,q); return sock.sendMessage(chatId,{text:'Descriere schimbata'}) }
      if(command==='admins'){ const meta=await sock.groupMetadata(chatId); const admins=meta.participants.filter(p=>p.admin); let txt=`👑 *Admini*\n`; admins.forEach(a=>txt+=`@${a.id.split('@')[0]}\n`); return sock.sendMessage(chatId,{text:txt,mentions:admins.map(a=>a.id)}) }
      if(command==='antilink'){ if(!(await isAdmin(chatId,senderId))) return; if(!groupSettings[chatId]) groupSettings[chatId]={antilink:false}; if(q==='on'){ groupSettings[chatId].antilink=true; return sock.sendMessage(chatId,{text:'✅ Antilink ON'}) } if(q==='off'){ groupSettings[chatId].antilink=false; return sock.sendMessage(chatId,{text:'❌ Antilink OFF'}) } return sock.sendMessage(chatId,{text:`Antilink: ${groupSettings[chatId].antilink?'ON':'OFF'}`}) }
      if(command==='leave'){ if(!(await isAdmin(chatId,senderId))) return; await sock.sendMessage(chatId,{text:'👋 Pa!'}); return sock.groupLeave(chatId) }

      // --- MUZICA COBALT 100% - INLOCUIT ---
      if(command==='play'||command==='song'||command==='muzica'){
        if(!q) return sock.sendMessage(chatId,{text:'Scrie: .play Tzanca Uraganu - Trai v-ar familia'})
        try{
          await sock.sendMessage(chatId,{text:`🎧 *Caut:* ${q}`})
          const search = await yts(q); const video = search.videos[0]
          if(!video) return sock.sendMessage(chatId,{text:'Nu am gasit melodia'})

          await sock.sendMessage(chatId,{image:{url:video.thumbnail},caption:`🎧 *${video.title}*\n⏱ ${video.timestamp}\n\n⏳ Cobalt scoate mp3-ul, apare bara jos...`})

          let audioUrl = null

          // 1 - COBALT - CEL MAI BUN
          try{
            const r1 = await axios.post('https://api.cobalt.tools/api/json', {
              url: video.url,
              aFormat: "mp3",
              isAudioOnly: true
            }, { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, timeout: 30000 })
            audioUrl = r1.data?.url
          }catch(e){ console.log('COBALT fail') }

          // 2 - VREDEN BACKUP
          if(!audioUrl){
            try{
              const r2 = await axios.get(`https://api.vreden.my.id/api/ytmp3?url=${video.url}`, AXIOS)
              audioUrl = r2.data?.result?.download?.url || r2.data?.result?.url
            }catch(e){}
          }

          // 3 - DAVID BACKUP
          if(!audioUrl){
            try{
              const r3 = await axios.get(`https://api.davidcyriltech.my.id/youtube/mp3?url=${video.url}`, AXIOS)
              audioUrl = r3.data?.result?.downloadUrl
            }catch(e){}
          }

          if(!audioUrl){
            return sock.sendMessage(chatId,{text:`❌ API blocat.\nTitlu: ${video.title}\nLink: ${video.url}`})
          }

          await sock.sendMessage(chatId,{
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            fileName: `${video.title}.mp3`,
            ptt: false
          }, {quoted:m})

          return sock.sendMessage(chatId,{text:`✅ Gata - ${video.title}`})

        }catch(err){ return sock.sendMessage(chatId,{text:'Eroare play: '+err.message}) }
      }

      if(command==='video'){ try{ const search=await yts(q); const video=search.videos[0]; const url=q.includes('youtu')?q:video.url; const res=await axios.get(`https://api.vreden.my.id/api/ytmp4?url=${url}`, AXIOS); const vUrl=res.data?.result?.download?.url || res.data?.result?.url; if(!vUrl) return sock.sendMessage(chatId,{text:'Video blocat'}); return sock.sendMessage(chatId,{video:{url:vUrl},caption:video.title}) }catch{ return sock.sendMessage(chatId,{text:'Eroare video'}) } }
      if(command==='tiktok'){ try{ const res=await axios.get(`https://api.vreden.my.id/api/tiktok?url=${q}`, AXIOS); return sock.sendMessage(chatId,{video:{url:res.data.result?.url || res.data.result?.play},caption:'TT | BMW-XMD'}) }catch{ return sock.sendMessage(chatId,{text:'Eroare tiktok'}) } }

      const animeList = ['slap','kiss','hug','pat','cuddle','bonk','yeet','bite','poke','kick','kill','happy','wink','blush','smile','wave','highfive','handhold','nom','glomp','dance','cringe','cry','bully','shinobu']
      if(animeList.includes(command)){
        try{
          const target = m.message.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
          let gifUrl = null
          try{ const r=await axios.get(`https://nekos.best/api/v2/${command}`, AXIOS); gifUrl=r.data?.results?.[0]?.url }catch{}
          if(!gifUrl){ try{ const r=await axios.get(`https://api.waifu.pics/sfw/${command}`, AXIOS); gifUrl=r.data.url }catch{} }
          if(!gifUrl) return sock.sendMessage(chatId,{text:'API anime picat, incearca iar'})
          const cap = `*${command.toUpperCase()}* 💥\n@${senderId.split('@')[0]} ${command} ${target?`@${target.split('@')[0]}`:''}`
          const mentions = target ? [senderId,target] : [senderId]
          return sock.sendMessage(chatId,{video:{url:gifUrl}, gifPlayback:true, caption:cap, mentions}, {quoted:m})
        }catch(e){ return sock.sendMessage(chatId,{text:'Eroare anime'}) }
      }
      if(command==='waifu'||command==='neko'){ try{ const r=await axios.get(`https://nekos.best/api/v2/waifu`, AXIOS); return sock.sendMessage(chatId,{image:{url:r.data.results[0].url},caption:'Waifu'}) }catch{ const r=await axios.get(`https://api.waifu.pics/sfw/waifu`, AXIOS); return sock.sendMessage(chatId,{image:{url:r.data.url}}) } }
      if(command==='meme'){ const r=await axios.get('https://meme-api.com/gimme', AXIOS); return sock.sendMessage(chatId,{image:{url:r.data.url},caption:r.data.title}) }
      if(command==='joke'){ const r=await axios.get('https://official-joke-api.appspot.com/random_joke', AXIOS); return sock.sendMessage(chatId,{text:`😂 ${r.data.setup}\n${r.data.punchline}`}) }
      if(command==='s'){ try{ const buf=await sock.downloadMediaMessage(m); return sock.sendMessage(chatId,{sticker:buf},{quoted:m}) }catch{ return sock.sendMessage(chatId,{text:'Trimite poza cu .s'}) } }
      if(command==='ppt'){ const o=['piatra','hartie','foarfeca']; const bot=o[Math.floor(Math.random()*3)]; const user=args[0]?.toLowerCase(); if(!o.includes(user)) return sock.sendMessage(chatId,{text:'.ppt piatra/hartie/foarfeca'}); let rez=user===bot?'Egal':(user==='piatra'&&bot==='foarfeca'||user==='hartie'&&bot==='piatra'||user==='foarfeca'&&bot==='hartie')?'Ai castigat':'Ai pierdut'; return sock.sendMessage(chatId,{text:`Tu:${user} Bot:${bot} - ${rez}`}) }
      if(command==='xox'){ if(!ticTacToe[chatId]||q==='reset') ticTacToe[chatId]=['1','2','3','4','5','6','7','8','9']; const pos=parseInt(args[0])-1; if(!isNaN(pos)&&pos>=0&&pos<=8){ if(ticTacToe[chatId][pos]!=='❌'&&ticTacToe[chatId][pos]!=='⭕'){ ticTacToe[chatId][pos]='❌'; let e=ticTacToe[chatId].map((v,i)=>v!=='❌'&&v!=='⭕'?i:null).filter(v=>v!==null); if(e.length>0) ticTacToe[chatId][e[Math.floor(Math.random()*e.length)]]='⭕' } } let b=ticTacToe[chatId]; return sock.sendMessage(chatId,{text:`${b[0]}|${b[1]}|${b[2]}\n${b[3]}|${b[4]}|${b[5]}\n${b[6]}|${b[7]}|${b[8]}\n.xox 1-9`}) }

      if(command==='menu'||command==='meniu'||command==='help'){
        return sock.sendMessage(chatId,{text:
`🤖 *BMW-XMD V6 COBALT MENU*

👑 GRUP ADMIN
- .tagall / .hidetag / .kick / .add
- .promote / .demote / .group / .link
- .setname / .setdesc / .admins
- .antilink on/off / .leave

🎧 DOWNLOAD COBALT (NOU - NU MAI PICA)
- .play manele - muzica mp3 cu bara
- .video - video mp4
- .tiktok - tiktok

💥 ANIME GIF
- .slap / .kiss / .hug / .pat etc

🎌 RANDOM
- .waifu / .meme / .joke / .s

Powered by BMW-XMD V6 COBALT`
        })
      }

    }catch(err){ console.log('EROARE:', err.message) }
  })
}
startBot()
