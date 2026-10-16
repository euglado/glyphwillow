# GlyphWillow

[Türkçe](#türkçe) · [English](#english)

## Türkçe

### Amaç ve özellikler

GlyphWillow, Discord topluluklarında kopyalanmış bir metnin neden beklenmedik göründüğünü incelemeye yardımcı olan gerçek bir Discord botudur. `/glyphwillow text:...` komutu, yalnızca komutu kullanan kişinin görebileceği düğmeli bir panel açar. Normal mesajları okumaz. GitHub Actions yalnızca kaynak kodunu test eder; botu çalıştırmaz.

- **Rapor:** UTF-16 birimi, Unicode kod noktası ve grafem kümesi sayısı; kontrol/biçim/satır-paragraf ayraçlarının ilk 12 bulgusu ve toplamları. Konumlar 1'den başlayan kod noktası konumlarıdır.
- **Kodlarla göster:** boşluklar, backtick, ters eğik çizgi ve ASCII dışı karakterler `\u{HEX}` olarak görünür. Görünmez karakterleri görünür bir kodla inceleyebilirsiniz.
- **Temiz önizleme:** seçili kontroller kaldırıldıktan sonra NFC normalizasyonu. Özgün metin veya Discord mesajları değiştirilmez. Bir uygulama/onay düğmesi veya dışarıya paylaşma işlevi yoktur.
- **Kapat:** RAM'deki panel kaydı silinir ve mevcut özel yanıtın içeriği değiştirilir.
- Discord dili Türkçeyse Türkçe, diğer durumlarda İngilizce arayüz.

**Sınırlar:** 1–1000 UTF-16 birimi, 5 dakikalık panel, en çok 100 açık panel, sunucu/kullanıcı başına 5 saniyede bir yeni komut, panel başına saniyede bir görüntü değişimi. Kapat, sürenin dolmasını beklemeden kullanılabilir; devam eden bir güncelleme varsa önce onun bitmesi gerekir. Aynı anda tek güncelleme yapılır. Görünümler Discord'un 2000 karakter sınırına göre kısaltılabilir; `[…]` kesilmeyi gösterir. Bu bir tam metin dönüştürücü, kimlik kontrolü, kötü amaçlı metin tarayıcısı, erişilebilirlik sertifikası veya güvenlik garantisi değildir. Benzer görünen harfleri, bütün görünmez karakterleri ve bütün Unicode özelliklerini saptamaz. Grafem kümeleri ekrandaki gerçek genişlik veya okuma süresi değildir.

### Gereksinimler

Windows, macOS veya Linux; internet; **Node.js 24.13 veya üzeri bir 24.x sürümü** (npm dahil); kendi Discord hesabınız ve bot uygulamanız; bot ekleme yetkinizin olduğu bir test sunucusu. Kaynak kodunu düzenlemeniz gerekmez. Tek kurulum tek sunucuyla sınırlıdır. Ücretli API, veritabanı, yapay zekâ hizmeti veya ses hizmeti yoktur. Discord ve npm bağlantısı gerekir; internet/hosting maliyetleri size aittir.

### Developer Portal ve kurulum

1. [Node.js](https://nodejs.org/en/download) yükleyin. Açık terminali kapatıp tekrar açın; `node --version` sonucunun 24.x, en az 24.13 olduğundan emin olun.
2. [Discord Developer Portal](https://discord.com/developers/applications) → **New Application** ile ayrı bir uygulama açın. **General Information → Application ID** değerini kopyalayın; bu gizli token değildir.
3. **Bot** sayfasında gerekiyorsa botu oluşturun, **Reset Token** ile token alın. Bu bir parola gibidir. Sohbete, ekran görüntüsüne, destek kaydına veya GitHub'a koymayın. Sızıntıda hemen Reset Token yapın. **Presence**, **Server Members**, **Message Content** ayrıcalıklı intent seçenekleri kapalı kalsın. Tek başınıza kullanıyorsanız Public Bot seçeneğini kapatabilirsiniz.
4. **Installation** bölümünde **Guild Install** kullanın; User Install'a ihtiyaç yoktur. Bot OAuth2 authorization-code akışı gerektirmez. Sunucu kurulumunda `bot` ve `applications.commands` kapsamları, yalnızca **View Channels / Kanalları Görüntüle** izni (1024) gerekir. **Administrator / Yönetici vermeyin.** Interactions Endpoint URL ayarlamayın; bot Gateway bağlantısı kullanır.
5. Discord **User Settings → Advanced → Developer Mode** açın. Test sunucusuna sağ tıklayın → **Copy Server ID**. Kanal veya kullanıcı kimliği kopyalamayın.
6. Bu depoda **Code → Download ZIP**, sonra ZIP'i kalıcı bir klasöre tamamen çıkarın. Windows'ta dosya uzantılarını görünür yapmak yardımcı olur. Git kullanıyorsanız `git clone https://github.com/euglado/glyphwillow.git` de kullanılabilir.
7. Windows'ta çıkarılan klasörde terminal açıp `setup.cmd` çalıştırın (PowerShell: `./setup.cmd`). macOS/Linux'ta Terminal'i o klasörde açıp aşağıdaki komutları kullanın:

   ```sh
   chmod +x setup.sh register.sh start.sh
   ./setup.sh
   ```

8. Yardımcı önce kilitli bağımlılıkları `npm ci --ignore-scripts` ile kurar. Application ID, Server ID ve token sorularını yanıtlayın. Token yazarken ekranda karakter veya yıldız görünmez; bu normaldir. Tokenı tek satır olarak yapıştırın ve Enter'a basın. Gerçek terminal gerekir; CI/pipeline/penceresiz giriş reddedilir. Esc veya çok satırlı yapıştırma başarısız olur; Ctrl+C iptal eder.
9. `.env` dosyası yerel oluşturulur; mevcut dosyanın üzerine yazılmaz. Kurulumun verdiği tıklanabilir Discord davet bağlantısını açın, doğru sunucuyu seçip izinleri gözden geçirin ve onaylayın. Sunucuya uygulama ekleme yetkisi gerekir.
10. Windows: `register.cmd`, ardından `start.cmd`. macOS/Linux: `./register.sh`, ardından `./start.sh`. İlk komut tokenın uygulama kimliğini doğrular ve sadece bu sunucuda `/glyphwillow` komutunu oluşturur/günceller; diğer komutları silmez. İkincisi botu başlatır. **GlyphWillow online** yazısını bekleyin.
11. Botun görebildiği test kanalında `/glyphwillow` seçin, `text` alanına sır içermeyen kısa bir metin girin. Rapor → Kodlarla göster → Temiz önizleme → Kapat akışını kontrol edin. Slash komutu menüsünde arayüz metni Türkçe/İngilizce olabilir; komut ve `text` seçeneği aynı kalır.

Yardımcılar hata verirse terminalde `npm ci --ignore-scripts`, `npm run setup`, `npm run register`, `npm start` komutlarını sırayla çalıştırabilirsiniz. Terminalde bot klasöründe olduğunuzdan emin olun. Tokenı komut satırı argümanına yazmayın. `.env` dosyasını Notepad benzeri bir editörle oluşturmanız istenmez.

### Yapılandırma ve izinler

Kurulum `.env` içinde `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, `DISCORD_GUILD_ID` değerlerini saklar. Bunlar ortam değişkeni olarak da verilebilir; önceden tanımlanmış ortam değişkenleri dosyadan önce gelir. Hosting sağlayıcısının secret panelini kullanın. Tokenı değiştirmek için botu durdurun, eski `.env` dosyasını güvenli biçimde kaldırın ve kurulumu yeniden çalıştırın; geçmiş/yedek kopyaları korumaya dikkat edin. Yanlış sunucuya kaydedilmiş komutu Portal'ın sunucu entegrasyon yönetiminden kaldırın; kayıt komutu eski sunucuları temizlemez.

Yalnızca **Guilds** Gateway intent'i kullanılır. Botta sadece View Channel gerekir; Send Messages, Read Message History, Manage Messages, Manage Roles, Mention Everyone veya Administrator gerekmez. Özel yanıtlar etkileşim webhook'u üzerinden döner. Administrator verilirse bot o kanalda komut ve düğmeleri reddeder. Kanal/rol ayarlarında bota yalnızca istediğiniz kanalları gösterin. Üyenin kanalı görmesi ve Discord'un **Use Application Commands** izni gerekir; sunucu yöneticisi komut erişimini **Server Settings → Integrations** altında sınırlandırabilir. Her etkileşimde Discord'un sağladığı üye/bot izinleri kontrol edilir; ayrı REST izin yenilemesi yapılmaz. İzinler işlemler arasında değişebilir.

### Kullanım ve dönüştürme politikası

Normal bir cümle, bir emoji dizisi veya bir editörden kopyaladığınız metni deneyin. Token, parola, kişisel veri, özel mesaj veya başkasının özel içeriğini göndermeyin. Gönderdiğiniz metin Discord'a ve botu çalıştıran bilgisayara gider. Görünmez harfler bazı dillerde gereklidir; rapor bir silme önerisi değildir.

Temizleme şu kod noktalarını kaldırır: U+061C, U+200B, U+200E–U+200F, U+202A–U+202E, U+2066–U+2069 ve U+FEFF. Ayrıca C0 (U+0000–U+001F) ve C1 (U+007F–U+009F) kontrollerinden TAB, LF ve CR dışındakileri kaldırır. Sonra NFC uygular; NFKC, harf küçültme veya transliterasyon yapmaz. **ZWJ U+200D, ZWNJ U+200C, varyasyon seçicileri ve diğer kontroller korunur.** Bidi kontrollerini kaldırmak metnin yönünü/anlamını değiştirebilir; kontrolün kaldırılması birleşen harflerin NFC'de birleşmesine yol açabilir.

Güvenli görüntüleme için temiz önizlemede kalan `Cc`, `Cf`, `Zl`, `Zp` karakterleri (LF/TAB hariç), ters eğik çizgi ve backtick kodla gösterilir. Dolayısıyla bu görünüm doğrudan kullanılacak tam bir temiz metin dışa aktarımı değildir; emoji birleştiricisi gibi korunan karakterler de `\u{200D}` şeklinde görünür. Önizlemeden kopyaladığınız kodlar otomatik olarak karaktere dönüşmez. Raporda varyasyon seçicisi gibi `Mn` karakterleri listelenmez. Kodlarla göster görünümünde ASCII dışı tüm karakterler kodla görünür. Kullanıcı metni kod bloğuyla sınırlanır; tüm yanıtlarda mention üretimi kapalıdır.

### Botu çalışır tutma

Kaynağı GitHub'da yayımlamak botu çevrimiçi yapmaz. `start` terminali açık ve bilgisayar uyanık, internete bağlı olmalıdır. Ctrl+C botu durdurur. Yeniden başlatma bütün panelleri geçersiz yapar. Eski düğmeler çalışmaz; yeni komut açın. Sürekli kullanım için kendi Node24 destekli sunucunuzu ve işletim sisteminizin süreç yöneticisini kullanabilirsiniz. Tek süreç/tek kopya çalıştırın; otomatik yeniden başlatmayı ve servis hesabının dosya erişimini kendiniz yapılandırın. GitHub Actions'ta veya ücretsiz zaman sınırlı CI işinde tokenla bot çalıştırmayın. Uzak sunucu kurulumu ve canlı Discord kurulumu bu deponun otomatik testleriyle yapılmaz.

### Güvenlik ve gizlilik

Panelde metin, dil, kullanıcı/sunucu/kanal/uygulama/özel yanıt kimlikleri, süre ve tıklama durumu RAM'de tutulur. En çok 100 kayıt vardır. 5 dakika sonra yeni işlemler reddedilir; 30 saniyelik temizlik döngüsü kaydı sonraki çalışmasında siler. Kapat anında RAM kaydını siler; Discord güncellemesi başarısız olsa da RAM kaydı silinmiş olur. Silinen JavaScript nesnelerinin bellekte fiziksel olarak sıfırlanması garanti edilmez. Komut hız sınırı için en çok 1000 sunucu/kullanıcı anahtarı 5 saniye tutulur; temizlik gecikmesi 30 saniyeye kadar olabilir.

Mesaj geçmişi, kullanıcı/üye listesi, DM, ses, dosya, web URL'si veya dış API içeriği okunmaz; veri tabanı, analiz, reklam, telemetri veya içerik logu yoktur. discord.js mesaj/üye/kullanıcı/presence/reaction önbellekleri sıfır sınırlıdır; Gateway'in sunucu/kanal/rol metadata önbellekleri ve botun kendi bağlantı bilgileri yine bulunur. Discord ve hosting sağlayıcısının kendi kayıtları bu uygulamanın kontrolü dışındadır. Hata mesajları tokenı/ham hata nesnesini yazdırmaz. Beş dakika sonra eski özel yanıt Discord istemcisinde kalabilir; kapanış bütün Discord kopyalarını silmez. Panel sunucu/kullanıcı/kanal/uygulama/yanıt kimliklerine bağlanır; başka kişi veya mesaj için düğme kullanılamaz. [PRIVACY.md](PRIVACY.md) ve [SECURITY.md](SECURITY.md) ek bilgi içerir.

`.env` Git tarafından yok sayılır. POSIX sistemlerinde yeni dosya 0600 izinle oluşturulur; Windows'ta kullanıcı klasörü ACL'lerini ayrıca koruyun. Tüm bot klasörünü içeren yedek/ZIP dosyasını paylaşmayın. Gerçek tokenları test etmeyin veya issue'lara koymayın.

### Sorun giderme

- **node/npm bulunamadı veya sözdizimi hatası:** Node24.13+ 24.x yükleyin, terminali yeniden açın. Node18/20/22 veya 25 bu proje için test edilen hedef değildir.
- **Kurulum token göstermiyor:** normaldir. Gerçek terminal kullanın; tek satır token girin. `.env already exists` durumunda mevcut yapılandırmanın üzerine yazılmaz; botu durdurup eski dosyayı güvenli kaldırarak yeniden kurun.
- **Registration failed:** Application ID ve token aynı uygulamadan mı, Server ID doğru mu, bot o sunucuya kurulu mu kontrol edin. Tokenı paylaşmayın. Gerekirse Portal'da Reset Token yapıp yeniden kurun.
- **Komut menüde yok:** `register` komutunu çalıştırın; doğru sunucuyu, Use Application Commands iznini ve Integrations kısıtlarını kontrol edin. Discord istemcisini yenileyin.
- **Panel expired/access unavailable:** 5 saniye bekleyip yeni komut açın. Panel 5 dakika sonra veya bot yeniden başlatıldığında geçersiz olur. Botta Administrator varsa kaldırın; üye ve bot için View Channel erişimini kontrol edin. Başka sunucuda kullanılamaz.
- **Temizlenmiş görünümde kodlar var:** korunan biçim karakterleri güvenli inceleme için kodla gösterilir. Bu bir tek tıklamalı tam metin dışa aktarımı değildir.
- **Metin kesildi:** daha kısa bir örnek kullanın; rapor ilk 12 bulguyu, diğer görünümler sınırlı bir bölümü gösterir.
- **Bot çevrimdışı:** `start` terminali, internet, uyku modu ve tokenı kontrol edin. Tek süreç çalıştırın. Hata raporunda metni/tokenı, `.env` dosyasını ve özel kimlikleri silin.

### Testler, katkı ve lisans

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/verify.mjs
bash -n setup.sh register.sh start.sh
```

`check`, önerilen Biome lint/format/import kontrolleri, sıkı TypeScript (bağımlılık türleri dahil), Node testleri, kilit dosyasındaki lisans/registry/SHA-512/install-script metadatası ve seçili gizli bilgi örüntülerini kontrol eder. Örüntü taraması bir sır bulunmadığı garantisi değildir. Üç işletim sistemli CI yalnızca read-only GitHub izni ve SHA'ya sabitlenmiş Actions kullanır; token istemez. Testler gerçek Discord kurulumunu veya bir ekran okuyucu doğrulamasını kapsamaz; etkileşim/terminal taklitleri ve yapılandırılmamış süreç çalıştırmaları kullanır. Canlı sunucuda gerçek düğmeler, izinler, gizli terminal girişi, mobil/ekran okuyucu ve sürekli hosting ayrıca operatörce denenmelidir. VDS testi kullanılmadı.

[CONTRIBUTING.md](CONTRIBUTING.md) adımlarını izleyin, değişiklikler için test ekleyin, en az izin ve özel yanıt varsayılanını koruyun. Hassas bilgileri issue'lara koymayın. [MIT lisansı](LICENSE); garanti verilmez.

## English

### Purpose and features

GlyphWillow is a real Discord bot that helps communities inspect why pasted text looks unexpected. `/glyphwillow text:...` opens a private button panel for the invoking person. It never reads ordinary messages. GitHub Actions tests the source; it does not host the bot.

- **Report:** counts UTF-16 units, Unicode code points and grapheme clusters; shows the first 12 control/format/line-paragraph separator findings and totals. Positions are one-based code-point positions.
- **Show codes:** spaces, backticks, backslashes and non-ASCII characters appear as `\u{HEX}` notation.
- **Clean preview:** removes a documented selection of controls, then normalizes to NFC. No original message or submitted text is edited. There is no apply, public-share or export action.
- **Close:** removes the RAM panel record and replaces the current private response.
- Turkish UI for Discord's Turkish locale; English otherwise.

Limits: 1–1000 UTF-16 units; five-minute panels; at most 100 open panels; one command per server/person every five seconds; one view change per second per panel; one concurrent update. Close bypasses the click interval but must wait for any update already in progress. Responses may be shortened to fit Discord's 2000-character limit; `[…]` marks truncation. This is not a full text converter, security scanner, identity check or accessibility certification. It does not find every invisible character, Unicode property or lookalike letter. Grapheme counts do not measure actual rendered width or reading time.

### Requirements

Windows, macOS or Linux; internet; **Node.js 24.13+ within the 24.x series**, including npm; your own Discord application/account; a test server where you may install apps. No source editing, database, paid API, AI or audio service is required. One installation handles one configured server. Discord/npm connectivity and hosting costs are your responsibility.

### Developer Portal and installation

1. Install [Node.js](https://nodejs.org/en/download), reopen your terminal and check `node --version`: 24.x, at least 24.13.
2. In the [Discord Developer Portal](https://discord.com/developers/applications), choose **New Application**. Copy **General Information → Application ID**; this ID is not the secret token.
3. Open **Bot**, create the bot if needed and use **Reset Token**. Treat the token as a password. Never post it in chats, screenshots, support requests or GitHub. Reset it immediately after a leak. Keep privileged **Presence**, **Server Members** and **Message Content** intents disabled. You may disable Public Bot for your personal installation.
4. In **Installation**, use **Guild Install**. User Install and OAuth2 authorization-code flow are unnecessary. Scopes: `bot` and `applications.commands`; permission: only **View Channels**, numeric value 1024. **Never grant Administrator.** Leave Interactions Endpoint URL empty; this bot uses a Gateway connection.
5. In Discord **User Settings → Advanced**, enable **Developer Mode**. Right-click your test server → **Copy Server ID**. Do not copy a channel or user ID instead.
6. Choose this repository's **Code → Download ZIP** and extract the entire archive to a permanent folder. Alternatively, `git clone https://github.com/euglado/glyphwillow.git`.
7. Windows: open a terminal in that folder and run `setup.cmd` (PowerShell: `./setup.cmd`). macOS/Linux: open Terminal in the folder and run:

   ```sh
   chmod +x setup.sh register.sh start.sh
   ./setup.sh
   ```

8. Setup installs locked dependencies using `npm ci --ignore-scripts`, then asks for Application ID, Server ID and token. Token entry displays no characters or asterisks. Paste one token line and press Enter. A real terminal is required; redirected input is refused. Escape sequences and multiline paste fail; Ctrl+C cancels.
9. Setup creates local `.env` without overwriting an existing file. Open the printed clickable Discord invite, review the server and permissions, then approve installation. You need permission to install apps in that server.
10. Windows: run `register.cmd`, then `start.cmd`. macOS/Linux: `./register.sh`, then `./start.sh`. Registration verifies the token's application identity and upserts just this command in the configured server without deleting unrelated commands. Wait for **GlyphWillow online**.
11. In a test channel the bot can view, select `/glyphwillow`, put a short non-secret sample in `text`, and try Report → Show codes → Clean preview → Close. Command/option names stay the same in both languages.

If helpers fail, run `npm ci --ignore-scripts`, `npm run setup`, `npm run register` and `npm start` in order from the bot folder. Do not put the token in command-line arguments. No manual source or `.env` editing is needed.

### Configuration and permissions

Setup saves `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID` and `DISCORD_GUILD_ID` in `.env`. Hosting providers may supply these through secret environment variables instead; existing environment variables take precedence over the file. To change tokens, stop the bot, safely remove the old `.env` and rerun setup. Protect backups. Remove a command registered to an old server through Discord's integration management; registration does not clean other servers.

Only the **Guilds** Gateway intent and **View Channel** bot permission are used. Send Messages, Read Message History, Manage Messages, Manage Roles, Mention Everyone and Administrator are unnecessary. Private responses use interaction webhooks. Bot Administrator permission causes interactions to be refused. Limit channel visibility through server roles/overwrites. Members need channel access and Discord's **Use Application Commands** permission; administrators can restrict the command in **Server Settings → Integrations**. Each interaction checks the member/bot permission snapshot supplied by Discord; there is no fresh REST permission read. Permissions may change between operations.

### Usage and transformation policy

Try a sentence, emoji sequence or a pasted editor sample. Never submit passwords, tokens, personal data, private messages or someone else's private content. Submitted text reaches Discord and the bot operator's machine. Some invisible characters are necessary for written languages; a finding is not a recommendation to delete it.

Cleaning removes U+061C, U+200B, U+200E–U+200F, U+202A–U+202E, U+2066–U+2069 and U+FEFF, plus C0 U+0000–U+001F and C1 U+007F–U+009F controls except TAB, LF and CR. It then applies NFC, never NFKC, case folding or transliteration. **ZWJ U+200D, ZWNJ U+200C, variation selectors and other controls are retained.** Removing directional controls can change direction/meaning; removing a control may allow combining characters to compose under NFC.

For safe display, clean preview renders remaining `Cc`, `Cf`, `Zl`, `Zp` characters except LF/TAB, backslashes and backticks as codes. This makes it a diagnostic preview rather than a complete clean-text export. Retained emoji joiners therefore appear as `\u{200D}`; copied codes do not automatically become characters. Reports do not list `Mn` characters such as variation selectors. Show codes renders every non-ASCII character as notation. Submitted text is contained in a code block and mentions are disabled in every response.

### Keeping the bot online

Publishing this source does not run the bot. The start terminal must stay open and the computer awake and connected. Ctrl+C stops it. Restarting invalidates all panels; open a new command. For continuous use, choose your own Node24 host and operating-system process manager. Run one process/copy only; configure restart behavior, service-account access and secret storage yourself. Do not run the bot with a token in GitHub Actions or time-limited CI. Remote deployment and live Discord installation are not part of the automated tests.

### Security and privacy

Up to 100 RAM panel records hold submitted text, language, user/server/channel/application/private-response IDs, expiry and click state. At five minutes new actions are rejected; the 30-second pruning loop removes the record on its next pass. Close removes it immediately, even if updating Discord fails. Physical zeroing of JavaScript object memory is not guaranteed. Up to 1000 server/user command-cooldown keys last five seconds, with up to 30 seconds of pruning delay.

No message history, member/user list, DMs, voice, attachments, URL contents or external content API is read. No database, analytics, advertising, telemetry or content logs. discord.js message/member/user/presence/reaction caches are set to zero; Gateway guild/channel/role metadata caches and the bot's own connection information still exist. Discord/hosting provider logs are outside this application's control. Raw errors and tokens are not logged. Old private responses can remain in Discord after expiry; Close cannot erase every Discord copy. Controls are bound to the initiating person, server, channel, application and private message. See [PRIVACY.md](PRIVACY.md) and [SECURITY.md](SECURITY.md).

Git ignores `.env`. POSIX creation uses 0600; protect folder ACLs on Windows separately. Never share a ZIP/backup of your configured folder. Do not test real credentials or include them in issues.

### Troubleshooting

- **node/npm missing or syntax error:** install Node24.13+ within 24.x and reopen the terminal. Node18/20/22/25 are not this project's tested target.
- **No token characters appear:** expected. Use a real terminal and one-line token. Existing `.env` is never overwritten; stop the bot and safely remove it before reconfiguration.
- **Registration failed:** check that token/Application ID belong together, Server ID is correct and the app is installed in that server. Never share the token; reset/reconfigure when needed.
- **Command absent:** run registration, check the server, Use Application Commands and Integrations restrictions, then refresh Discord.
- **Panel expired/access unavailable:** wait five seconds and open a new command. Restart/expiry invalidates panels. Remove bot Administrator and check both member/bot View Channel access. Only the configured server is accepted.
- **Codes in clean preview:** remaining formats are shown as notation for inspection. This is not a one-click full-text exporter.
- **Truncated text:** use a shorter example. Reports show 12 findings and views show a bounded excerpt.
- **Bot offline:** check the start terminal, connectivity, sleep mode and token. Run one process. Redact text, tokens, `.env` and private IDs before reporting an error.

### Tests, contributing and license

```sh
npm ci --ignore-scripts
npm run check
npm audit --audit-level=low
node --check scripts/setup.mjs
node --check scripts/verify.mjs
bash -n setup.sh register.sh start.sh
```

`check` runs recommended Biome formatting/lint/import checks, strict TypeScript including dependency types, Node tests, dependency license/registry/SHA-512/install-script metadata checks and selected secret-pattern scans. Pattern scanning cannot prove that no secret exists. Three-OS CI uses read-only GitHub permissions and commit-pinned Actions without bot secrets. Tests mock interaction/terminal transport and run unconfigured entrypoints; they do not validate a live Discord installation or screen reader. An operator must separately test live buttons, permissions, hidden terminal entry, mobile/screen-reader behavior and continuous hosting. No VDS test was used.

Follow [CONTRIBUTING.md](CONTRIBUTING.md), add meaningful tests and preserve minimum permissions/private defaults. Keep sensitive information out of issues. [MIT license](LICENSE); provided without warranty.

### Official references / Resmî kaynaklar

[Discord interactions](https://docs.discord.com/developers/interactions/receiving-and-responding), [application commands](https://docs.discord.com/developers/interactions/application-commands), [Gateway](https://docs.discord.com/developers/events/gateway), [Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy), [Unicode normalization](https://www.unicode.org/reports/tr15/), [bidirectional algorithm](https://www.unicode.org/reports/tr9/). Unicode references explain the standards; this bot implements only the selection documented above.
