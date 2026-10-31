// Planetar Carnival - single-file Worker (page + game script embedded)
import { DurableObject } from "cloudflare:workers";

const INDEX_HTML = "<!doctype html>\n<html lang=\"en\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no\">\n<title>Planetar Carnival</title>\n<style>\n  :root{\n    --bg:#120c24; --panel:rgba(22,14,44,.78); --line:rgba(255,255,255,.14);\n    --text:#f4efff; --muted:#b3a8d6; --a:#ff3dcb; --b:#ffb23d; --c:#38d6ff;\n  }\n  *{box-sizing:border-box}\n  html,body{margin:0;height:100%;background:var(--bg);color:var(--text);font-family:system-ui,-apple-system,\"Segoe UI\",Roboto,sans-serif;overflow:hidden;-webkit-user-select:none;user-select:none}\n  canvas#c{position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none}\n  .panel{background:var(--panel);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--line);border-radius:14px}\n  button{font:inherit;color:inherit;cursor:pointer}\n  .btn{background:linear-gradient(135deg,var(--a),var(--b));border:0;color:#1a0d2e;font-weight:700;padding:9px 14px;border-radius:10px}\n  .btn.ghost{background:rgba(255,255,255,.08);color:var(--text);border:1px solid var(--line);font-weight:600}\n  .btn.sm{padding:4px 8px;font-size:12px;border-radius:7px}\n  input,textarea{font:inherit;color:var(--text);background:rgba(255,255,255,.07);border:1px solid var(--line);border-radius:10px;padding:9px 11px;width:100%;outline:none;-webkit-user-select:text;user-select:text}\n  input:focus,textarea:focus{border-color:var(--c)}\n  [hidden]{display:none!important}\n\n  #login{position:fixed;inset:0;z-index:50;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 30%,#3a1768 0%,#120c24 70%);padding:16px}\n  #login form{width:min(380px,100%);padding:26px;text-align:center}\n  #login h1{margin:0 0 4px;font-size:30px;letter-spacing:.06em;background:linear-gradient(90deg,var(--a),var(--b),var(--c));-webkit-background-clip:text;background-clip:text;color:transparent}\n  #login p.sub{margin:0 0 18px;color:var(--muted)}\n  #login label{display:block;text-align:left;font-size:13px;color:var(--muted);margin:12px 0 5px}\n  #loginErr{color:#ff7a90;min-height:20px;margin:10px 0 0;font-size:14px}\n  #login .btn{width:100%;margin-top:10px;padding:12px}\n\n  #top{position:fixed;top:10px;left:10px;right:10px;z-index:10;display:flex;justify-content:space-between;gap:10px;pointer-events:none}\n  #top>*{pointer-events:auto}\n  #brand{padding:8px 14px;font-weight:800;letter-spacing:.08em}\n  #brand small{display:block;font-weight:500;letter-spacing:0;color:var(--muted);font-size:12px}\n  #tools{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap;justify-content:flex-end}\n  .seg{display:flex;padding:3px;gap:3px}\n  .seg button{background:transparent;border:0;padding:6px 10px;border-radius:9px;font-weight:700;font-size:13px;color:var(--muted)}\n  .seg button.on{background:linear-gradient(135deg,var(--a),var(--b));color:#1a0d2e}\n  #vol{display:flex;align-items:center;gap:8px;padding:6px 10px;font-size:13px}\n  #vol input{width:90px;padding:0;accent-color:var(--a)}\n  #nowPlaying{max-width:210px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--muted)}\n\n  #chat{position:fixed;left:10px;bottom:10px;z-index:10;width:min(360px,calc(100vw - 20px));padding:10px;display:flex;flex-direction:column;gap:8px}\n  #chatLog{height:150px;overflow-y:auto;font-size:14px;line-height:1.35;-webkit-user-select:text;user-select:text}\n  #chatLog div{margin-bottom:3px;word-break:break-word}\n  #chatLog .sys{color:var(--muted);font-style:italic}\n  #chatLog b.f{color:var(--b)}\n  #chatForm{display:flex;gap:6px}\n\n  #pollPanel{position:fixed;right:10px;top:70px;z-index:10;width:min(300px,calc(100vw - 20px));padding:14px}\n  #pollPanel h3{margin:0 0 4px;font-size:12px;letter-spacing:.1em;color:var(--c);text-transform:uppercase}\n  #pollQ{font-weight:700;margin-bottom:10px}\n  .opt{position:relative;display:block;width:100%;text-align:left;margin-bottom:7px;padding:9px 11px;background:rgba(255,255,255,.06);border:1px solid var(--line);border-radius:10px;overflow:hidden}\n  .opt .bar{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,rgba(255,61,203,.4),rgba(255,178,61,.4));width:0;transition:width .4s}\n  .opt span{position:relative;display:flex;justify-content:space-between;gap:8px}\n  .opt.mine{border-color:var(--b)}\n  .opt:disabled{cursor:default}\n  #pollMeta{font-size:12px;color:var(--muted)}\n\n  #adminBtn{position:fixed;right:10px;bottom:10px;z-index:12}\n  #admin{position:fixed;right:10px;bottom:56px;top:70px;z-index:11;width:min(340px,calc(100vw - 20px));padding:14px;overflow-y:auto}\n  #admin h3{margin:16px 0 8px;font-size:12px;letter-spacing:.1em;color:var(--c);text-transform:uppercase}\n  #admin h3:first-child{margin-top:0}\n  .row{display:flex;gap:6px;align-items:center;flex-wrap:wrap}\n  #upBar{height:6px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:8px}\n  #upBar i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--a),var(--b))}\n  .slots{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}\n  .slot{aspect-ratio:1;border:1px dashed var(--line);border-radius:8px;display:grid;place-items:center;font-size:11px;color:var(--muted);background-size:cover;background-position:center;cursor:pointer;position:relative}\n  .slot b{position:absolute;left:3px;top:2px;font-size:10px;color:#fff;text-shadow:0 0 3px #000}\n  .item{display:flex;gap:8px;align-items:center;padding:6px;border:1px solid var(--line);border-radius:10px;margin-bottom:6px}\n  .item img{width:46px;height:46px;object-fit:cover;border-radius:7px;flex:none}\n  .item .nm{flex:1;min-width:0;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}\n  .item .acts{display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}\n  .file{display:block;padding:10px;text-align:center;border:1px dashed var(--line);border-radius:10px;cursor:pointer;color:var(--muted);font-size:13px}\n  .file input{display:none}\n\n  #hint{position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9;color:var(--muted);font-size:13px;text-align:center;pointer-events:none;text-shadow:0 1px 4px #000;width:min(420px,50vw)}\n  #toast{position:fixed;left:50%;top:70px;transform:translateX(-50%);z-index:60;padding:10px 16px;background:var(--panel);border:1px solid var(--line);border-radius:12px;transition:opacity .3s;opacity:0;pointer-events:none}\n  #toast.on{opacity:1}\n  #toast.err{border-color:#ff7a90}\n  #soundPrompt{position:fixed;left:50%;top:120px;transform:translateX(-50%);z-index:30}\n  #joy{position:fixed;left:24px;bottom:210px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid var(--line);z-index:8;display:none;touch-action:none}\n  #joy i{position:absolute;left:40px;top:40px;width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,.3)}\n  @media (pointer:coarse){#joy{display:block}#hint{display:none}}\n  @media (max-width:640px){#nowPlaying{display:none}#brand small{display:none}}\n</style>\n<script type=\"importmap\">\n{ \"imports\": { \"three\": \"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js\" } }\n</script>\n</head>\n<body>\n<canvas id=\"c\"></canvas>\n\n<div id=\"login\">\n  <form id=\"loginForm\" class=\"panel\" autocomplete=\"off\">\n    <h1>PLANETAR</h1>\n    <p class=\"sub\" data-i18n=\"subtitle\"></p>\n    <div class=\"seg\" style=\"justify-content:center;margin-bottom:6px;display:inline-flex\" id=\"langLogin\"></div>\n    <label for=\"name\" data-i18n=\"nameLabel\"></label>\n    <input id=\"name\" maxlength=\"16\" required data-i18n-ph=\"namePh\">\n    <div id=\"pinRow\" hidden>\n      <label for=\"pin\" data-i18n=\"pinLabel\"></label>\n      <input id=\"pin\" type=\"password\" autocomplete=\"current-password\">\n    </div>\n    <p id=\"loginErr\"></p>\n    <button class=\"btn\" type=\"submit\" data-i18n=\"enter\"></button>\n  </form>\n</div>\n\n<div id=\"top\" hidden>\n  <div id=\"brand\" class=\"panel\">PLANETAR CARNIVAL<small><span id=\"online\"></span></small></div>\n  <div id=\"tools\">\n    <div id=\"vol\" class=\"panel\">\n      <span id=\"nowPlaying\"></span>\n      <span data-i18n=\"volume\"></span>\n      <input id=\"volume\" type=\"range\" min=\"0\" max=\"1\" step=\"0.01\" value=\"0.7\">\n    </div>\n    <div class=\"seg panel\" id=\"langBar\"></div>\n  </div>\n</div>\n\n<div id=\"pollPanel\" class=\"panel\" hidden>\n  <h3 data-i18n=\"poll\"></h3>\n  <div id=\"pollQ\"></div>\n  <div id=\"pollOpts\"></div>\n  <div id=\"pollMeta\"></div>\n</div>\n\n<div id=\"chat\" class=\"panel\" hidden>\n  <div id=\"chatLog\"></div>\n  <form id=\"chatForm\">\n    <input id=\"chatIn\" maxlength=\"200\" data-i18n-ph=\"chatPh\" autocomplete=\"off\">\n    <button class=\"btn\" type=\"submit\" data-i18n=\"send\"></button>\n  </form>\n</div>\n\n<button id=\"adminBtn\" class=\"btn\" hidden data-i18n=\"admin\"></button>\n<div id=\"admin\" class=\"panel\" hidden>\n  <h3 data-i18n=\"uploadH\"></h3>\n  <div class=\"row\">\n    <label class=\"file\" style=\"flex:1\"><span data-i18n=\"uploadPhoto\"></span><input id=\"upPhoto\" type=\"file\" accept=\"image/png,image/jpeg,image/webp,image/gif\"></label>\n    <label class=\"file\" style=\"flex:1\"><span data-i18n=\"uploadMusic\"></span><input id=\"upMusic\" type=\"file\" accept=\"audio/*\"></label>\n  </div>\n  <div id=\"upBar\" hidden><i></i></div>\n\n  <h3 data-i18n=\"screensH\"></h3>\n  <div class=\"slots\" id=\"slots\"></div>\n\n  <h3 data-i18n=\"photosH\"></h3>\n  <div id=\"photoList\"></div>\n\n  <h3 data-i18n=\"musicH\"></h3>\n  <div id=\"musicList\"></div>\n\n  <h3 data-i18n=\"newPoll\"></h3>\n  <input id=\"pollQuestion\" maxlength=\"140\" data-i18n-ph=\"question\" style=\"margin-bottom:6px\">\n  <textarea id=\"pollOptions\" rows=\"4\" data-i18n-ph=\"options\"></textarea>\n  <div class=\"row\" style=\"margin-top:8px\">\n    <button class=\"btn sm\" id=\"pollStart\" data-i18n=\"startPoll\"></button>\n    <button class=\"btn ghost sm\" id=\"pollClose\" data-i18n=\"closePoll\"></button>\n    <button class=\"btn ghost sm\" id=\"pollClear\" data-i18n=\"clearPoll\"></button>\n  </div>\n</div>\n\n<button id=\"soundPrompt\" class=\"btn\" hidden data-i18n=\"enableSound\"></button>\n<div id=\"hint\" data-i18n=\"hint\"></div>\n<div id=\"toast\"></div>\n<div id=\"joy\"><i></i></div>\n\n<script type=\"module\" src=\"/game.js\"></script>\n</body>\n</html>\n";

