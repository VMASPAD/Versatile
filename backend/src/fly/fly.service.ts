import { Injectable, Logger } from '@nestjs/common';
import { SarychDBService } from '../SarychDB';
import * as crypto from 'crypto';

export interface CreateFlyDto {
  targetUrl: string;
  adId: string; // Versatile Ad ID to show during countdown
  internalLabel?: string; // Optional internal label for user organization
}

@Injectable()
export class FlyService {
  private readonly logger = new Logger(FlyService.name);

  constructor(private readonly db: SarychDBService) {}

  async create(username: string, password: string, dto: CreateFlyDto) {
    // Auto-generate 6 char short slug
    const slug = crypto.randomBytes(4).toString('hex').slice(0, 6);

    const record = {
      slug,
      targetUrl: dto.targetUrl,
      adId: dto.adId,
      internalLabel: dto.internalLabel || '',
      owner: username,
      clicks: 0,
      createdAt: new Date().toISOString(),
    };

    const result = await this.db.post(username, password, 'fly', record);

    // Register in system registry for public lookup
    await this.db.registerFly(slug, username, password);

    return result;
  }

  async findAll(username: string, password: string) {
    const result = await this.db.browse(username, password, 'fly', 1, 1000);
    return result.data || [];
  }

  async remove(username: string, password: string, id: string) {
    try {
      const result = await this.db.get(username, password, 'fly', id);
      const records: any[] = result.results || [];
      const record = records.find((r: any) => r._id === id);
      if (record) {
        await this.db.unregisterFly(record.slug);
      }
    } catch {}

    return this.db.deleteById(username, password, 'fly', id);
  }

  async getPublicBySlug(slug: string): Promise<any> {
    const lookup = await this.db.lookupFly(slug);
    if (!lookup) return null;

    try {
      const result = await this.db.browse(lookup.owner, lookup.ownerPass, 'fly', 1, 1000);
      const records: any[] = result.data || [];
      return records.find((r: any) => r.slug === slug) || null;
    } catch {
      return null;
    }
  }

  async incrementClicks(slug: string) {
    const lookup = await this.db.lookupFly(slug);
    if (!lookup) return;

    try {
      const result = await this.db.browse(lookup.owner, lookup.ownerPass, 'fly', 1, 1000);
      const records: any[] = result.data || [];
      const record = records.find((r: any) => r.slug === slug);
      if (record) {
        await this.db.edit(lookup.owner, lookup.ownerPass, 'fly', {
          _id: record._id,
          clicks: (record.clicks || 0) + 1,
        });
      }
    } catch {}
  }

