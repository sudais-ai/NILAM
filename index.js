const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const play = require('play-dl');
const axios = require('axios');
const { instagramGetUrl } = require('instagram-url-direct');
const sharp = require('sharp');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, downloadContentFromMessage } = require('@whiskeysockets/baileys');

// Bot Configuration
const BOT_CONFIG = {
    name: '🔥 NIL BOT',
    prefix: '.',
    owner: '923474810818',
    ownerNumbers: ['923474810818', '923474810818@s.whatsapp.net'],
    botNumber: '923471931926',
    ownerName: 'NIL',
    mode: 'public'
};

// Bot Data
let botData = {
    commandsUsed: 0,
    startTime: Date.now(),
    isConnected: false,
    autoTypingGroups: new Set()
};

// Phonk tracks list (100 curated phonk songs)
const PHONK_TRACKS = [
    'DVRST Close Eyes', 'KORDHELL Murder In My Mind', 'Playaphonk Phonky Town',
    'SKXLL CRUSH', 'LXST CXNTURY ODIUM', 'Freddie Dredd Cha Cha',
    'GHOSTEMANE Mercury', 'Pharmacist North Memphis', 'Baker Ya Mama',
    'Hensonn Sahara', 'Kaito Shoma Shadow', 'LXNGVX DESIRE',
    'Pharmacist Painkillers', 'KORDHELL Live Another Day', 'DVRST Berserk Mode',
    'Zxcursed Whxre', 'LXST CXNTURY ANTICHRIST', 'Shadxwbxrn FADED NIGHTS',
    'Moondeity NEON BLADE', 'Slowboy Deep End', 'Soudiere Smoke',
    'LXNGVX APHRODITE', 'Mythrodak Icarus', 'VØJ NARVENT Memory Reboot',
    'Dxrk After Dark', 'Kordhell Dat Phonk', 'Ghostface Playa Why Not',
    'DJ Yung Vamp Phonk', 'Tevvez Legend', 'LXST CXNTURY REDRUM',
    'Freddie Dredd GTG', 'Kaito Shoma MIDNIGHT', 'DVRST The Possession',
    'KORDHELL Like You Would Know', 'Pharmacist Hellraiser', 'Baker Gunner',
    'LXNGVX INSOMNIA', 'Zxcursed Sleepwalker', 'Shadxwbxrn DEMXNS',
    'Moondeity FALL INTO THE FIRE', 'Slowboy Midnight', 'Soudiere 7th Ward',
    'Mythrodak Echoes', 'Dxrk Rave', 'Kordhell Scopin', 'Ghostface Playa Shade',
    'DJ Yung Vamp Tokyo Drift', 'Tevvez Interworld', 'Freddie Dredd Redrum',
    'Kaito Shoma DARK', 'DVRST Escape', 'KORDHELL Slay', 'Pharmacist Morphine',
    'Baker Loaded', 'LXNGVX NEMESIS', 'Zxcursed Haunted', 'Shadxwbxrn NIGHTMARE',
    'Moondeity NITEMARE', 'Slowboy Late Night', 'Soudiere Down Bad',
    'Mythrodak Abyss', 'Dxrk Violet', 'Kordhell Killers', 'Ghostface Playa Push',
    'DJ Yung Vamp Drift King', 'Tevvez Shadows', 'Freddie Dredd Limbo',
    'Kaito Shoma VOID', 'DVRST Run It', 'KORDHELL Face It', 'Pharmacist Xanax',
    'Baker Heat', 'LXNGVX CHAOS', 'Zxcursed Nightmare', 'Shadxwbxrn SHADOW',
    'Moondeity CRYSTAL', 'Slowboy Twilight', 'Soudiere No Sleep',
    'Mythrodak Eclipse', 'Dxrk Phantom', 'Kordhell Demon', 'Ghostface Playa Smoke',
    'DJ Yung Vamp Dark Night', 'Tevvez Abyss', 'Freddie Dredd Evil',
    'Kaito Shoma GHOST', 'DVRST No Mercy', 'KORDHELL Kill Bill',
    'Pharmacist Codeine', 'Baker Locked', 'LXNGVX ETERNAL', 'Zxcursed Phantom',
    'Shadxwbxrn PHANTOM', 'Moondeity ETERNAL', 'Slowboy Dark Hour',
    'Soudiere Phonked', 'Mythrodak Silence', 'Dxrk Shadows', 'Kordhell Zone',
    'Ghostface Playa Phonky', 'DJ Yung Vamp Night Drive', 'Tevvez Darkness'
];

