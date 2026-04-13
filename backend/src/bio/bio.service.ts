import { Injectable, Logger } from '@nestjs/common';
import { SarychDBService } from '../SarychDB';

export interface LinkItem {
  title: string;
  url: string;
  icon?: string;
}

export interface BioProfile {
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  theme?: 'dark' | 'light' | 'gradient';
  accentColor?: string;
  adId?: string; // optional Versatile ad to show on the page
  links: LinkItem[];
}

@Injectable()
export class BioService {
  private readonly logger = new Logger(BioService.name);

  constructor(private readonly db: SarychDBService) {}

  async upsertProfile(
    username: string,
    password: string,
    profile: BioProfile,
  ) {
    const existing = await this.getProfileData(username, password);
    if (existing) {
      return this.db.edit(username, password, 'bio', {
        _id: existing._id,
        ...profile,
        username,
      });
    }
    
    // Register mapping for public lookup
    await this.db.registerBio(username, username, password);

    return this.db.post(username, password, 'bio', {
      ...profile,
      username,
    });
  }

  async getProfileData(username: string, password: string): Promise<any> {
    try {
      const result = await this.db.browse(username, password, 'bio', 1, 10);
      const records: any[] = result.data || [];
      return records.find((r: any) => r.username === username) || null;
    } catch {
      return null;
    }
  }

  async deleteProfile(username: string, password: string) {
    const existing = await this.getProfileData(username, password);
    if (existing) {
      await this.db.unregisterBio(username);
      return this.db.deleteById(username, password, 'bio', existing._id);
    }
    return null;
  }

  async getPublicProfile(username: string): Promise<any> {
    const lookup = await this.db.lookupBio(username);
    if (!lookup) return null;

    try {
      const result = await this.db.browse(lookup.owner, lookup.ownerPass, 'bio', 1, 10);
      const records: any[] = result.data || [];
      return records.find((r: any) => r.username === username) || null;
    } catch {
      return null;
    }
  }

  renderPublicPage(profile: any, apiBase: string): string {
    const links = (profile.links || []) as LinkItem[];
    const theme = profile.theme || 'dark';
    const accent = profile.accentColor || '#818cf8';
    const displayName = escapeHtml(profile.displayName || profile.username);
    const bioText = escapeHtml(profile.bio || '');
    const avatar = profile.avatar || '';
    const adId = profile.adId || '';

    const linksHtml = links
      .map(
        (l) => `
      <a href="${escapeHtml(l.url)}" target="_blank" rel="noopener noreferrer" class="link-item">
        ${l.icon ? `<span class="link-icon">${getIconSvg(l.icon)}</span>` : ''}
        <span class="link-title">${escapeHtml(l.title)}</span>
        <span class="link-arrow">→</span>
      </a>`,
      )
      .join('\n');

    const adSection = adId
      ? `<div class="ad-section">
           <span class="ad-label">- Advertisement -</span>
           <div id="versatile-bio-ad"></div>
         </div>
         <script src="${apiBase}/widget/versatile.js" data-ad-id="${adId}" data-api="${apiBase}" data-target="versatile-bio-ad"></script>`
      : '';

    return BIO_HTML
      .replace(/\{\{DISPLAY_NAME\}\}/g, displayName)
      .replace(/\{\{BIO\}\}/g, bioText)
      .replace(/\{\{AVATAR\}\}/g, avatar)
      .replace(/\{\{ACCENT\}\}/g, accent)
      .replace(/\{\{LINKS\}\}/g, linksHtml)
      .replace(/\{\{AD_SECTION\}\}/g, adSection)
      .replace(/\{\{USERNAME\}\}/g, escapeHtml(profile.username));
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getIconSvg(icon: string): string {
  const icons: Record<string, string> = {
    github: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>',
    twitter: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    globe: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>',
  };
  return icons[icon] || icons['link'];
}

const BIO_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>{{DISPLAY_NAME}} — Versatile Bio</title>
<meta name="description" content="{{BIO}}"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--accent:{{ACCENT}};--accent-glow:{{ACCENT}}33}

