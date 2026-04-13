import { Injectable, Logger } from '@nestjs/common';
import { SarychDBService } from '../SarychDB';

@Injectable()
export class WidgetService {
  private readonly logger = new Logger(WidgetService.name);

  constructor(private readonly db: SarychDBService) {}

  /**
   * Fetch an ad publicly using only its ID (no user credentials needed).
   * Internally uses the system registry to resolve owner creds.
   */
  async getAdById(adId: string) {
    const lookup = await this.db.lookupAd(adId);
    if (!lookup) return null;

    try {
      const result = await this.db.get(lookup.owner, lookup.ownerPass, 'ads', adId);
      const ads = result.results || [];
      const ad = ads.find((a: any) => a._id === adId);
      if (!ad || !ad.active) return null;

      return {
        id: ad._id,
        type: ad.type,
        content: ad.content,
        styles: ad.styles,
        targetUrl: ad.targetUrl,
        width: ad.width,
        height: ad.height,
        owner: lookup.owner,
        ownerPass: lookup.ownerPass,
      };
    } catch (e: any) {
      this.logger.error(`Failed to fetch ad ${adId}: ${e.message}`);
      return null;
    }
  }

  getEmbedScript(): string {
    return EMBED_SCRIPT;
  }

  getShortlinkPage(ad: any, apiBase: string): string {
    return SHORTLINK_HTML
      .replace(/\{\{TARGET_URL\}\}/g, ad.targetUrl || '#')
      .replace(/\{\{AD_NAME\}\}/g, escapeHtml(ad.name || 'Ad'))
      .replace(/\{\{AD_ID\}\}/g, ad.id)
      .replace(/\{\{API_BASE\}\}/g, apiBase);
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ── Embed Script ────────────────────────────────────────────────
const EMBED_SCRIPT = `(function(){
  "use strict";

  var scripts = document.querySelectorAll('script[data-ad-id]:not([data-v-init])');
  var script = document.currentScript || (scripts.length > 0 ? scripts[scripts.length - 1] : null);

  var scriptApi = script ? script.getAttribute("data-api") : null;
  var scriptAdId = script ? script.getAttribute("data-ad-id") : null;
  var scriptTarget = script ? script.getAttribute("data-target") : null;

  if (script) {
    script.setAttribute("data-v-init", "true");
  }

  // Globally expose initialization for SPAs / React
  window.Versatile = window.Versatile || {};
  window.Versatile.init = function(options) {
    if (!options) return;
    _renderAd(options.adId, options.api, options.target);
  };

  if (scriptAdId && scriptApi) {
    _renderAd(scriptAdId, scriptApi, scriptTarget);
  } else if (!scriptAdId && !window.Versatile._firstWarned) {
    console.info("[Versatile] Esperando inicializacion: No se pasaron data-ad-id en el tag <script>. Usa window.Versatile.init({...}) en React.");
    window.Versatile._firstWarned = true;
  }

  function _renderAd(AD_ID, API_BASE, TARGET_ID) {
    if (!AD_ID || !API_BASE) return;
    if (TARGET_ID && TARGET_ID.charAt(0) === '#') {
      TARGET_ID = TARGET_ID.substring(1); // remove '#' if user added it by mistake
    }

    var retryCount = 0;
    function runWidget() {
      var container;
      if (TARGET_ID) {
        container = document.getElementById(TARGET_ID);
        if (!container) {
          if (retryCount < 60) {
            retryCount++;
            setTimeout(runWidget, 50);
          } else {
            console.warn("[Versatile] Target element #" + TARGET_ID + " not found after retries. En React o SPA, asegurate de tener <div id='" + TARGET_ID + "'></div> montado o usa window.Versatile.init({...}).");
          }
          return;
        }
      } else {
        container = document.createElement("div");
        container.id = "versatile-ad-" + AD_ID;
        if (script && script.parentNode) {
          script.parentNode.insertBefore(container, script);
        } else {
          document.body.appendChild(container);
        }
      }

      if (container.dataset.vLoaded) return;
      container.dataset.vLoaded = "true";
      container.style.cssText += ";display:inline-block;position:relative;overflow:hidden;";

      // Fetch ad data (public endpoint, no credentials needed)
      fetch(API_BASE + "/widget/ad/" + AD_ID)
        .then(function(r){ return r.json(); })
        .then(function(ad){
          if (!ad || ad.error || !ad.content) return;

          container.style.width = ad.width + "px";
          container.style.height = ad.height + "px";

          var link = document.createElement("a");
          link.href = API_BASE + "/go/" + AD_ID;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.style.cssText = "display:block;width:100%;height:100%;text-decoration:none;";

          if (ad.type === "image") {
            var img = document.createElement("img");
            img.src = ad.content;
            img.style.cssText = "width:100%;height:100%;object-fit:cover;";
            link.appendChild(img);
          } else {
            var wrapper = document.createElement("div");
            wrapper.innerHTML = ad.content;
            if (ad.styles) {
              var style = document.createElement("style");
              style.textContent = ad.styles;
              wrapper.prepend(style);
            }
            wrapper.style.cssText = "width:100%;height:100%;";
            link.appendChild(wrapper);
          }

          container.appendChild(link);

          // ---- TRACKING ----
          var tracked = { impression: false };

          function sendEvent(type, extra) {
            var body = {
              adId: AD_ID,
              eventType: type,
              referrer: document.referrer,
              userAgent: navigator.userAgent,
              screenWidth: screen.width,
              screenHeight: screen.height,
              pageUrl: location.href,
              scrollDepth: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100) || 0,
            };
            if (extra) Object.keys(extra).forEach(function(k){ body[k] = extra[k]; });

            if (navigator.sendBeacon) {
              navigator.sendBeacon(API_BASE + "/track/event", new Blob([JSON.stringify(body)], {type:"application/json"}));
            } else {
              fetch(API_BASE + "/track/event", {
                method: "POST",
                headers: {"Content-Type":"application/json"},
                body: JSON.stringify(body),
                keepalive: true,
              });
            }
          }

          // Impression + viewability via IntersectionObserver
          var viewStart = 0;
          var observer = new IntersectionObserver(function(entries){
            entries.forEach(function(entry){
              if (entry.isIntersecting) {
                if (!tracked.impression) {
                  sendEvent("impression", { viewportPercent: Math.round(entry.intersectionRatio * 100) });
                  tracked.impression = true;
                }
                viewStart = Date.now();
              } else if (viewStart > 0) {
                var duration = Date.now() - viewStart;
                if (duration > 500) {
                  sendEvent("viewability", { duration: duration, viewportPercent: 0 });
                }
                viewStart = 0;
              }
            });
          }, { threshold: [0, 0.25, 0.5, 0.75, 1.0] });

          observer.observe(container);

          // Click tracking
          link.addEventListener("click", function(){
            sendEvent("click");
          });

          // Send viewability on page unload
          window.addEventListener("beforeunload", function(){
            if (viewStart > 0) {
              var duration = Date.now() - viewStart;
              if (duration > 500) {
                sendEvent("viewability", { duration: duration });
              }
            }
          });
        })
        .catch(function(err){
          console.warn("[Versatile] Failed to load ad:", err);
        });
    }

    runWidget();
  }
})();`;

// ── Shortlink HTML ──────────────────────────────────────────────
const SHORTLINK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Redirecting — Versatile</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{
    min-height:100vh;display:flex;align-items:center;justify-content:center;
    font-family:'Inter',system-ui,-apple-system,sans-serif;
    background:#0a0a0f;color:#e4e4e7;
    overflow:hidden;
  }
  .card{
    position:relative;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.08);
    border-radius:20px;
    padding:48px 40px;
    max-width:420px;width:100%;
    text-align:center;
    backdrop-filter:blur(24px);
  }
  .card::before{
    content:'';position:absolute;inset:-1px;border-radius:21px;
    background:linear-gradient(135deg,rgba(99,102,241,.3),transparent 40%,transparent 60%,rgba(168,85,247,.3));
    z-index:-1;
  }
  .logo{font-size:28px;font-weight:700;letter-spacing:-.5px;margin-bottom:24px;
    background:linear-gradient(135deg,#818cf8,#a78bfa,#c084fc);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  }
  .ring-wrap{
    position:relative;width:96px;height:96px;margin:0 auto 28px;
  }
  .ring{
    position:absolute;inset:0;border-radius:50%;
    border:3px solid rgba(255,255,255,.06);
  }
  .ring-progress{
    position:absolute;inset:0;border-radius:50%;
    border:3px solid transparent;
    border-top-color:#818cf8;
    animation:spin 1s linear infinite;
  }
  @keyframes spin{to{transform:rotate(360deg)}}
  .countdown{
    position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
    font-size:32px;font-weight:700;
    background:linear-gradient(135deg,#818cf8,#c084fc);
    -webkit-background-clip:text;-webkit-text-fill-color:transparent;
  }
  .msg{font-size:14px;color:#a1a1aa;line-height:1.6;margin-bottom:8px}
  .url{font-size:12px;color:#71717a;word-break:break-all;
    padding:8px 12px;background:rgba(255,255,255,.03);border-radius:10px;
    border:1px solid rgba(255,255,255,.06);margin-top:16px;
    max-height:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
  }
  .skip{
    display:inline-block;margin-top:20px;
    font-size:13px;color:#71717a;text-decoration:none;
    transition:color .2s;cursor:pointer;
    opacity:0;pointer-events:none;transition:opacity .3s,color .2s;
  }
  .skip.visible{opacity:1;pointer-events:auto}
  .skip:hover{color:#e4e4e7}
  .bg-glow{
    position:fixed;width:600px;height:600px;border-radius:50%;
    background:radial-gradient(circle,rgba(99,102,241,.12),transparent 70%);
    top:50%;left:50%;transform:translate(-50%,-50%);
    pointer-events:none;z-index:-2;
  }
</style>
</head>
<body>
<div class="bg-glow"></div>
<div class="card">
  <div class="logo">Versatile</div>
  <div class="ring-wrap">
    <div class="ring"></div>
    <div class="ring-progress"></div>
    <div class="countdown" id="cd">5</div>
  </div>
  <p class="msg">You are being redirected in <strong id="cd-text">5 seconds</strong></p>
  <div class="url">{{TARGET_URL}}</div>
  <a class="skip" id="skip-btn" href="{{TARGET_URL}}">Skip →</a>
</div>
<script>
(function(){
  var seconds = 5;
  var cd = document.getElementById("cd");
  var cdText = document.getElementById("cd-text");
  var skipBtn = document.getElementById("skip-btn");
  var target = "{{TARGET_URL}}";

  // Track impression via API
  try {
    var body = JSON.stringify({adId:"{{AD_ID}}",eventType:"shortlink_view",pageUrl:location.href,userAgent:navigator.userAgent,referrer:document.referrer,screenWidth:screen.width,screenHeight:screen.height});
    if (navigator.sendBeacon) {
      navigator.sendBeacon("{{API_BASE}}/track/event", new Blob([body],{type:"application/json"}));
    }
  } catch(e){}

  var iv = setInterval(function(){
    seconds--;
    cd.textContent = seconds;
    cdText.textContent = seconds + " second" + (seconds !== 1 ? "s" : "");
    if (seconds <= 3) skipBtn.classList.add("visible");
    if (seconds <= 0) {
      clearInterval(iv);
      window.location.href = target;
    }
  }, 1000);
})();
</script>
</body>
</html>`;