// Helper Functions
// Updated YouTube audio download function
async function downloadYouTubeAudio(query) {
    try {
        console.log(`🎵 Searching YouTube: ${query}`);
        const search = await yts(query);
        if (!search.videos.length) return null;

        const video = search.videos[0];
        console.log(`Found: ${video.title}`);

        const filePath = path.join(__dirname, 'downloads', `audio_${Date.now()}.mp3`);

        // Use play-dl as primary method (more reliable)
        try {
            const stream = await play.stream(video.url, { 
                quality: 2, // audio quality
                discordPlayerCompatibility: false 
            });
            
            await new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(filePath);
                stream.stream.pipe(writeStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });
            
            return { filePath, title: video.title };
        } catch (playDlError) {
            console.log('play-dl failed, trying ytdl...');
            // Fallback to ytdl
            await new Promise((resolve, reject) => {
                ytdl(video.url, { 
                    quality: 'lowestaudio',
                    filter: 'audioonly' 
                })
                .pipe(fs.createWriteStream(filePath))
                .on('finish', resolve)
                .on('error', reject);
            });
            return { filePath, title: video.title };
        }
    } catch (error) {
        console.error('YouTube audio download error:', error);
        return null;
    }
}

// Updated YouTube video download function
async function downloadYouTubeVideo(query) {
    try {
        console.log(`📹 Searching YouTube video: ${query}`);
        const search = await yts(query);
        if (!search.videos.length) return null;

        const video = search.videos[0];
        console.log(`Found: ${video.title}`);

        const filePath = path.join(__dirname, 'downloads', `video_${Date.now()}.mp4`);

        // Use play-dl as primary method
        try {
            const stream = await play.stream(video.url, { 
                quality: 100, // video quality
                discordPlayerCompatibility: false 
            });
            
            await new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(filePath);
                stream.stream.pipe(writeStream)
                    .on('finish', resolve)
                    .on('error', reject);
            });
            
            return { filePath, title: video.title };
        } catch (playDlError) {
            console.log('play-dl failed, trying ytdl...');
            // Fallback to ytdl
            await new Promise((resolve, reject) => {
                ytdl(video.url, { quality: 'lowest' })
                    .pipe(fs.createWriteStream(filePath))
                    .on('finish', resolve)
                    .on('error', reject);
            });
            return { filePath, title: video.title };
        }
    } catch (error) {
        console.error('YouTube video download error:', error);
        return null;
    }
}









async function downloadInstagram(url) {
    try {
        console.log(`📸 Downloading Instagram: ${url}`);
        const result = await instagramGetUrl(url);
        
        if (!result.url_list || !result.url_list.length) return null;
        
        const mediaUrl = result.url_list[0];
        const filePath = path.join(__dirname, 'downloads', `ig_${Date.now()}.mp4`);
        
        const response = await axios({
            url: mediaUrl,
            method: 'GET',
            responseType: 'stream'
        });
        
        return new Promise((resolve, reject) => {
            response.data.pipe(fs.createWriteStream(filePath))
                .on('finish', () => resolve({ filePath, type: result.thumbnail ? 'video' : 'image' }))
                .on('error', reject);
        });
    } catch (error) {
        console.error('Instagram download error:', error);
        return null;
    }
}

async function createSticker(imagePath) {
    try {
        const stickerPath = path.join(__dirname, 'temp', `sticker_${Date.now()}.webp`);
        await sharp(imagePath)
            .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .webp({ quality: 100 })
            .toFile(stickerPath);
        return stickerPath;
    } catch (error) {
        console.error('Sticker creation error:', error);
        return null;
    }
}