const GAME_JS = "import * as THREE from \"three\";\n\n/* ============================================================\n   Helpers + i18n (EN / UK / RU)\n   ============================================================ */\nconst $ = (s) => document.querySelector(s);\nconst LS = {\n  get(k) { try { return localStorage.getItem(k); } catch { return null; } },\n  set(k, v) { try { localStorage.setItem(k, v); } catch {} },\n};\n\nconst I18N = {\n  en: {\n    subtitle: \"3D carnival of the Planetar game studio\", nameLabel: \"Your name\", namePh: \"e.g. Alex\",\n    pinLabel: \"Founder password\", enter: \"Enter the carnival\",\n    errName: \"Name: 2–16 letters, digits, space, - or _\", errPin: \"Wrong founder password\",\n    errTaken: \"This name is already taken. Pick another one.\", errAdmin: \"Founder password is not configured on the server\",\n    errFull: \"The carnival is full\", errNet: \"Connection error, try again\",\n    online: \"online\", chatPh: \"Say something…\", send: \"Send\", poll: \"Poll\", votes: \"votes\", total: \"Total votes\",\n    closed: \"Voting closed\", voteHint: \"Tap an option to vote\", admin: \"Founder panel\",\n    uploadH: \"Upload\", uploadPhoto: \"+ Photo\", uploadMusic: \"+ Music\",\n    screensH: \"Screens & hologram (tap to clear)\", photosH: \"Photos\", musicH: \"Music\",\n    newPoll: \"New poll\", question: \"Question\", options: \"Options, one per line (2–6)\",\n    startPoll: \"Start poll\", closePoll: \"Close\", clearPoll: \"Remove\", volume: \"Volume\",\n    hint: \"WASD / arrows – move · drag – look · wheel – zoom\", joined: \"joined the carnival\", left: \"left\",\n    uploading: \"Uploading…\", uploaded: \"Uploaded\", failed: \"Upload failed\", tooBig: \"File is too big (photo ≤ 4 MB, music ≤ 15 MB)\",\n    nowPlaying: \"Now playing\", enableSound: \"Tap to enable sound\", replaced: \"You opened the carnival in another tab\",\n    holo: \"HOLO\", empty: \"—\", del: \"Delete\", play: \"Play\", stop: \"Stop\", pollStarted: \"Translating the poll…\",\n    reconnecting: \"Reconnecting…\", founder: \"Founder\",\n  },\n  uk: {\n    subtitle: \"3D-карнавал ігрової студії Planetar\", nameLabel: \"Ваше ім’я\", namePh: \"наприклад, Олексій\",\n    pinLabel: \"Пароль засновника\", enter: \"Увійти в карнавал\",\n    errName: \"Ім’я: 2–16 літер, цифр, пробіл, - або _\", errPin: \"Невірний пароль засновника\",\n    errTaken: \"Це ім’я вже зайняте. Оберіть інше.\", errAdmin: \"Пароль засновника не налаштовано на сервері\",\n    errFull: \"Карнавал переповнений\", errNet: \"Помилка з’єднання, спробуйте ще раз\",\n    online: \"онлайн\", chatPh: \"Напишіть щось…\", send: \"Надіслати\", poll: \"Голосування\", votes: \"голосів\", total: \"Усього голосів\",\n    closed: \"Голосування закрито\", voteHint: \"Натисніть варіант, щоб проголосувати\", admin: \"Панель засновника\",\n    uploadH: \"Завантаження\", uploadPhoto: \"+ Фото\", uploadMusic: \"+ Музика\",\n    screensH: \"Екрани та голограма (тап — очистити)\", photosH: \"Фото\", musicH: \"Музика\",\n    newPoll: \"Нове голосування\", question: \"Питання\", options: \"Варіанти, по одному в рядок (2–6)\",\n    startPoll: \"Запустити\", closePoll: \"Закрити\", clearPoll: \"Прибрати\", volume: \"Гучність\",\n    hint: \"WASD / стрілки – рух · перетягування – огляд · колесо – масштаб\", joined: \"зайшов(ла) на карнавал\", left: \"вийшов(ла)\",\n    uploading: \"Завантаження…\", uploaded: \"Завантажено\", failed: \"Не вдалося завантажити\", tooBig: \"Файл завеликий (фото ≤ 4 МБ, музика ≤ 15 МБ)\",\n    nowPlaying: \"Грає\", enableSound: \"Натисніть, щоб увімкнути звук\", replaced: \"Ви відкрили карнавал в іншій вкладці\",\n    holo: \"ГОЛО\", empty: \"—\", del: \"Видалити\", play: \"Грати\", stop: \"Стоп\", pollStarted: \"Перекладаю голосування…\",\n    reconnecting: \"Перепідключення…\", founder: \"Засновник\",\n  },\n  ru: {\n    subtitle: \"3D-карнавал игровой студии Planetar\", nameLabel: \"Ваше имя\", namePh: \"например, Алексей\",\n    pinLabel: \"Пароль основателя\", enter: \"Войти в карнавал\",\n    errName: \"Имя: 2–16 букв, цифр, пробел, - или _\", errPin: \"Неверный пароль основателя\",\n    errTaken: \"Это имя уже занято. Выберите другое.\", errAdmin: \"Пароль основателя не настроен на сервере\",\n    errFull: \"Карнавал переполнен\", errNet: \"Ошибка соединения, попробуйте ещё раз\",\n    online: \"онлайн\", chatPh: \"Напишите что-нибудь…\", send: \"Отправить\", poll: \"Голосование\", votes: \"голосов\", total: \"Всего голосов\",\n    closed: \"Голосование закрыто\", voteHint: \"Нажмите вариант, чтобы проголосовать\", admin: \"Панель основателя\",\n    uploadH: \"Загрузка\", uploadPhoto: \"+ Фото\", uploadMusic: \"+ Музыка\",\n    screensH: \"Экраны и голограмма (тап — очистить)\", photosH: \"Фото\", musicH: \"Музыка\",\n    newPoll: \"Новое голосование\", question: \"Вопрос\", options: \"Варианты, по одному в строке (2–6)\",\n    startPoll: \"Запустить\", closePoll: \"Закрыть\", clearPoll: \"Убрать\", volume: \"Громкость\",\n    hint: \"WASD / стрелки – движение · перетаскивание – обзор · колесо – масштаб\", joined: \"зашёл(ла) на карнавал\", left: \"вышел(ла)\",\n    uploading: \"Загрузка…\", uploaded: \"Загружено\", failed: \"Не удалось загрузить\", tooBig: \"Файл слишком большой (фото ≤ 4 МБ, музыка ≤ 15 МБ)\",\n    nowPlaying: \"Играет\", enableSound: \"Нажмите, чтобы включить звук\", replaced: \"Вы открыли карнавал в другой вкладке\",\n    holo: \"ГОЛО\", empty: \"—\", del: \"Удалить\", play: \"Играть\", stop: \"Стоп\", pollStarted: \"Перевожу голосование…\",\n    reconnecting: \"Переподключение…\", founder: \"Основатель\",\n  },\n};\nconst LANG_BTNS = [[\"en\", \"EN\"], [\"uk\", \"УКР\"], [\"ru\", \"РУС\"]];\nlet lang = LS.get(\"planetar.lang\") || (navigator.language || \"en\").slice(0, 2).toLowerCase();\nif (!I18N[lang]) lang = \"en\";\nconst t = (k) => I18N[lang][k] ?? I18N.en[k] ?? k;\n\n/* ============================================================\n   App state\n   ============================================================ */\nlet me = null;            // {id,name,role}\nlet token = null;\nlet ws = null;\nlet gotInit = false;\nlet failCount = 0;\nlet pingTimer = null;\nlet skew = 0;             // serverNow - localNow\nlet state = { media: [], screens: [null, null, null, null, null], music: { id: null, startedAt: 0 }, poll: null };\nlet myVote = null;        // {pollId,opt}\nconst chatItems = [];     // chat + system lines (kept so we can re-render in another language)\nconst isFounder = () => me && me.role === \"founder\";\n\nfunction toast(msg, err = false) {\n  const el = $(\"#toast\");\n  el.textContent = msg;\n  el.classList.toggle(\"err\", err);\n  el.classList.add(\"on\");\n  clearTimeout(toast.tm);\n  toast.tm = setTimeout(() => el.classList.remove(\"on\"), 3200);\n}\n\n/* ============================================================\n   Language switching\n   ============================================================ */\nfunction buildLangButtons(container) {\n  container.innerHTML = \"\";\n  for (const [code, label] of LANG_BTNS) {\n    const b = document.createElement(\"button\");\n    b.type = \"button\";\n    b.textContent = label;\n    b.dataset.lang = code;\n    b.addEventListener(\"click\", () => setLang(code));\n    container.appendChild(b);\n  }\n}\nbuildLangButtons($(\"#langBar\"));\nbuildLangButtons($(\"#langLogin\"));\n\nfunction setLang(l) {\n  lang = l;\n  LS.set(\"planetar.lang\", l);\n  document.documentElement.lang = l;\n  document.querySelectorAll(\"[data-i18n]\").forEach((el) => (el.textContent = t(el.dataset.i18n)));\n  document.querySelectorAll(\"[data-i18n-ph]\").forEach((el) => (el.placeholder = t(el.dataset.i18nPh)));\n  document.querySelectorAll(\"[data-lang]\").forEach((b) => b.classList.toggle(\"on\", b.dataset.lang === l));\n  updateOnline();\n  renderChat();\n  renderPoll();\n  renderAdmin();\n  updateNowPlaying();\n  refreshHoloLabel();\n}\n\n/* ============================================================\n   Login\n   ============================================================ */\nconst nameIn = $(\"#name\"), pinIn = $(\"#pin\"), pinRow = $(\"#pinRow\"), loginErr = $(\"#loginErr\");\nnameIn.addEventListener(\"input\", () => { pinRow.hidden = nameIn.value.trim().toLowerCase() !== \"misha\"; });\nconst savedName = LS.get(\"planetar.name\");\nif (savedName) { nameIn.value = savedName; nameIn.dispatchEvent(new Event(\"input\")); }\n\n$(\"#loginForm\").addEventListener(\"submit\", async (e) => {\n  e.preventDefault();\n  loginErr.textContent = \"\";\n  const name = nameIn.value.trim().replace(/\\s+/g, \" \");\n  const lower = name.toLowerCase();\n  initAudioGraph(); // inside a user gesture\n  try {\n    const r = await fetch(\"/api/login\", {\n      method: \"POST\",\n      headers: { \"content-type\": \"application/json\" },\n      body: JSON.stringify({ name, pin: pinIn.value, token: LS.get(\"planetar.token.\" + lower) }),\n    });\n    const data = await r.json().catch(() => ({}));\n    if (!r.ok) {\n      const map = { name: \"errName\", pin: \"errPin\", taken: \"errTaken\", admin_not_configured: \"errAdmin\", full: \"errFull\" };\n      loginErr.textContent = t(map[data.error] || \"errNet\");\n      return;\n    }\n    token = data.token;\n    LS.set(\"planetar.token.\" + lower, token);\n    LS.set(\"planetar.name\", data.name);\n    pinIn.value = \"\";\n    $(\"#login\").hidden = true;\n    [\"#top\", \"#chat\"].forEach((s) => ($(s).hidden = false));\n    $(\"#adminBtn\").hidden = data.role !== \"founder\";\n    connect();\n  } catch {\n    loginErr.textContent = t(\"errNet\");\n  }\n});\n\n/* ============================================================\n   WebSocket\n   ============================================================ */\nfunction connect() {\n  const proto = location.protocol === \"https:\" ? \"wss\" : \"ws\";\n  ws = new WebSocket(`${proto}://${location.host}/ws?token=${encodeURIComponent(token)}`);\n  ws.onopen = () => {\n    clearInterval(pingTimer);\n    pingTimer = setInterval(() => { if (ws.readyState === 1) ws.send(\"ping\"); }, 25000);\n  };\n  ws.onmessage = (ev) => {\n    if (ev.data === \"pong\") return;\n    let m; try { m = JSON.parse(ev.data); } catch { return; }\n    onMsg(m);\n  };\n  ws.onclose = (ev) => {\n    clearInterval(pingTimer);\n    if (ev.code === 4000) { toast(t(\"replaced\"), true); return; }\n    if (!gotInit) {\n      failCount++;\n      if (failCount >= 4) { location.reload(); return; }\n    } else toast(t(\"reconnecting\"), true);\n    setTimeout(connect, 2000);\n  };\n}\nconst send = (o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };\n\nfunction onMsg(m) {\n  switch (m.t) {\n    case \"init\": {\n      gotInit = true; failCount = 0;\n      skew = m.now - Date.now();\n      me = { id: m.you.id, name: m.you.name, role: m.you.role };\n      setupSelf(m.you);\n      for (const id of [...others.keys()]) removePlayer(id);\n      m.players.forEach((p) => { if (p.id !== me.id) addPlayer(p); });\n      myVote = m.myVote !== null && m.myVote !== undefined && m.state.poll ? { pollId: m.state.poll.id, opt: m.myVote } : null;\n      applyState(m.state);\n      updateOnline();\n      break;\n    }\n    case \"join\": addPlayer(m.p); chatItems.push({ sys: \"joined\", name: m.p.name }); renderChat(); updateOnline(); break;\n    case \"leave\": removePlayer(m.id); if (m.name) { chatItems.push({ sys: \"left\", name: m.name }); renderChat(); } updateOnline(); break;\n    case \"move\": { const p = others.get(m.id); if (p) { p.tx = m.x; p.tz = m.z; p.try_ = m.ry; } break; }\n    case \"chat\": chatItems.push(m); if (chatItems.length > 60) chatItems.shift(); renderChat(); break;\n    case \"state\": applyState(m.state); break;\n    case \"myvote\": myVote = { pollId: m.pollId, opt: m.opt }; renderPoll(); break;\n  }\n}\n\n/* ============================================================\n   Chat\n   ============================================================ */\nfunction renderChat() {\n  const log = $(\"#chatLog\");\n  log.innerHTML = \"\";\n  for (const it of chatItems.slice(-60)) {\n    const d = document.createElement(\"div\");\n    if (it.sys) {\n      d.className = \"sys\";\n      d.textContent = `${it.name} ${t(it.sys)}`;\n    } else {\n      const b = document.createElement(\"b\");\n      if (it.role === \"founder\") { b.className = \"f\"; b.textContent = \"★ \" + it.name + \": \"; }\n      else b.textContent = it.name + \": \";\n      d.appendChild(b);\n      d.appendChild(document.createTextNode(it.text[lang] || it.text.en || Object.values(it.text)[0] || \"\"));\n    }\n    log.appendChild(d);\n  }\n  log.scrollTop = log.scrollHeight;\n}\n$(\"#chatForm\").addEventListener(\"submit\", (e) => {\n  e.preventDefault();\n  const v = $(\"#chatIn\").value.trim();\n  if (!v) return;\n  send({ t: \"chat\", text: v, lang });\n  $(\"#chatIn\").value = \"\";\n});\nfunction updateOnline() { $(\"#online\").textContent = `${others.size + (me ? 1 : 0)} ${t(\"online\")}`; }\n\n/* ============================================================\n   Poll\n   ============================================================ */\nfunction renderPoll() {\n  const panel = $(\"#pollPanel\");\n  const poll = state.poll;\n  if (!poll) { panel.hidden = true; return; }\n  panel.hidden = false;\n  $(\"#pollQ\").textContent = poll.question[lang] || poll.question.en;\n  const total = poll.options.reduce((s, o) => s + o.votes, 0);\n  const box = $(\"#pollOpts\");\n  box.innerHTML = \"\";\n  const mine = myVote && myVote.pollId === poll.id ? myVote.opt : null;\n  poll.options.forEach((o, i) => {\n    const b = document.createElement(\"button\");\n    b.className = \"opt\" + (mine === i ? \" mine\" : \"\");\n    b.disabled = !poll.open;\n    const bar = document.createElement(\"div\");\n    bar.className = \"bar\";\n    bar.style.width = total ? Math.round((o.votes / total) * 100) + \"%\" : \"0\";\n    const row = document.createElement(\"span\");\n    const a = document.createElement(\"span\"); a.textContent = o.text[lang] || o.text.en;\n    const c = document.createElement(\"span\"); c.textContent = o.votes;\n    row.append(a, c);\n    b.append(bar, row);\n    b.addEventListener(\"click\", () => send({ t: \"vote\", opt: i }));\n    box.appendChild(b);\n  });\n  $(\"#pollMeta\").textContent = poll.open ? `${t(\"total\")}: ${total} · ${t(\"voteHint\")}` : `${t(\"closed\")} · ${t(\"total\")}: ${total}`;\n}\n\n/* ============================================================\n   Admin panel (founder only; uploads go to R2 through the Worker)\n   ============================================================ */\n$(\"#adminBtn\").addEventListener(\"click\", () => { $(\"#admin\").hidden = !$(\"#admin\").hidden; renderAdmin(); });\n\n// Photos are shrunk in the browser (max 1920 px JPEG) so any camera photo fits the free storage.\nasync function compressImage(file) {\n  if (file.type === \"image/gif\") return file;\n  try {\n    const bmp = await createImageBitmap(file);\n    const scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));\n    const c = document.createElement(\"canvas\");\n    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);\n    c.getContext(\"2d\").drawImage(bmp, 0, 0, c.width, c.height);\n    const blob = await new Promise((r) => c.toBlob(r, \"image/jpeg\", 0.85));\n    return blob && blob.size < file.size ? blob : file;\n  } catch { return file; }\n}\n\nasync function upload(kind, file) {\n  toast(t(\"uploading\"));\n  if (kind === \"photo\") file = await compressImage(file);\n  const limit = kind === \"photo\" ? 4 * 1024 * 1024 : 15 * 1024 * 1024;\n  if (file.size > limit) { toast(t(\"tooBig\"), true); return; }\n  const bar = $(\"#upBar\"), fill = bar.querySelector(\"i\");\n  bar.hidden = false; fill.style.width = \"0\";\n  const xhr = new XMLHttpRequest();\n  xhr.open(\"POST\", `/api/upload?kind=${kind}&name=${encodeURIComponent(file.name || \"photo.jpg\")}`);\n  xhr.setRequestHeader(\"Authorization\", \"Bearer \" + token);\n  xhr.setRequestHeader(\"Content-Type\", file.type || \"application/octet-stream\");\n  xhr.upload.onprogress = (e) => { if (e.lengthComputable) fill.style.width = Math.round((e.loaded / e.total) * 100) + \"%\"; };\n  xhr.onload = () => { bar.hidden = true; xhr.status === 200 ? toast(t(\"uploaded\")) : toast(t(\"failed\"), true); };\n  xhr.onerror = () => { bar.hidden = true; toast(t(\"failed\"), true); };\n  xhr.send(file);\n}\n$(\"#upPhoto\").addEventListener(\"change\", (e) => { const f = e.target.files[0]; if (f) upload(\"photo\", f); e.target.value = \"\"; });\n$(\"#upMusic\").addEventListener(\"change\", (e) => { const f = e.target.files[0]; if (f) upload(\"music\", f); e.target.value = \"\"; });\n\nconst admin = (o) => send({ t: \"admin\", ...o });\n\nfunction mkBtn(label, cls, fn) {\n  const b = document.createElement(\"button\");\n  b.className = \"btn sm \" + cls; b.textContent = label; b.addEventListener(\"click\", fn);\n  return b;\n}\n\nfunction renderAdmin() {\n  if (!isFounder() || $(\"#admin\").hidden) return;\n  // slots\n  const slots = $(\"#slots\"); slots.innerHTML = \"\";\n  for (let i = 0; i < 5; i++) {\n    const s = document.createElement(\"div\");\n    s.className = \"slot\";\n    const id = state.screens[i];\n    const media = id && state.media.find((m) => m.id === id);\n    const tag = document.createElement(\"b\"); tag.textContent = i < 4 ? String(i + 1) : t(\"holo\");\n    s.appendChild(tag);\n    if (media) s.style.backgroundImage = `url(/media/${media.key})`; else s.append(t(\"empty\"));\n    s.addEventListener(\"click\", () => admin({ a: \"screen\", screen: i, mediaId: null }));\n    slots.appendChild(s);\n  }\n  // photos\n  const pl = $(\"#photoList\"); pl.innerHTML = \"\";\n  state.media.filter((m) => m.kind === \"photo\").slice().reverse().forEach((m) => {\n    const it = document.createElement(\"div\"); it.className = \"item\";\n    const img = document.createElement(\"img\"); img.src = \"/media/\" + m.key; img.loading = \"lazy\";\n    const nm = document.createElement(\"div\"); nm.className = \"nm\"; nm.textContent = m.name;\n    const acts = document.createElement(\"div\"); acts.className = \"acts\";\n    for (let i = 0; i < 5; i++) acts.appendChild(mkBtn(i < 4 ? String(i + 1) : \"H\", \"ghost\", () => admin({ a: \"screen\", screen: i, mediaId: m.id })));\n    acts.appendChild(mkBtn(\"✕\", \"ghost\", () => admin({ a: \"delmedia\", mediaId: m.id })));\n    const col = document.createElement(\"div\"); col.style.cssText = \"flex:1;min-width:0\";\n    col.append(nm, acts);\n    it.append(img, col); pl.appendChild(it);\n  });\n  // music\n  const ml = $(\"#musicList\"); ml.innerHTML = \"\";\n  state.media.filter((m) => m.kind === \"music\").slice().reverse().forEach((m) => {\n    const it = document.createElement(\"div\"); it.className = \"item\";\n    const nm = document.createElement(\"div\"); nm.className = \"nm\"; nm.textContent = \"♪ \" + m.name;\n    const playing = state.music.id === m.id;\n    const acts = document.createElement(\"div\"); acts.className = \"acts\";\n    acts.appendChild(playing ? mkBtn(\"■ \" + t(\"stop\"), \"ghost\", () => admin({ a: \"stop\" })) : mkBtn(\"▶ \" + t(\"play\"), \"\", () => admin({ a: \"play\", mediaId: m.id })));\n    acts.appendChild(mkBtn(\"✕\", \"ghost\", () => admin({ a: \"delmedia\", mediaId: m.id })));\n    it.append(nm, acts); ml.appendChild(it);\n  });\n}\n$(\"#pollStart\").addEventListener(\"click\", () => {\n  const question = $(\"#pollQuestion\").value.trim();\n  const options = $(\"#pollOptions\").value.split(\"\\n\").map((s) => s.trim()).filter(Boolean);\n  if (!question || options.length < 2) return;\n  toast(t(\"pollStarted\"));\n  admin({ a: \"poll\", question, options, lang });\n  $(\"#pollQuestion\").value = \"\"; $(\"#pollOptions\").value = \"\";\n});\n$(\"#pollClose\").addEventListener(\"click\", () => admin({ a: \"closepoll\" }));\n$(\"#pollClear\").addEventListener(\"click\", () => admin({ a: \"clearpoll\" }));\n\n/* ============================================================\n   Music (synced to the server clock) + analyser for visual beat\n   ============================================================ */\nconst audio = new Audio();\naudio.preload = \"auto\";\naudio.crossOrigin = \"anonymous\";\nlet actx = null, analyser = null, freq = null, bass = 0, curMusicKey = \"\";\naudio.volume = Number(LS.get(\"planetar.vol\") ?? 0.7);\n$(\"#volume\").value = audio.volume;\n$(\"#volume\").addEventListener(\"input\", (e) => { audio.volume = Number(e.target.value); LS.set(\"planetar.vol\", e.target.value); });\n\nfunction initAudioGraph() {\n  if (actx) { actx.resume?.(); return; }\n  try {\n    actx = new (window.AudioContext || window.webkitAudioContext)();\n    const src = actx.createMediaElementSource(audio);\n    analyser = actx.createAnalyser();\n    analyser.fftSize = 256;\n    src.connect(analyser); analyser.connect(actx.destination);\n    freq = new Uint8Array(analyser.frequencyBinCount);\n  } catch { actx = null; analyser = null; }\n}\nfunction updateNowPlaying() {\n  const m = state.music.id && state.media.find((x) => x.id === state.music.id);\n  $(\"#nowPlaying\").textContent = m ? `♪ ${t(\"nowPlaying\")}: ${m.name}` : \"\";\n}\nfunction applyMusic() {\n  updateNowPlaying();\n  const mu = state.music;\n  if (!mu.id) { audio.pause(); curMusicKey = \"\"; return; }\n  const media = state.media.find((x) => x.id === mu.id);\n  if (!media) return;\n  const key = mu.id + \":\" + mu.startedAt;\n  if (key === curMusicKey) return;\n  curMusicKey = key;\n  audio.src = \"/media/\" + media.key;\n  audio.onloadedmetadata = () => {\n    const off = (Date.now() + skew - mu.startedAt) / 1000;\n    if (isFinite(audio.duration) && off >= audio.duration - 0.5) return;\n    if (off > 0.3) { try { audio.currentTime = off; } catch {} }\n    tryPlay();\n  };\n  audio.load();\n}\nfunction tryPlay() {\n  actx?.resume?.();\n  audio.play().then(() => ($(\"#soundPrompt\").hidden = true)).catch(() => ($(\"#soundPrompt\").hidden = false));\n}\n$(\"#soundPrompt\").addEventListener(\"click\", () => { initAudioGraph(); tryPlay(); });\n\n/* ============================================================\n   State application\n   ============================================================ */\nfunction applyState(s) {\n  const pollChanged = !state.poll || !s.poll || state.poll.id !== s.poll.id;\n  state = s;\n  if (pollChanged && (!s.poll || (myVote && myVote.pollId !== s.poll.id))) myVote = null;\n  renderPoll();\n  renderAdmin();\n  applyMusic();\n  applyScreens();\n}\n\n/* ============================================================\n   THREE.js world\n   ============================================================ */\nconst canvas = $(\"#c\");\nconst renderer = new THREE.WebGLRenderer({ canvas, antialias: true });\nrenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));\nconst scene = new THREE.Scene();\nscene.background = new THREE.Color(0x120c24);\nscene.fog = new THREE.FogExp2(0x120c24, 0.011);\nconst camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);\n\nfunction onResize() {\n  renderer.setSize(window.innerWidth, window.innerHeight, false);\n  camera.aspect = window.innerWidth / window.innerHeight;\n  camera.updateProjectionMatrix();\n}\nwindow.addEventListener(\"resize\", onResize);\nonResize();\n\n// --- lights\nscene.add(new THREE.HemisphereLight(0xa99cff, 0x1b1330, 1.5));\nconst moonLight = new THREE.DirectionalLight(0xbcd0ff, 1.4);\nmoonLight.position.set(-30, 60, 20);\nscene.add(moonLight);\nconst holoLight = new THREE.PointLight(0x7a5cff, 500, 0, 2); holoLight.position.set(0, 5, 0); scene.add(holoLight);\nconst stageL = new THREE.PointLight(0xff3dcb, 600, 0, 2); stageL.position.set(-16, 9, -20); scene.add(stageL);\nconst stageR = new THREE.PointLight(0x38d6ff, 600, 0, 2); stageR.position.set(16, 9, -20); scene.add(stageR);\nconst gate = new THREE.PointLight(0xffb23d, 300, 0, 2); gate.position.set(0, 8, 34); scene.add(gate);\n\n// --- canvas texture helpers\nfunction canvasTex(w, h, draw, repeat) {\n  const c = document.createElement(\"canvas\"); c.width = w; c.height = h;\n  draw(c.getContext(\"2d\"), w, h);\n  const tx = new THREE.CanvasTexture(c);\n  tx.colorSpace = THREE.SRGBColorSpace;\n  tx.anisotropy = 4;\n  if (repeat) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(repeat, repeat); }\n  return tx;\n}\nconst stripeTex = (c1, c2, n = 8) => canvasTex(256, 8, (g, w, h) => { const s = w / n; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? c2 : c1; g.fillRect(i * s, 0, s, h); } });\nconst std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.1, ...extra });\nconst mesh = (geo, mat, x = 0, y = 0, z = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; };\n\n// --- sky\n{\n  const n = 900, pos = new Float32Array(n * 3);\n  for (let i = 0; i < n; i++) {\n    const a = Math.random() * Math.PI * 2, e = Math.random() * 1.3 + 0.1, r = 220;\n    pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r;\n  }\n  const g = new THREE.BufferGeometry(); g.setAttribute(\"position\", new THREE.BufferAttribute(pos, 3));\n  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })));\n  const moon = mesh(new THREE.SphereGeometry(10, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff1c9, fog: false }), -90, 80, -160);\n  scene.add(moon);\n}\n\n// --- ground\nconst ground = mesh(new THREE.CircleGeometry(90, 64), std(0x182a3a, { roughness: 1 })); ground.rotation.x = -Math.PI / 2; scene.add(ground);\nconst plazaTex = canvasTex(128, 128, (g, w, h) => { g.fillStyle = \"#2a2050\"; g.fillRect(0, 0, w, h); g.fillStyle = \"#3a2c6e\"; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2); }, 12);\nconst plaza = mesh(new THREE.CircleGeometry(23, 64), new THREE.MeshStandardMaterial({ map: plazaTex, roughness: 0.8 })); plaza.rotation.x = -Math.PI / 2; plaza.position.y = 0.02; scene.add(plaza);\n[[22.2, 23, 0xff3dcb], [21.2, 21.6, 0xffb23d], [4.6, 5.1, 0x38d6ff]].forEach(([a, b, c]) => {\n  const r = mesh(new THREE.RingGeometry(a, b, 64), new THREE.MeshBasicMaterial({ color: c })); r.rotation.x = -Math.PI / 2; r.position.y = 0.04; scene.add(r);\n});\nconst path = mesh(new THREE.PlaneGeometry(7, 22), std(0x4a3a7a, { roughness: 1 })); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.03, 34); scene.add(path);\n\n// --- entrance arch\n{\n  const g = new THREE.Group(); g.position.set(0, 0, 40);\n  const pm = std(0xff3dcb, { emissive: 0x551040 });\n  [-7, 7].forEach((x) => g.add(mesh(new THREE.CylinderGeometry(0.7, 0.9, 12, 12), pm, x, 6, 0)));\n  const signTex = canvasTex(1024, 256, (c, w, h) => {\n    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, \"#2a0f4d\"); gr.addColorStop(1, \"#4d0f45\");\n    c.fillStyle = gr; c.fillRect(0, 0, w, h);\n    c.strokeStyle = \"#ffb23d\"; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20);\n    c.font = \"bold 110px system-ui, sans-serif\"; c.textAlign = \"center\"; c.textBaseline = \"middle\";\n    c.fillStyle = \"#ffb23d\"; c.shadowColor = \"#ff3dcb\"; c.shadowBlur = 24; c.fillText(\"PLANETAR\", w / 2, h * 0.38);\n    c.font = \"bold 62px system-ui, sans-serif\"; c.fillStyle = \"#38d6ff\"; c.shadowColor = \"#38d6ff\"; c.fillText(\"C A R N I V A L\", w / 2, h * 0.76);\n  });\n  const sign = mesh(new THREE.BoxGeometry(16, 4, 0.5), [std(0x222), std(0x222), std(0x222), std(0x222), new THREE.MeshBasicMaterial({ map: signTex }), new THREE.MeshBasicMaterial({ map: signTex })], 0, 11.5, 0);\n  g.add(sign); scene.add(g);\n}\n\n// --- ferris wheel\nconst ferris = { wheel: null, gondolas: [] };\n{\n  const g = new THREE.Group(); g.position.set(-28, 0, -8); g.rotation.y = Math.PI / 2; scene.add(g);\n  const hubY = 11, R = 9;\n  const frame = std(0xdddddd, { metalness: 0.4 });\n  [-1.6, 1.6].forEach((z) => {\n    [-1, 1].forEach((s) => {\n      const leg = mesh(new THREE.CylinderGeometry(0.22, 0.28, 13, 8), frame, s * 4, hubY / 2 + 0.3, z);\n      leg.rotation.z = -s * 0.36; g.add(leg);\n    });\n  });\n  const wheel = new THREE.Group(); wheel.position.y = hubY; g.add(wheel); ferris.wheel = wheel;\n  wheel.add(mesh(new THREE.TorusGeometry(R, 0.25, 8, 48), std(0xff3dcb, { emissive: 0x661050 })));\n  wheel.add(mesh(new THREE.TorusGeometry(R * 0.55, 0.15, 8, 36), std(0x38d6ff, { emissive: 0x104a66 })));\n  wheel.add(mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.4, 16), frame)); wheel.children.at(-1).rotation.x = Math.PI / 2;\n  for (let i = 0; i < 12; i++) {\n    const a = (i / 12) * Math.PI * 2;\n    const spoke = mesh(new THREE.BoxGeometry(R, 0.14, 0.14), frame, Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0); spoke.rotation.z = a; wheel.add(spoke);\n    const gond = new THREE.Group(); gond.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);\n    gond.add(mesh(new THREE.BoxGeometry(1.8, 1.2, 1.6), std(new THREE.Color().setHSL(i / 12, 0.8, 0.55), { emissive: new THREE.Color().setHSL(i / 12, 0.8, 0.2) }), 0, -1.0, 0));\n    gond.add(mesh(new THREE.ConeGeometry(1.3, 0.7, 4), std(0xffffff), 0, -0.1, 0));\n    wheel.add(gond); ferris.gondolas.push(gond);\n  }\n  for (let i = 0; i < 24; i++) {\n    const a = (i / 24) * Math.PI * 2;\n    wheel.add(mesh(new THREE.SphereGeometry(0.16, 6, 6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0xffb23d : 0x38d6ff }), Math.cos(a) * R, Math.sin(a) * R, 0.35));\n  }\n}\n\n// --- carousel\nconst carousel = { spin: null, horses: [] };\n{\n  const g = new THREE.Group(); g.position.set(28, 0, -2); scene.add(g);\n  g.add(mesh(new THREE.CylinderGeometry(5.4, 5.6, 0.6, 32), std(0x7a3cff), 0, 0.3, 0));\n  const spin = new THREE.Group(); spin.position.y = 0.6; g.add(spin); carousel.spin = spin;\n  spin.add(mesh(new THREE.CylinderGeometry(0.5, 0.5, 6, 12), std(0xffb23d), 0, 3, 0));\n  const roofTex = stripeTex(\"#ff3dcb\", \"#fff3d6\", 10);\n  const roof = mesh(new THREE.ConeGeometry(5.8, 2.6, 32), new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.7 }), 0, 7.3, 0);\n  spin.add(roof);\n  spin.add(mesh(new THREE.SphereGeometry(0.4, 12, 12), new THREE.MeshBasicMaterial({ color: 0xffb23d }), 0, 8.8, 0));\n  for (let i = 0; i < 8; i++) {\n    const a = (i / 8) * Math.PI * 2, r = 3.7;\n    const h = new THREE.Group(); h.position.set(Math.cos(a) * r, 1.6, Math.sin(a) * r); h.rotation.y = -a;\n    const col = new THREE.Color().setHSL(i / 8, 0.7, 0.6);\n    h.add(mesh(new THREE.CylinderGeometry(0.06, 0.06, 5, 6), std(0xffd27a), 0, 1.6, 0));\n    h.add(mesh(new THREE.BoxGeometry(1.5, 0.8, 0.6), std(col), 0, 0, 0));\n    h.add(mesh(new THREE.BoxGeometry(0.4, 0.9, 0.4), std(col), 0.75, 0.55, 0));\n    h.add(mesh(new THREE.BoxGeometry(0.7, 0.35, 0.35), std(col), 1.05, 0.9, 0));\n    spin.add(h); carousel.horses.push(h);\n  }\n}\n\n// --- tents\nconst obstacles = [{ x: -28, z: -8, r: 6 }, { x: 28, z: -2, r: 6.5 }];\n[[-38, 16, 0xff3dcb], [38, 16, 0x38d6ff], [-44, -2, 0xffb23d], [-14, 42, 0x7a3cff], [14, 42, 0x3dff9a]].forEach(([x, z, c], i) => {\n  const g = new THREE.Group(); g.position.set(x, 0, z);\n  const col = \"#\" + new THREE.Color(c).getHexString();\n  const tex = stripeTex(col, \"#fff3d6\", 12);\n  g.add(mesh(new THREE.CylinderGeometry(4.6, 4.6, 3, 24, 1, true), new THREE.MeshStandardMaterial({ map: tex, side: THREE.DoubleSide }), 0, 1.5, 0));\n  g.add(mesh(new THREE.ConeGeometry(5.2, 3.6, 24), new THREE.MeshStandardMaterial({ map: tex }), 0, 4.8, 0));\n  g.add(mesh(new THREE.SphereGeometry(0.3, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }), 0, 6.8, 0));\n  g.rotation.y = i; scene.add(g);\n  obstacles.push({ x, z, r: 5.2 });\n});\n\n// --- stage with 4 screens\nconst slots = []; // 0..3 wall screens, 4 hologram\nconst idleScreen = canvasTex(1024, 640, (c, w, h) => {\n  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, \"#2a0f4d\"); gr.addColorStop(1, \"#0f2a4d\");\n  c.fillStyle = gr; c.fillRect(0, 0, w, h);\n  c.fillStyle = \"rgba(255,255,255,.05)\"; for (let y = 0; y < h; y += 6) c.fillRect(0, y, w, 2);\n  c.font = \"bold 150px system-ui, sans-serif\"; c.textAlign = \"center\"; c.textBaseline = \"middle\";\n  c.fillStyle = \"#ffb23d\"; c.shadowColor = \"#ff3dcb\"; c.shadowBlur = 30; c.fillText(\"PLANETAR\", w / 2, h / 2);\n});\nconst idleHolo = canvasTex(512, 512, (c, w, h) => {\n  c.clearRect(0, 0, w, h);\n  c.strokeStyle = \"#38d6ff\"; c.lineWidth = 8; c.shadowColor = \"#38d6ff\"; c.shadowBlur = 24;\n  c.beginPath(); c.arc(w / 2, h / 2, 190, 0, Math.PI * 2); c.stroke();\n  c.beginPath(); c.ellipse(w / 2, h / 2, 280, 90, -0.4, 0, Math.PI * 2); c.stroke();\n  c.fillStyle = \"#ffb23d\"; c.beginPath(); c.arc(w / 2, h / 2, 60, 0, Math.PI * 2); c.fill();\n});\n{\n  const stage = new THREE.Group(); scene.add(stage);\n  stage.add(mesh(new THREE.BoxGeometry(46, 1.2, 12), std(0x2a1f4f), 0, 0.6, -25));\n  stage.add(mesh(new THREE.BoxGeometry(46, 16, 0.6), std(0x1a1236), 0, 8.6, -30.5));\n  const edge = mesh(new THREE.BoxGeometry(46.2, 0.15, 0.15), new THREE.MeshBasicMaterial({ color: 0xff3dcb }), 0, 1.25, -19.1); stage.add(edge);\n  const xs = [-15, -5, 5, 15];\n  xs.forEach((x, i) => {\n    stage.add(mesh(new THREE.BoxGeometry(9.2, 5.8, 0.4), new THREE.MeshBasicMaterial({ color: [0xff3dcb, 0xffb23d, 0x38d6ff, 0x7a3cff][i] }), x, 7.4, -30.1));\n    stage.add(mesh(new THREE.BoxGeometry(8.8, 5.4, 0.45), std(0x0a0814), x, 7.4, -30.05));\n    const plane = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: idleScreen, toneMapped: false }), x, 7.4, -29.8);\n    plane.scale.set(8.4, 5.25, 1);\n    stage.add(plane);\n    slots.push({ mesh: plane, maxW: 8.4, maxH: 5.25, idle: idleScreen, id: null });\n    stage.add(label(String(i + 1), true, x, 2.6, -19.5, 1.6));\n  });\n  obstacles.push();\n}\n\n// --- hologram\nconst holo = new THREE.Group(); holo.position.set(0, 0, 0); scene.add(holo);\nlet holoPlane, holoBeam, holoRings = [];\n{\n  holo.add(mesh(new THREE.CylinderGeometry(2.6, 3, 0.5, 32), std(0x1a1236, { metalness: 0.6 }), 0, 0.25, 0));\n  const baseRing = mesh(new THREE.TorusGeometry(2.4, 0.07, 8, 48), new THREE.MeshBasicMaterial({ color: 0x38d6ff }), 0, 0.52, 0);\n  baseRing.rotation.x = Math.PI / 2;\n  holo.add(baseRing);\n  holoBeam = mesh(new THREE.CylinderGeometry(2.2, 2.6, 7, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x7a5cff, transparent: true, opacity: 0.14, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 4, 0);\n  holo.add(holoBeam);\n  for (let i = 0; i < 3; i++) {\n    const r = mesh(new THREE.TorusGeometry(2.8 - i * 0.2, 0.04, 6, 48), new THREE.MeshBasicMaterial({ color: 0x38d6ff, transparent: true, opacity: 0.8 }), 0, 1 + i * 2.2, 0);\n    r.rotation.x = Math.PI / 2; holo.add(r); holoRings.push(r);\n  }\n  holoPlane = mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: idleHolo, transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }), 0, 6.2, 0);\n  holoPlane.scale.set(5, 5, 1);\n  holo.add(holoPlane);\n  slots.push({ mesh: holoPlane, maxW: 5.6, maxH: 5.6, idle: idleHolo, id: null });\n  obstacles.push({ x: 0, z: 0, r: 3.2 });\n}\nlet holoLabel = null;\nfunction refreshHoloLabel() {\n  if (holoLabel) { holo.remove(holoLabel); holoLabel.material.map.dispose(); holoLabel.material.dispose(); }\n  holoLabel = label(t(\"holo\"), true, 0, 0.9, 3.4, 1.2);\n  holo.add(holoLabel);\n}\n\n// --- string lights, balloons, confetti\nconst bulbCount = 10 * 8;\nconst bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.18, 8, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), bulbCount);\n{\n  const dummy = new THREE.Object3D(); let k = 0;\n  const poles = [];\n  for (let i = 0; i < 10; i++) {\n    const a = (i / 10) * Math.PI * 2; poles.push(new THREE.Vector3(Math.cos(a) * 21.5, 6.4, Math.sin(a) * 21.5));\n    scene.add(mesh(new THREE.CylinderGeometry(0.12, 0.16, 6.4, 8), std(0xcccccc), poles[i].x, 3.2, poles[i].z));\n    obstacles.push({ x: poles[i].x, z: poles[i].z, r: 0.5 });\n  }\n  for (let i = 0; i < 10; i++) {\n    const a = poles[i], b = poles[(i + 1) % 10], pts = [];\n    for (let j = 0; j <= 16; j++) { const u = j / 16; pts.push(new THREE.Vector3(a.x + (b.x - a.x) * u, a.y - Math.sin(u * Math.PI) * 1.2, a.z + (b.z - a.z) * u)); }\n    scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x555566 })));\n    for (let j = 0; j < 8; j++) { const p = pts[Math.round(((j + 0.5) / 8) * 16)]; dummy.position.copy(p).y -= 0.12; dummy.updateMatrix(); bulbs.setMatrixAt(k, dummy.matrix); bulbs.setColorAt(k, new THREE.Color(1, 1, 1)); k++; }\n  }\n  scene.add(bulbs);\n}\nconst balloons = new THREE.InstancedMesh(new THREE.SphereGeometry(0.7, 12, 10), new THREE.MeshStandardMaterial({ roughness: 0.3 }), 28);\nconst balloonBase = [];\n{\n  for (let i = 0; i < 28; i++) {\n    const a = Math.random() * Math.PI * 2, r = 14 + Math.random() * 34;\n    balloonBase.push({ x: Math.cos(a) * r, z: Math.sin(a) * r, y: 9 + Math.random() * 6, ph: Math.random() * 6 });\n    balloons.setColorAt(i, new THREE.Color().setHSL(Math.random(), 0.8, 0.55));\n  }\n  scene.add(balloons);\n}\nconst confN = 500, confPos = new Float32Array(confN * 3), confCol = new Float32Array(confN * 3), confVel = new Float32Array(confN);\nfor (let i = 0; i < confN; i++) {\n  confPos.set([(Math.random() - 0.5) * 70, Math.random() * 18, (Math.random() - 0.5) * 70], i * 3);\n  const c = new THREE.Color().setHSL(Math.random(), 0.9, 0.6); confCol.set([c.r, c.g, c.b], i * 3); confVel[i] = 0.6 + Math.random();\n}\nconst confGeo = new THREE.BufferGeometry();\nconfGeo.setAttribute(\"position\", new THREE.BufferAttribute(confPos, 3));\nconfGeo.setAttribute(\"color\", new THREE.BufferAttribute(confCol, 3));\nscene.add(new THREE.Points(confGeo, new THREE.PointsMaterial({ size: 0.22, vertexColors: true })));\n\n/* ---- name labels */\nfunction label(text, small, x = 0, y = 0, z = 0, scale = 1) {\n  const c = document.createElement(\"canvas\"); c.width = 512; c.height = 128;\n  const g = c.getContext(\"2d\");\n  g.font = \"bold 56px system-ui, sans-serif\"; g.textAlign = \"center\"; g.textBaseline = \"middle\";\n  const w = Math.min(500, g.measureText(text).width + 56);\n  g.fillStyle = small ? \"rgba(20,10,40,.55)\" : \"rgba(20,10,40,.7)\";\n  g.beginPath(); g.roundRect((512 - w) / 2, 22, w, 84, 28); g.fill();\n  g.fillStyle = small ? \"#38d6ff\" : \"#fff\"; g.fillText(text, 256, 66, 480);\n  const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace;\n  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false }));\n  s.scale.set(3.2 * scale, 0.8 * scale, 1); s.position.set(x, y, z);\n  return s;\n}\n\n/* ---- avatars */\nfunction hashHue(name) { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return (h % 360) / 360; }\nfunction makeAvatar(name, role) {\n  const g = new THREE.Group();\n  const founder = role === \"founder\";\n  const col = founder ? new THREE.Color(0xffb23d) : new THREE.Color().setHSL(hashHue(name), 0.75, 0.55);\n  const bodyMat = std(col, { metalness: founder ? 0.6 : 0.1, emissive: founder ? 0x4a3000 : 0x000000 });\n  g.add(mesh(new THREE.CapsuleGeometry(0.45, 0.8, 6, 12), bodyMat, 0, 1.15, 0));\n  g.add(mesh(new THREE.SphereGeometry(0.4, 16, 12), std(0xffd9b8), 0, 2.15, 0));\n  [-0.14, 0.14].forEach((x) => g.add(mesh(new THREE.SphereGeometry(0.06, 8, 8), new THREE.MeshBasicMaterial({ color: 0x111111 }), x, 2.2, 0.35)));\n  if (founder) {\n    const crown = new THREE.Group(); crown.position.y = 2.5;\n    const gold = std(0xffcf3d, { metalness: 0.8, roughness: 0.3, emissive: 0x6a4a00 });\n    crown.add(mesh(new THREE.CylinderGeometry(0.36, 0.3, 0.25, 10), gold, 0, 0, 0));\n    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; crown.add(mesh(new THREE.ConeGeometry(0.1, 0.3, 6), gold, Math.cos(a) * 0.3, 0.27, Math.sin(a) * 0.3)); }\n    g.add(crown);\n  } else {\n    g.add(mesh(new THREE.ConeGeometry(0.3, 0.65, 14), std(new THREE.Color().setHSL((hashHue(name) + 0.5) % 1, 0.85, 0.6)), 0, 2.78, 0));\n  }\n  const legs = [-0.2, 0.2].map((x) => { const p = new THREE.Group(); p.position.set(x, 0.55, 0); p.add(mesh(new THREE.BoxGeometry(0.28, 0.55, 0.3), std(0x2b2147), 0, -0.27, 0)); g.add(p); return p; });\n  g.add(label((founder ? \"★ \" : \"\") + name, false, 0, 3.6, 0, 1));\n  g.userData.legs = legs;\n  return g;\n}\n\nconst others = new Map(); // id -> {group,tx,tz,try_,phase,name}\nconst self = { group: null, x: 0, z: 14, ry: Math.PI, phase: 0, yaw: 0, pitch: 0.38, dist: 10 };\nfunction setupSelf(p) {\n  if (self.group) scene.remove(self.group);\n  self.group = makeAvatar(p.name, p.role);\n  self.x = p.x; self.z = p.z; self.ry = p.ry; self.yaw = 0;\n  scene.add(self.group);\n}\nfunction addPlayer(p) {\n  if (others.has(p.id)) return;\n  const group = makeAvatar(p.name, p.role); group.position.set(p.x, 0, p.z); group.rotation.y = p.ry; scene.add(group);\n  others.set(p.id, { group, tx: p.x, tz: p.z, try_: p.ry, phase: Math.random() * 6, name: p.name });\n}\nfunction removePlayer(id) { const p = others.get(id); if (!p) return; scene.remove(p.group); others.delete(id); }\n\n/* ---- screens: photos from R2 shown on the stage screens / hologram */\nconst texLoader = new THREE.TextureLoader();\nconst texCache = new Map();\nfunction getTex(media) {\n  if (!texCache.has(media.id)) {\n    texCache.set(media.id, new Promise((res) => texLoader.load(\"/media/\" + media.key, (tx) => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; res(tx); }, undefined, () => res(null))));\n  }\n  return texCache.get(media.id);\n}\nfunction fit(slot, aspect) {\n  let w = slot.maxW, h = slot.maxW / aspect;\n  if (h > slot.maxH) { h = slot.maxH; w = h * aspect; }\n  slot.mesh.scale.set(w, h, 1);\n}\nasync function applyScreens() {\n  for (let i = 0; i < slots.length; i++) {\n    const slot = slots[i], id = state.screens[i] || null;\n    if (slot.id === id) continue;\n    slot.id = id;\n    if (!id) { slot.mesh.material.map = slot.idle; slot.mesh.material.needsUpdate = true; fit(slot, i < 4 ? 1.6 : 1); continue; }\n    const media = state.media.find((m) => m.id === id);\n    const tx = media && (await getTex(media));\n    if (slot.id !== id || !tx) continue;\n    slot.mesh.material.map = tx; slot.mesh.material.needsUpdate = true;\n    fit(slot, tx.image.width / tx.image.height);\n  }\n}\nslots.forEach((s, i) => fit(s, i < 4 ? 1.6 : 1));\nrefreshHoloLabel();\n\n/* ============================================================\n   Controls\n   ============================================================ */\nconst keys = new Set();\nconst typing = () => document.activeElement && [\"INPUT\", \"TEXTAREA\"].includes(document.activeElement.tagName);\nwindow.addEventListener(\"keydown\", (e) => {\n  if (typing()) return;\n  const k = e.key.toLowerCase();\n  if ([\"w\", \"a\", \"s\", \"d\", \"arrowup\", \"arrowdown\", \"arrowleft\", \"arrowright\"].includes(k)) { keys.add(k); e.preventDefault(); }\n  if (e.key === \"Enter\") $(\"#chatIn\").focus();\n});\nwindow.addEventListener(\"keyup\", (e) => keys.delete(e.key.toLowerCase()));\nwindow.addEventListener(\"blur\", () => keys.clear());\n$(\"#chatIn\").addEventListener(\"keydown\", (e) => { if (e.key === \"Escape\") e.target.blur(); });\n\nlet drag = null;\ncanvas.addEventListener(\"pointerdown\", (e) => { drag = { id: e.pointerId, x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });\ncanvas.addEventListener(\"pointermove\", (e) => {\n  if (!drag || drag.id !== e.pointerId) return;\n  self.yaw -= (e.clientX - drag.x) * 0.006;\n  self.pitch = Math.max(0.05, Math.min(1.25, self.pitch + (e.clientY - drag.y) * 0.004));\n  drag.x = e.clientX; drag.y = e.clientY;\n});\ncanvas.addEventListener(\"pointerup\", () => (drag = null));\ncanvas.addEventListener(\"pointercancel\", () => (drag = null));\ncanvas.addEventListener(\"wheel\", (e) => { self.dist = Math.max(4, Math.min(20, self.dist + e.deltaY * 0.01)); e.preventDefault(); }, { passive: false });\n\n// touch joystick\nconst joy = { x: 0, y: 0 };\n{\n  const el = $(\"#joy\"), knob = el.querySelector(\"i\"); let id = null;\n  const upd = (e) => {\n    const r = el.getBoundingClientRect();\n    let dx = (e.clientX - (r.left + r.width / 2)) / 40, dy = (e.clientY - (r.top + r.height / 2)) / 40;\n    const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }\n    joy.x = dx; joy.y = dy; knob.style.transform = `translate(${dx * 30}px,${dy * 30}px)`;\n  };\n  el.addEventListener(\"pointerdown\", (e) => { id = e.pointerId; el.setPointerCapture(id); upd(e); e.stopPropagation(); });\n  el.addEventListener(\"pointermove\", (e) => { if (e.pointerId === id) upd(e); });\n  const end = () => { id = null; joy.x = joy.y = 0; knob.style.transform = \"\"; };\n  el.addEventListener(\"pointerup\", end); el.addEventListener(\"pointercancel\", end);\n}\n\n/* ============================================================\n   Main loop\n   ============================================================ */\nconst clock = new THREE.Clock();\nconst tmpC = new THREE.Color();\nlet lastSent = { x: 1e9, z: 1e9, ry: 1e9 }, sendAcc = 0;\nconst angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };\n\nfunction animate() {\n  requestAnimationFrame(animate);\n  const dt = Math.min(clock.getDelta(), 0.1), time = clock.elapsedTime;\n\n  // audio-reactive \"bass\"\n  if (analyser && !audio.paused) {\n    analyser.getByteFrequencyData(freq);\n    let s = 0; for (let i = 0; i < 6; i++) s += freq[i];\n    bass += (s / 6 / 255 - bass) * 0.35;\n  } else bass *= 0.9;\n\n  // local movement\n  if (self.group) {\n    let fx = (keys.has(\"d\") || keys.has(\"arrowright\") ? 1 : 0) - (keys.has(\"a\") || keys.has(\"arrowleft\") ? 1 : 0) + joy.x;\n    let fy = (keys.has(\"s\") || keys.has(\"arrowdown\") ? 1 : 0) - (keys.has(\"w\") || keys.has(\"arrowup\") ? 1 : 0) + joy.y;\n    const len = Math.hypot(fx, fy);\n    let moving = false;\n    if (len > 0.05) {\n      if (len > 1) { fx /= len; fy /= len; }\n      const sin = Math.sin(self.yaw), cos = Math.cos(self.yaw);\n      const vx = fx * cos + fy * sin, vz = -fx * sin + fy * cos;\n      const sp = 7.5;\n      self.x += vx * sp * dt; self.z += vz * sp * dt;\n      self.ry += angDiff(self.ry, Math.atan2(vx, vz)) * Math.min(1, dt * 12);\n      self.phase += dt * 11; moving = true;\n    }\n    // world bounds + obstacles\n    const rr = Math.hypot(self.x, self.z); if (rr > 58) { self.x *= 58 / rr; self.z *= 58 / rr; }\n    if (self.z < -18) self.z = -18;\n    for (const o of obstacles) {\n      const dx = self.x - o.x, dz = self.z - o.z, d = Math.hypot(dx, dz), min = o.r + 0.5;\n      if (d < min && d > 0.001) { self.x = o.x + (dx / d) * min; self.z = o.z + (dz / d) * min; }\n    }\n    self.group.position.set(self.x, 0, self.z);\n    self.group.rotation.y = self.ry;\n    animLegs(self.group, self.phase, moving);\n\n    // camera\n    const cp = Math.cos(self.pitch), sp2 = Math.sin(self.pitch);\n    camera.position.set(self.x + Math.sin(self.yaw) * cp * self.dist, 1.8 + sp2 * self.dist, self.z + Math.cos(self.yaw) * cp * self.dist);\n    camera.lookAt(self.x, 1.9, self.z);\n\n    // network (10 Hz)\n    sendAcc += dt;\n    if (sendAcc > 0.1 && me) {\n      sendAcc = 0;\n      if (Math.abs(lastSent.x - self.x) > 0.01 || Math.abs(lastSent.z - self.z) > 0.01 || Math.abs(lastSent.ry - self.ry) > 0.02) {\n        lastSent = { x: self.x, z: self.z, ry: self.ry };\n        send({ t: \"move\", x: +self.x.toFixed(2), z: +self.z.toFixed(2), ry: +self.ry.toFixed(2) });\n      }\n    }\n  } else {\n    camera.position.set(Math.sin(time * 0.1) * 40, 14, Math.cos(time * 0.1) * 40); camera.lookAt(0, 4, 0);\n  }\n\n  // remote players\n  const k = 1 - Math.exp(-12 * dt);\n  for (const p of others.values()) {\n    const g = p.group, px = g.position.x, pz = g.position.z;\n    g.position.x += (p.tx - px) * k; g.position.z += (p.tz - pz) * k;\n    g.rotation.y += angDiff(g.rotation.y, p.try_) * k;\n    const sp = Math.hypot(g.position.x - px, g.position.z - pz) / Math.max(dt, 1e-3);\n    if (sp > 0.5) p.phase += dt * 11;\n    animLegs(g, p.phase, sp > 0.5);\n  }\n\n  // rides\n  ferris.wheel.rotation.z += dt * 0.12;\n  ferris.gondolas.forEach((gd) => (gd.rotation.z = -ferris.wheel.rotation.z));\n  carousel.spin.rotation.y += dt * 0.6;\n  carousel.horses.forEach((h, i) => (h.position.y = 1.6 + Math.sin(time * 2.2 + i * 0.8) * 0.45));\n\n  // hologram faces the camera, flickers and pulses to the music\n  holoPlane.position.y = 6.2 + Math.sin(time * 1.4) * 0.25 + bass * 0.4;\n  holoPlane.rotation.y = Math.atan2(camera.position.x - holo.position.x, camera.position.z - holo.position.z);\n  holoPlane.material.opacity = 0.86 + Math.sin(time * 40) * 0.04 + bass * 0.1;\n  holoBeam.material.opacity = 0.12 + bass * 0.25;\n  holoRings.forEach((r, i) => { r.rotation.z = time * (0.6 + i * 0.3) * (i % 2 ? -1 : 1); r.scale.setScalar(1 + bass * 0.12); });\n  holoLight.intensity = 400 + bass * 900;\n  stageL.intensity = 500 + bass * 800; stageR.intensity = 500 + bass * 800;\n\n  // bulbs\n  for (let i = 0; i < bulbCount; i++) { tmpC.setHSL((i * 0.045 + time * 0.08) % 1, 1, 0.5 + 0.25 * Math.sin(time * 3 + i) * 0.5 + bass * 0.3); bulbs.setColorAt(i, tmpC); }\n  bulbs.instanceColor.needsUpdate = true;\n\n  // balloons\n  const m4 = new THREE.Matrix4();\n  for (let i = 0; i < balloonBase.length; i++) { const b = balloonBase[i]; m4.makeTranslation(b.x + Math.sin(time * 0.5 + b.ph) * 0.6, b.y + Math.sin(time * 0.8 + b.ph) * 0.8, b.z); balloons.setMatrixAt(i, m4); }\n  balloons.instanceMatrix.needsUpdate = true;\n\n  // confetti\n  for (let i = 0; i < confN; i++) {\n    confPos[i * 3 + 1] -= confVel[i] * dt;\n    confPos[i * 3] += Math.sin(time + i) * dt * 0.4;\n    if (confPos[i * 3 + 1] < 0) confPos[i * 3 + 1] = 18;\n  }\n  confGeo.attributes.position.needsUpdate = true;\n\n  renderer.render(scene, camera);\n}\nfunction animLegs(g, phase, moving) {\n  const legs = g.userData.legs;\n  const a = moving ? Math.sin(phase) * 0.8 : 0;\n  legs[0].rotation.x = a; legs[1].rotation.x = -a;\n  g.children[0].position.y = 1.15 + (moving ? Math.abs(Math.sin(phase)) * 0.08 : 0);\n}\n\nsetLang(lang);\nanimate();\n";