  body{
    min-height:100vh;
    font-family:'Inter',system-ui,-apple-system,sans-serif;
    background:#07070b;
    color:#e4e4e7;
    display:flex;
    flex-direction:column;
    align-items:center;
    padding:40px 16px 60px;
    position:relative;
    overflow-x:hidden;
  }
  .orb{
    position:fixed;border-radius:50%;pointer-events:none;z-index:0;
    filter:blur(80px);opacity:.35;
    animation:float 12s ease-in-out infinite alternate;
  }
  .orb-1{width:400px;height:400px;background:var(--accent);top:-100px;left:-100px;animation-delay:0s}
  .orb-2{width:350px;height:350px;background:#c084fc;bottom:-80px;right:-80px;animation-delay:-4s}
  @keyframes float{
    0%{transform:translate(0,0) scale(1)}
    33%{transform:translate(30px,-20px) scale(1.05)}
    66%{transform:translate(-20px,30px) scale(.95)}
    100%{transform:translate(10px,-10px) scale(1.02)}
  }
  .container{
    position:relative;z-index:1;
    width:100%;max-width:440px;
  }
  .profile{
    text-align:center;
    margin-bottom:32px;
  }
  .avatar-wrap{
    width:96px;height:96px;margin:0 auto 16px;
    border-radius:50%;padding:3px;
    background:linear-gradient(135deg,var(--accent),#c084fc,#f472b6);
    animation:ring-spin 4s linear infinite;
  }
  @keyframes ring-spin{
    0%{background:linear-gradient(0deg,var(--accent),#c084fc,#f472b6)}
    50%{background:linear-gradient(180deg,var(--accent),#c084fc,#f472b6)}
    100%{background:linear-gradient(360deg,var(--accent),#c084fc,#f472b6)}
  }
  .avatar{
    width:100%;height:100%;border-radius:50%;
    object-fit:cover;background:#18181b;
    display:block;
  }
  .display-name{
    font-size:22px;font-weight:700;letter-spacing:-.3px;
    margin-bottom:6px;
  }
  .bio{
    font-size:14px;color:#a1a1aa;line-height:1.5;
    max-width:320px;margin:0 auto;
  }
  .links{
    display:flex;flex-direction:column;gap:12px;
  }
  .link-item{
    display:flex;align-items:center;gap:14px;
    padding:16px 20px;
    background:rgba(255,255,255,.04);
    border:1px solid rgba(255,255,255,.08);
    border-radius:16px;
    color:#e4e4e7;
    text-decoration:none;
    transition:all .25s cubic-bezier(.4,0,.2,1);
    backdrop-filter:blur(12px);
    position:relative;
    overflow:hidden;
  }
  .link-item::before{
    content:'';position:absolute;inset:0;
    background:linear-gradient(135deg,var(--accent-glow),transparent 60%);
    opacity:0;transition:opacity .25s;
  }
  .link-item:hover{
    border-color:rgba(255,255,255,.16);
    transform:translateY(-2px) scale(1.01);
    box-shadow:0 8px 32px var(--accent-glow);
  }
  .link-item:hover::before{opacity:1}
  .link-item:active{transform:translateY(0) scale(.99)}
  .link-icon{
    flex-shrink:0;width:20px;height:20px;
    color:var(--accent);position:relative;z-index:1;
    display:flex;align-items:center;
  }
  .link-title{
    flex:1;font-size:15px;font-weight:500;
    position:relative;z-index:1;
  }
  .link-arrow{
    font-size:14px;color:#71717a;
    position:relative;z-index:1;
    transition:transform .25s,color .25s;
  }
  .link-item:hover .link-arrow{
    transform:translateX(4px);color:var(--accent);
  }
  .ad-section{
    margin:24px 0;
    display:flex;flex-direction:column;align-items:center;
  }
  .ad-label{
    font-size:9px;text-transform:uppercase;letter-spacing:1px;
    color:#52525b;margin-bottom:8px;
  }
  .footer{
    margin-top:40px;text-align:center;
    font-size:12px;color:#52525b;
  }
  .footer a{
    color:#71717a;text-decoration:none;
    transition:color .2s;
  }
  .footer a:hover{color:var(--accent)}
  .profile,.link-item,.ad-section,.footer{
    opacity:0;animation:fadeUp .5s ease forwards;
  }
  .profile{animation-delay:.1s}
  .link-item:nth-child(1){animation-delay:.2s}
  .link-item:nth-child(2){animation-delay:.28s}
  .link-item:nth-child(3){animation-delay:.36s}
  .link-item:nth-child(4){animation-delay:.44s}
  .ad-section{animation-delay:.6s}
  .footer{animation-delay:.8s}
  @keyframes fadeUp{
    from{opacity:0;transform:translateY(16px)}
    to{opacity:1;transform:translateY(0)}
  }
</style>
</head>
<body>
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>

<div class="container">
  <div class="profile">
    <div class="avatar-wrap">
      <img src="{{AVATAR}}" class="avatar" alt="Avatar"/>
    </div>
    <div class="display-name">{{DISPLAY_NAME}}</div>
    <p class="bio">{{BIO}}</p>
  </div>
  <div class="links">
    {{LINKS}}
  </div>
  {{AD_SECTION}}
  <div class="footer">
    Powered by <a href="#">Versatile Bio</a>
  </div>
</div>
</body>
</html>`;