  renderWaitPage(record: any, apiBase: string): string {
    return FLY_HTML
      .replace(/\{\{TARGET_URL\}\}/g, record.targetUrl || '#')
      .replace(/\{\{AD_ID\}\}/g, record.adId || '')
      .replace(/\{\{API_BASE\}\}/g, apiBase)
      .replace(/\{\{SLUG\}\}/g, escapeHtml(record.slug || ''));
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const FLY_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Redirecting — Versatile Fly</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    min-height:100vh;
    font-family:'Inter',system-ui,-apple-system,sans-serif;
    background:#07070b;
    color:#e4e4e7;
    overflow:hidden;
  }
  .layout{
    min-height:100vh;
    display:flex;flex-direction:column;
    align-items:center;
  }
  .ad-banner{
    width:100%;
    display:flex;justify-content:center;
    padding:20px 16px;
    background:rgba(255,255,255,.02);
    border-bottom:1px solid rgba(255,255,255,.06);
    min-height:120px;
    align-items:center;
  }
  .ad-label{
    font-size:10px;
    text-transform:uppercase;
    letter-spacing:1.5px;
    color:#52525b;
    position:absolute;
    top:6px;right:16px;
  }
  .center{
    flex:1;display:flex;
    align-items:center;justify-content:center;
    padding:24px 16px;
  }
  .card{
    position:relative;
    background:rgba(255,255,255,.03);
    border:1px solid rgba(255,255,255,.08);
    border-radius:24px;
    padding:48px 40px;
    max-width:460px;width:100%;
    text-align:center;
    backdrop-filter:blur(24px);
  }
  .card::before{
    content:'';position:absolute;inset:-1px;border-radius:25px;
    background:linear-gradient(135deg,rgba(99,102,241,.3),transparent 40%,transparent 60%,rgba(168,85,247,.3));
    z-index:-1;
  }
  .logo{
    font-size:24px;font-weight:700;letter-spacing:-.5px;margin-bottom:28px;
    background:linear-gradient(135deg,#818cf8,#a78bfa,#c084fc);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  }
  .progress-wrap{
    position:relative;width:120px;height:120px;margin:0 auto 28px;
  }
  .progress-ring{width:120px;height:120px;transform:rotate(-90deg)}
  .progress-bg{fill:none;stroke:rgba(255,255,255,.06);stroke-width:4}
  .progress-bar{
    fill:none;stroke:url(#grad);stroke-width:4;
    stroke-linecap:round;
    stroke-dasharray:339.292;
    stroke-dashoffset:339.292;
    transition:stroke-dashoffset .4s ease;
  }
  .countdown-num{
    position:absolute;inset:0;
    display:flex;align-items:center;justify-content:center;
    font-size:40px;font-weight:700;
    background:linear-gradient(135deg,#818cf8,#c084fc);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  }
  .msg{font-size:15px;color:#a1a1aa;line-height:1.6;margin-bottom:8px}
  .url-box{
    font-size:12px;color:#71717a;word-break:break-all;
    padding:10px 14px;
    background:rgba(255,255,255,.03);
    border-radius:12px;
    border:1px solid rgba(255,255,255,.06);
    margin-top:16px;
    max-height:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  }
  .btn-continue{
    display:inline-flex;align-items:center;gap:8px;
    margin-top:24px;
    padding:12px 32px;
    border-radius:12px;font-size:14px;font-weight:600;
    border:none;cursor:pointer;
    background:linear-gradient(135deg,#818cf8,#a78bfa);
    color:#fff;
    text-decoration:none;
    opacity:0;pointer-events:none;
    transform:translateY(8px);
    transition:opacity .4s,transform .4s,box-shadow .25s;
  }
  .btn-continue.visible{
    opacity:1;pointer-events:auto;
    transform:translateY(0);
  }
  .btn-continue:hover{
    box-shadow:0 8px 32px rgba(129,140,248,.35);
  }
  .bg-orb{
    position:fixed;border-radius:50%;pointer-events:none;z-index:-1;
    filter:blur(100px);opacity:.25;
  }
  .bg-orb-1{width:500px;height:500px;background:#818cf8;top:-150px;left:-150px}
  .bg-orb-2{width:400px;height:400px;background:#c084fc;bottom:-120px;right:-120px}
  .card{opacity:0;animation:fadeUp .6s .1s ease forwards}
  @keyframes fadeUp{
    from{opacity:0;transform:translateY(20px)}
    to{opacity:1;transform:translateY(0)}
  }
</style>
</head>
<body>
<div class="bg-orb bg-orb-1"></div>
<div class="bg-orb bg-orb-2"></div>

<div class="layout">
  <div class="ad-banner" style="position:relative">
    <span class="ad-label">Advertisement</span>
    <div id="versatile-fly-ad"></div>
  </div>

  <div class="center">
    <div class="card">
      <div class="logo">Versatile Fly</div>
      <div class="progress-wrap">
        <svg class="progress-ring" viewBox="0 0 120 120">
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#818cf8"/>
              <stop offset="100%" stop-color="#c084fc"/>
            </linearGradient>
          </defs>
          <circle class="progress-bg" cx="60" cy="60" r="54"/>
          <circle class="progress-bar" id="pbar" cx="60" cy="60" r="54"/>
        </svg>
        <div class="countdown-num" id="cd">5</div>
      </div>
      <p class="msg">Your link is ready in <strong id="cd-text">5 seconds</strong></p>
      <div class="url-box">{{TARGET_URL}}</div>
      <a class="btn-continue" id="continue-btn" href="{{TARGET_URL}}">
        Continue to site →
      </a>
    </div>
  </div>
</div>

<script src="{{API_BASE}}/widget/versatile.js" data-ad-id="{{AD_ID}}" data-api="{{API_BASE}}" data-target="versatile-fly-ad"></script>

<script>
(function(){
  var seconds = 5;
  var total = 5;
  var circumference = 2 * Math.PI * 54;
  var cd = document.getElementById("cd");
  var cdText = document.getElementById("cd-text");
  var pbar = document.getElementById("pbar");
  var btn = document.getElementById("continue-btn");
  var target = "{{TARGET_URL}}";

  try {
    var body = JSON.stringify({
      adId:"{{AD_ID}}",
      eventType:"fly_view",
      pageUrl:location.href,
      userAgent:navigator.userAgent,
      referrer:document.referrer,
      screenWidth:screen.width,
      screenHeight:screen.height
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("{{API_BASE}}/track/event", new Blob([body],{type:"application/json"}));
    }
  } catch(e){}

  var iv = setInterval(function(){
    seconds--;
    cd.textContent = seconds;
    cdText.textContent = seconds + " second" + (seconds !== 1 ? "s" : "");

    var progress = (total - seconds) / total;
    pbar.style.strokeDashoffset = circumference * (1 - progress);

    if (seconds <= 2) {
      btn.classList.add("visible");
    }
    if (seconds <= 0) {
      clearInterval(iv);
      window.location.href = target;
    }
  }, 1000);
})();
</script>
</body>
</html>`;