const LANGS = ["en", "uk", "ru"];
const M2M = { en: "english", uk: "ukrainian", ru: "russian" };
const NAME_RE = /^[\p{L}\p{N}_ -]{2,16}$/u;
const LIMITS = { photo: 4 * 1024 * 1024, music: 15 * 1024 * 1024 };
const CHUNK = 1024 * 1024; // files are stored in the Durable Object's SQLite in 1 MB pieces
const TYPE_RE = {
  photo: /^image\/(png|jpeg|webp|gif)$/,
  music: /^audio\/(mpeg|mp3|ogg|wav|x-wav|wave|mp4|x-m4a|aac|webm|flac)$/,
};
const MAX_MEDIA = 60;
const MAX_USERS = 2000;

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

function safeEq(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function detectLang(text) {
  if (/[іїєґІЇЄҐ]/.test(text)) return "uk";
  if (/[Ѐ-ӿ]/.test(text)) return "ru";
  return "en";
}

// Auto-translate a text into all three languages (EN / UK / RU) with Workers AI.
async function translateAll(env, text, hint) {
  const detected = detectLang(text);
  const src = detected === "en" ? "en" : hint === "uk" || hint === "ru" ? hint : detected;
  const out = { [src]: text };
  await Promise.all(
    LANGS.filter((l) => l !== src).map(async (l) => {
      try {
        const r = await env.AI.run("@cf/meta/m2m100-1.2b", {
          text,
          source_lang: M2M[src],
          target_lang: M2M[l],
        });
        out[l] = (r && r.translated_text) || text;
      } catch {
        out[l] = text;
      }
    })
  );
  return out;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/") || url.pathname === "/ws" || url.pathname.startsWith("/media/")) {
      const stub = env.CARNIVAL.get(env.CARNIVAL.idFromName("main"));
      return stub.fetch(request);
    }
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(INDEX_HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
    }
    if (url.pathname === "/game.js") {
      return new Response(GAME_JS, { headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-cache" } });
    }
    return new Response("not found", { status: 404 });
  },
};

export class Carnival extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.pos = new Map();
    this.lastChat = new Map();
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
    ctx.storage.sql.exec(
      "CREATE TABLE IF NOT EXISTS chunks (key TEXT NOT NULL, idx INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (key, idx))"
    );
    ctx.blockConcurrencyWhile(async () => {
      this.users = (await ctx.storage.get("users")) || {};
      this.state = (await ctx.storage.get("state")) || {
        media: [],
        screens: [null, null, null, null, null], // 0-3 stage screens, 4 = hologram
        music: { id: null, startedAt: 0 },
        poll: null,
      };
    });
  }

  save() {
    return this.ctx.storage.put({ users: this.users, state: this.state });
  }

  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname === "/ws") return this.openSocket(request, url);
    if (url.pathname.startsWith("/media/") && (request.method === "GET" || request.method === "HEAD")) {
      return this.serveMedia(request, decodeURIComponent(url.pathname.slice(7)));
    }
    if (url.pathname === "/api/login" && request.method === "POST") return this.login(request);
    if (url.pathname === "/api/upload" && request.method === "POST") return this.upload(request, url);
    return new Response("not found", { status: 404 });
  }

  // ---------- accounts (mini registration by name) ----------
  async login(request) {
    let b;
    try {
      b = await request.json();
    } catch {
      return json({ error: "bad" }, 400);
    }
    const name = String(b.name || "").trim().replace(/\s+/g, " ");
    if (!NAME_RE.test(name)) return json({ error: "name" }, 400);
    const key = name.toLowerCase();

    if (key === "misha") {
      const pin = this.env.ADMIN_PIN;
      if (!pin) return json({ error: "admin_not_configured" }, 503);
      if (!safeEq(String(b.pin || ""), String(pin))) return json({ error: "pin" }, 403);
      const existing = this.users[key];
      const token = existing?.token || crypto.randomUUID();
      this.users[key] = { name: "Misha", role: "founder", token };
      await this.save();
      return json({ token, name: "Misha", role: "founder" });
    }

    const existing = this.users[key];
    if (existing) {
      if (b.token && safeEq(String(b.token), existing.token)) {
        return json({ token: existing.token, name: existing.name, role: existing.role });
      }
      return json({ error: "taken" }, 409);
    }
    if (Object.keys(this.users).length >= MAX_USERS) return json({ error: "full" }, 503);
    const token = crypto.randomUUID();
    this.users[key] = { name, role: "guest", token };
    await this.save();
    return json({ token, name, role: "guest" });
  }

  userByToken(token) {
    if (!token) return null;
    return Object.values(this.users).find((u) => safeEq(u.token, token)) || null;
  }

  // ---------- media storage: SQLite inside the Durable Object (free, no R2 needed) ----------
  serveMedia(request, key) {
    const entry = /^(photo|music)\/[a-f0-9-]{36}$/.test(key) && this.state.media.find((m) => m.key === key);
    if (!entry) return new Response("not found", { status: 404 });
    const size = entry.size;
    let start = 0;
    let end = size - 1;
    let status = 200;
    const m = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") || "");
    if (m && (m[1] !== "" || m[2] !== "")) {
      if (m[1] === "") start = Math.max(0, size - Number(m[2]));
      else {
        start = Number(m[1]);
        if (m[2] !== "") end = Math.min(end, Number(m[2]));
      }
      if (start > end || start >= size) {
        return new Response(null, { status: 416, headers: { "content-range": `bytes */${size}` } });
      }
      status = 206;
    }
    const h = new Headers({
      "content-type": entry.type,
      "accept-ranges": "bytes",
      "cache-control": "public, max-age=31536000, immutable",
      "content-length": String(end - start + 1),
    });
    if (status === 206) h.set("content-range", `bytes ${start}-${end}/${size}`);
    if (request.method === "HEAD") return new Response(null, { status, headers: h });

    const rows = this.ctx.storage.sql
      .exec("SELECT idx, data FROM chunks WHERE key = ? AND idx BETWEEN ? AND ? ORDER BY idx", key, Math.floor(start / CHUNK), Math.floor(end / CHUNK))
      .toArray();
    const out = new Uint8Array(end - start + 1);
    let pos = 0;
    for (const r of rows) {
      const buf = new Uint8Array(r.data);
      const base = r.idx * CHUNK;
      const s = Math.max(start, base) - base;
      const e = Math.min(end, base + buf.length - 1) - base;
      out.set(buf.subarray(s, e + 1), pos);
      pos += e - s + 1;
    }
    return new Response(out, { status, headers: h });
  }

  // ---------- media upload (founder only) ----------
  async upload(request, url) {
    const token = (request.headers.get("authorization") || "").replace(/^Bearer /, "");
    const user = this.userByToken(token);
    if (!user || user.role !== "founder") return json({ error: "forbidden" }, 403);

    const kind = url.searchParams.get("kind");
    if (!LIMITS[kind]) return json({ error: "kind" }, 400);
    const type = (request.headers.get("content-type") || "").split(";")[0].trim();
    if (!TYPE_RE[kind].test(type)) return json({ error: "type" }, 415);
    const len = Number(request.headers.get("content-length") || 0);
    if (!len || len > LIMITS[kind]) return json({ error: "size" }, 413);
    if (this.state.media.length >= MAX_MEDIA) return json({ error: "library_full" }, 409);

    const id = crypto.randomUUID();
    const key = `${kind}/${id}`;
    const sql = this.ctx.storage.sql;

    // stream the body into 1 MB rows; never trust content-length alone
    const reader = request.body.getReader();
    let parts = [];
    let buffered = 0;
    let idx = 0;
    let total = 0;
    const flush = (final) => {
      while (buffered >= CHUNK || (final && buffered > 0)) {
        const take = Math.min(buffered, CHUNK);
        const out = new Uint8Array(take);
        let off = 0;
        while (off < take) {
          const p = parts[0];
          const need = take - off;
          if (p.length <= need) {
            out.set(p, off);
            off += p.length;
            parts.shift();
          } else {
            out.set(p.subarray(0, need), off);
            parts[0] = p.subarray(need);
            off += need;
          }
        }
        buffered -= take;
        sql.exec("INSERT INTO chunks (key, idx, data) VALUES (?, ?, ?)", key, idx++, out.buffer);
      }
    };
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > LIMITS[kind]) throw new Error("size");
        parts.push(value);
        buffered += value.length;
        flush(false);
      }
      flush(true);
      if (total === 0) throw new Error("empty");
    } catch (e) {
      sql.exec("DELETE FROM chunks WHERE key = ?", key);
      try {
        await reader.cancel();
      } catch {}
      return json({ error: e.message === "size" ? "size" : "upload" }, e.message === "size" ? 413 : 400);
    }

    const title = (url.searchParams.get("name") || kind).replace(/[<>]/g, "").slice(0, 60);
    this.state.media.push({ id, kind, name: title, key, type, size: total, at: Date.now() });
    await this.save();
    this.broadcast({ t: "state", state: this.publicState() });
    return json({ ok: true, id });
  }

  // ---------- realtime ----------
  openSocket(request, url) {
    if (request.headers.get("Upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
    const user = this.userByToken(url.searchParams.get("token"));
    if (!user) return new Response("unauthorized", { status: 401 });

    // one live session per name
    for (const s of this.ctx.getWebSockets()) {
      const a = s.deserializeAttachment();
      if (a && a.name === user.name) {
        try {
          s.close(4000, "replaced");
        } catch {}
      }
    }

    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const id = crypto.randomUUID().slice(0, 8);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ id, name: user.name, role: user.role });
    const p = { x: (Math.random() - 0.5) * 8, z: 12 + Math.random() * 4, ry: Math.PI };
    this.pos.set(id, p);

    const myVote = this.state.poll ? this.state.poll.voters[user.name.toLowerCase()] ?? null : null;
    server.send(
      JSON.stringify({
        t: "init",
        you: { id, name: user.name, role: user.role, ...p },
        players: this.players(),
        state: this.publicState(),
        myVote,
        now: Date.now(),
      })
    );
    this.broadcast({ t: "join", p: { id, name: user.name, role: user.role, ...p } }, id);
    return new Response(null, { status: 101, webSocket: client });
  }

  players() {
    const out = [];
    for (const s of this.ctx.getWebSockets()) {
      if (s.readyState !== 1) continue;
      const a = s.deserializeAttachment();
      if (!a) continue;
      out.push({ ...a, ...(this.pos.get(a.id) || { x: 0, z: 12, ry: 0 }) });
    }
    return out;
  }

  publicState() {
    const s = this.state;
    let poll = null;
    if (s.poll) {
      const counts = s.poll.options.map(() => 0);
      for (const v of Object.values(s.poll.voters)) if (counts[v] !== undefined) counts[v]++;
      poll = {
        id: s.poll.id,
        question: s.poll.question,
        open: s.poll.open,
        options: s.poll.options.map((o, i) => ({ text: o.text, votes: counts[i] })),
      };
    }
    return { media: s.media, screens: s.screens, music: s.music, poll };
  }

  broadcast(msg, exceptId) {
    const data = JSON.stringify(msg);
    for (const s of this.ctx.getWebSockets()) {
      if (s.readyState !== 1) continue;
      const a = s.deserializeAttachment();
      if (exceptId && a && a.id === exceptId) continue;
      try {
        s.send(data);
      } catch {}
    }
  }

  async webSocketMessage(ws, raw) {
    if (typeof raw !== "string" || raw.length > 4000) return;
    let m;
    try {
      m = JSON.parse(raw);
    } catch {
      return;
    }
    const me = ws.deserializeAttachment();
    if (!me) return;

    switch (m.t) {
      case "move": {
        const x = Math.max(-80, Math.min(80, Number(m.x) || 0));
        const z = Math.max(-80, Math.min(80, Number(m.z) || 0));
        const ry = Number(m.ry) || 0;
        this.pos.set(me.id, { x, z, ry });
        this.broadcast({ t: "move", id: me.id, x, z, ry }, me.id);
        break;
      }
      case "chat": {
        const text = String(m.text || "").trim().slice(0, 200);
        if (!text) return;
        const now = Date.now();
        if (now - (this.lastChat.get(me.id) || 0) < 700) return;
        this.lastChat.set(me.id, now);
        const tr = await translateAll(this.env, text, m.lang);
        this.broadcast({ t: "chat", id: me.id, name: me.name, role: me.role, text: tr });
        break;
      }
      case "vote": {
        const poll = this.state.poll;
        if (!poll || !poll.open) return;
        const i = Number(m.opt);
        if (!Number.isInteger(i) || i < 0 || i >= poll.options.length) return;
        poll.voters[me.name.toLowerCase()] = i;
        await this.save();
        ws.send(JSON.stringify({ t: "myvote", pollId: poll.id, opt: i }));
        this.broadcast({ t: "state", state: this.publicState() });
        break;
      }
      case "admin": {
        if (me.role !== "founder") return;
        await this.admin(m);
        break;
      }
    }
  }

  async admin(m) {
    const s = this.state;
    switch (m.a) {
      case "screen": {
        const i = Number(m.screen);
        if (!Number.isInteger(i) || i < 0 || i > 4) return;
        if (m.mediaId === null) s.screens[i] = null;
        else {
          const media = s.media.find((x) => x.id === m.mediaId && x.kind === "photo");
          if (!media) return;
          s.screens[i] = media.id;
        }
        break;
      }
      case "play": {
        const media = s.media.find((x) => x.id === m.mediaId && x.kind === "music");
        if (!media) return;
        s.music = { id: media.id, startedAt: Date.now() };
        break;
      }
      case "stop":
        s.music = { id: null, startedAt: 0 };
        break;
      case "poll": {
        const q = String(m.question || "").trim().slice(0, 140);
        const opts = (Array.isArray(m.options) ? m.options : [])
          .map((o) => String(o || "").trim().slice(0, 60))
          .filter(Boolean)
          .slice(0, 6);
        if (!q || opts.length < 2) return;
        const [question, ...options] = await Promise.all([
          translateAll(this.env, q, m.lang),
          ...opts.map((o) => translateAll(this.env, o, m.lang)),
        ]);
        s.poll = {
          id: crypto.randomUUID().slice(0, 8),
          question,
          options: options.map((text) => ({ text })),
          open: true,
          voters: {},
        };
        break;
      }
      case "closepoll":
        if (s.poll) s.poll.open = false;
        break;
      case "clearpoll":
        s.poll = null;
        break;
      case "delmedia": {
        const idx = s.media.findIndex((x) => x.id === m.mediaId);
        if (idx < 0) return;
        const [media] = s.media.splice(idx, 1);
        s.screens = s.screens.map((id) => (id === media.id ? null : id));
        if (s.music.id === media.id) s.music = { id: null, startedAt: 0 };
        this.ctx.storage.sql.exec("DELETE FROM chunks WHERE key = ?", media.key);
        break;
      }
      default:
        return;
    }
    await this.save();
    this.broadcast({ t: "state", state: this.publicState() });
  }

  webSocketClose(ws) {
    this.dropSocket(ws);
  }
  webSocketError(ws) {
    this.dropSocket(ws);
  }
  dropSocket(ws) {
    const a = ws.deserializeAttachment();
    if (a) {
      this.pos.delete(a.id);
      this.lastChat.delete(a.id);
      this.broadcast({ t: "leave", id: a.id, name: a.name }, a.id);
    }
    try {
      ws.close();
    } catch {}
  }
}