// Message Handler
async function handleMessage(sock, message) {
    try {
        if (!message.message) return;
        
        const from = message.key.remoteJid;
        const isGroup = from.endsWith('@g.us');
        const sender = message.key.participant || message.key.remoteJid;
        
        // Get message text
        const msgContent = message.message;
        let messageText = '';
        if (msgContent.conversation) messageText = msgContent.conversation;
        else if (msgContent.extendedTextMessage?.text) messageText = msgContent.extendedTextMessage.text;
        else if (msgContent.imageMessage?.caption) messageText = msgContent.imageMessage.caption;
        else if (msgContent.videoMessage?.caption) messageText = msgContent.videoMessage.caption;
        
        const text = messageText.trim();
        const lowerText = text.toLowerCase();
        
        // Auto-typing
        if (botData.autoTypingGroups.has(from)) {
            await sock.sendPresenceUpdate('composing', from);
        }
        
        // Hi/Hello response with audio
        if (lowerText === 'hi' || lowerText === 'hello' || lowerText === 'hey') {
            try {
                const audioPath = path.join(__dirname, 'voices', 'hi_voice.mp3');
                
                // Create simple hi audio if not exists
                if (!fs.existsSync(audioPath)) {
                    console.log('Creating hi audio...');
                    // Download a simple hi audio
                    const hiAudio = await downloadYouTubeAudio('hello greeting sound effect');
                    if (hiAudio) {
                        fs.copyFileSync(hiAudio.filePath, audioPath);
                        fs.unlinkSync(hiAudio.filePath);
                    }
                }
                
                if (fs.existsSync(audioPath)) {
                    await sock.sendMessage(from, {
                        audio: fs.readFileSync(audioPath),
                        mimetype: 'audio/mpeg',
                        ptt: true
                    }, { quoted: message });
                    console.log('✅ Hi audio sent');
                }
            } catch (error) {
                console.error('Hi audio error:', error);
            }
            return;
        }
        
        // Check for commands
        if (!text.startsWith(BOT_CONFIG.prefix)) return;
        
        const args = text.slice(BOT_CONFIG.prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const query = args.join(' ');
        
        botData.commandsUsed++;
        
        // Menu command with video
        if (command === 'menu') {
            try {
                const menuVideoPath = path.join(__dirname, 'menu_video.mp4');
                
                if (fs.existsSync(menuVideoPath)) {
                    await sock.sendMessage(from, {
                        video: fs.readFileSync(menuVideoPath),
                        caption: `*${BOT_CONFIG.name} - MENU*\n\n` +
                                `🎵 *Audio Commands:*\n` +
                                `.play <song> - Play audio\n` +
                                `.song <name> - Search song\n\n` +
                                `📹 *Video Commands:*\n` +
                                `.video <name> - Download video\n` +
                                `.yt <link> - YouTube download\n` +
                                `.ig <link> - Instagram download\n\n` +
                                `🎧 *Phonk Commands:*\n` +
                                `.nil1 to .nil100 - Phonk tracks\n\n` +
                                `🎨 *Other Commands:*\n` +
                                `.sticker - Create sticker\n` +
                                `.autotyping - Toggle typing\n\n` +
                                `Owner: ${BOT_CONFIG.ownerName}`,
                        gifPlayback: false,
                        mimetype: 'video/mp4'
                    }, { quoted: message });
                    console.log('✅ Menu video sent');
                } else {
                    await sock.sendMessage(from, { 
                        text: '*Menu video not found!*' 
                    }, { quoted: message });
                }
            } catch (error) {
                console.error('Menu error:', error);
            }
        }
        
        // Play audio command
        // Play audio command
// Play audio command with timeout
else if (command === 'play' || command === 'song') {
    if (!query) {
        await sock.sendMessage(from, { text: '❌ Usage: .play <song name>' }, { quoted: message });
        return;
    }

    await sock.sendMessage(from, { text: `🎵 Downloading: ${query}` }, { quoted: message });

    // Add timeout to prevent hanging
    const downloadPromise = downloadYouTubeAudio(query);
    const timeoutPromise = new Promise((resolve) => 
        setTimeout(() => resolve(null), 60000) // 60 second timeout
    );

    const result = await Promise.race([downloadPromise, timeoutPromise]);
    
    if (result) {
        await sock.sendMessage(from, {
            audio: fs.readFileSync(result.filePath),
            mimetype: 'audio/mpeg',
            fileName: `${result.title}.mp3`,
            ptt: false
        }, { quoted: message });

        fs.unlinkSync(result.filePath);
        console.log('✅ Audio sent');
    } else {
        await sock.sendMessage(from, { text: '❌ Download failed or timed out!' }, { quoted: message });
    }
}
        // Video command
        else if (command === 'video') {
            if (!query) {
                await sock.sendMessage(from, { text: '❌ Usage: .video <video name>' }, { quoted: message });
                return;
            }
            
            await sock.sendMessage(from, { text: `📹 Downloading video: ${query}` }, { quoted: message });
            
            const result = await downloadYouTubeVideo(query);
            if (result) {
                await sock.sendMessage(from, {
                    video: fs.readFileSync(result.filePath),
                    caption: `🎬 ${result.title}`,
                    mimetype: 'video/mp4'
                }, { quoted: message });
                
                fs.unlinkSync(result.filePath);
                console.log('✅ Video sent');
            } else {
                await sock.sendMessage(from, { text: '❌ Download failed!' }, { quoted: message });
            }
        }
        
        // YouTube link download
        else if (command === 'yt') {
            if (!query || !ytdl.validateURL(query)) {
                await sock.sendMessage(from, { text: '❌ Usage: .yt <YouTube URL>' }, { quoted: message });
                return;
            }
            
            await sock.sendMessage(from, { text: '📥 Downloading...' }, { quoted: message });
            
            try {
                const info = await ytdl.getInfo(query);
                const filePath = path.join(__dirname, 'downloads', `yt_${Date.now()}.mp4`);
                
                await new Promise((resolve, reject) => {
                    ytdl(query, { quality: 'highest' })
                        .pipe(fs.createWriteStream(filePath))
                        .on('finish', resolve)
                        .on('error', reject);
                });
                
                if (info.videoDetails.lengthSeconds < 300) {
                    await sock.sendMessage(from, {
                        video: fs.readFileSync(filePath),
                        caption: `🎬 ${info.videoDetails.title}`,
                        mimetype: 'video/mp4'
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(from, {
                        document: fs.readFileSync(filePath),
                        fileName: `${info.videoDetails.title}.mp4`,
                        mimetype: 'video/mp4'
                    }, { quoted: message });
                }
                
                fs.unlinkSync(filePath);
                console.log('✅ YouTube download sent');
            } catch (error) {
                await sock.sendMessage(from, { text: '❌ Download failed!' }, { quoted: message });
            }
        }
        
        // Instagram download
        else if (command === 'ig') {
            if (!query || !query.includes('instagram.com')) {
                await sock.sendMessage(from, { text: '❌ Usage: .ig <Instagram URL>' }, { quoted: message });
                return;
            }
            
            await sock.sendMessage(from, { text: '📸 Downloading Instagram...' }, { quoted: message });
            
            const result = await downloadInstagram(query);
            if (result) {
                if (result.type === 'video') {
                    await sock.sendMessage(from, {
                        video: fs.readFileSync(result.filePath),
                        caption: '📸 Instagram Download',
                        mimetype: 'video/mp4'
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(from, {
                        image: fs.readFileSync(result.filePath),
                        caption: '📸 Instagram Download'
                    }, { quoted: message });
                }
                
                fs.unlinkSync(result.filePath);
                console.log('✅ Instagram media sent');
            } else {
                await sock.sendMessage(from, { text: '❌ Download failed!' }, { quoted: message });
            }
        }
        
        // Phonk commands (.nil1 to .nil100)
        else if (command.startsWith('nil') && /^nil\d+$/.test(command)) {
            const phonkNum = parseInt(command.substring(3));
            
            if (phonkNum >= 1 && phonkNum <= 100) {
                const phonkQuery = PHONK_TRACKS[phonkNum - 1];
                const phonkPath = path.join(__dirname, 'phonk', `phonk_${phonkNum}.mp3`);
                
                // Check if already downloaded
                if (fs.existsSync(phonkPath)) {
                    await sock.sendMessage(from, {
                        audio: fs.readFileSync(phonkPath),
                        mimetype: 'audio/mpeg',
                        fileName: `${phonkQuery}.mp3`,
                        ptt: false
                    }, { quoted: message });
                    console.log(`✅ Phonk ${phonkNum} sent from cache`);
                } else {
                    await sock.sendMessage(from, { text: `🎧 Loading phonk ${phonkNum}...` }, { quoted: message });
                    
                    const result = await downloadYouTubeAudio(phonkQuery + ' phonk');
                    if (result) {
                        // Save to phonk folder
                        fs.copyFileSync(result.filePath, phonkPath);
                        
                        await sock.sendMessage(from, {
                            audio: fs.readFileSync(result.filePath),
                            mimetype: 'audio/mpeg',
                            fileName: `${phonkQuery}.mp3`,
                            ptt: false
                        }, { quoted: message });
                        
                        fs.unlinkSync(result.filePath);
                        console.log(`✅ Phonk ${phonkNum} downloaded and sent`);
                    } else {
                        await sock.sendMessage(from, { text: '❌ Phonk download failed!' }, { quoted: message });
                    }
                }
            }
        }
        
        // Sticker command
        else if (command === 'sticker' || command === 's') {
            const quotedMsg = message.message.extendedTextMessage?.contextInfo?.quotedMessage;
            
            if (quotedMsg?.imageMessage) {
                await sock.sendMessage(from, { text: '🎨 Creating sticker...' }, { quoted: message });
                
                try {
                    const stream = await downloadContentFromMessage(quotedMsg.imageMessage, 'image');
                    const buffer = [];
                    for await (const chunk of stream) {
                        buffer.push(chunk);
                    }
                    
                    const imagePath = path.join(__dirname, 'temp', `img_${Date.now()}.jpg`);
                    fs.writeFileSync(imagePath, Buffer.concat(buffer));
                    
                    const stickerPath = await createSticker(imagePath);
                    if (stickerPath) {
                        await sock.sendMessage(from, {
                            sticker: fs.readFileSync(stickerPath)
                        }, { quoted: message });
                        
                        fs.unlinkSync(imagePath);
                        fs.unlinkSync(stickerPath);
                        console.log('✅ Sticker sent');
                    }
                } catch (error) {
                    console.error('Sticker error:', error);
                    await sock.sendMessage(from, { text: '❌ Sticker creation failed!' }, { quoted: message });
                }
            } else if (msgContent.imageMessage) {
                await sock.sendMessage(from, { text: '🎨 Creating sticker...' }, { quoted: message });
                
                try {
                    const stream = await downloadContentFromMessage(msgContent.imageMessage, 'image');
                    const buffer = [];
                    for await (const chunk of stream) {
                        buffer.push(chunk);
                    }
                    
                    const imagePath = path.join(__dirname, 'temp', `img_${Date.now()}.jpg`);
                    fs.writeFileSync(imagePath, Buffer.concat(buffer));
                    
                    const stickerPath = await createSticker(imagePath);
                    if (stickerPath) {
                        await sock.sendMessage(from, {
                            sticker: fs.readFileSync(stickerPath)
                        }, { quoted: message });
                        
                        fs.unlinkSync(imagePath);
                        fs.unlinkSync(stickerPath);
                        console.log('✅ Sticker sent');
                    }
                } catch (error) {
                    console.error('Sticker error:', error);
                    await sock.sendMessage(from, { text: '❌ Sticker creation failed!' }, { quoted: message });
                }
            } else {
                await sock.sendMessage(from, { text: '❌ Reply to an image with .sticker' }, { quoted: message });
            }
        }
        
        // Auto-typing toggle
        else if (command === 'autotyping') {
            if (!isGroup) {
                await sock.sendMessage(from, { text: '❌ This command only works in groups!' }, { quoted: message });
                return;
            }
            
            if (botData.autoTypingGroups.has(from)) {
                botData.autoTypingGroups.delete(from);
                await sock.sendMessage(from, { text: '✅ Auto-typing disabled' }, { quoted: message });
            } else {
                botData.autoTypingGroups.add(from);
                await sock.sendMessage(from, { text: '✅ Auto-typing enabled' }, { quoted: message });
            }
        }
        
    } catch (error) {
        console.error('Message handler error:', error);
    }
}

// Create necessary directories
function ensureDirectories() {
    const dirs = ['session', 'temp', 'cache', 'media', 'downloads', 'voices', 'phonk'];
    dirs.forEach(dir => {
        const dirPath = path.join(__dirname, dir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
            console.log(`✅ Created directory: ${dir}`);
        }
    });
}

// Start Bot
async function startBot() {
    console.log('🚀 Starting NIL Bot...');
    ensureDirectories();
    
    try {
        const { state, saveCreds } = await useMultiFileAuthState('./session');
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: true,
            browser: ['NIL BOT', 'Chrome', '120.0.0.0'],
            markOnlineOnConnect: true
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;
            
            if (qr) {
                console.log('\n🔥 SCAN QR CODE TO LOGIN:\n');
                qrcode.generate(qr, { small: true });
            }
            
            if (connection === 'open') {
                console.log('✅ BOT CONNECTED!');
                botData.isConnected = true;
                
                try {
                    await sock.sendMessage(`${BOT_CONFIG.owner}@s.whatsapp.net`, {
                        text: `✅ *${BOT_CONFIG.name} ONLINE!*\n\n📅 ${new Date().toLocaleString()}\n🤖 All features activated!`
                    });
                } catch (e) {
                    console.log('Owner notification skipped');
                }
            }
            
            if (connection === 'close') {
                const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
                console.log('Connection closed. Reconnecting:', shouldReconnect);
                
                if (shouldReconnect) {
                    setTimeout(() => startBot(), 3000);
                }
            }
        });

        sock.ev.on('messages.upsert', async ({ messages }) => {
            const message = messages[0];
            if (!message.message || message.key.fromMe) return;
            
            await handleMessage(sock, message);
        });

    } catch (error) {
        console.error('Bot error:', error);
        setTimeout(() => startBot(), 5000);
    }
}

// Start
console.log('🔥 NIL BOT INITIALIZING...');
console.log('📁 Working Directory:', __dirname);
startBot();
