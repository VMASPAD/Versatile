import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from 'gnome-ui/card';
import { Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3514';

const inputClass =
  'flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const btnClass =
  'cursor-pointer inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring gap-2';

const btnOutline =
  'cursor-pointer inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-150 hover:bg-accent/50 gap-2';

const btnDanger =
  'cursor-pointer inline-flex items-center justify-center rounded-xl border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-all duration-150 hover:bg-destructive/10 gap-1.5';

type LinkItem = { title: string; url: string; icon?: string };

export default function BioProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ads, setAds] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState('');
  const [theme, setTheme] = useState('dark');
  const [accentColor, setAccentColor] = useState('#818cf8');
  const [adId, setAdId] = useState('');
  const [links, setLinks] = useState<LinkItem[]>([]);

  useEffect(() => {
    Promise.all([
      api.getBio().catch(() => null),
      api.getAds().catch(() => []),
    ]).then(([profileData, adsData]) => {
      setAds(adsData);
      if (profileData && !profileData.error) {
        setDisplayName(profileData.displayName || '');
        setBio(profileData.bio || '');
        setAvatar(profileData.avatar || '');
        setTheme(profileData.theme || 'dark');
        setAccentColor(profileData.accentColor || '#818cf8');
        setAdId(profileData.adId || '');
        setLinks(profileData.links || []);
      }
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateBio({
        displayName,
        bio,
        avatar,
        theme,
        accentColor,
        adId,
        links,
      });
      alert('Profile saved successfully!');
    } catch (err: any) {
      alert('Error saving profile: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { title: '', url: '', icon: 'link' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: keyof LinkItem, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const profileUrl = `${API_BASE}/bio/${user?.username}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Bio Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your monetized Link-in-Bio page
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={btnOutline}
          >
            <ExternalLink className="h-4 w-4" />
            View Page
          </a>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className={btnClass}
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Public Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Your Public Link</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-xs text-muted-foreground mb-3">
            Share this link anywhere to drive traffic.
          </p>
          <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-1.5 pr-2 pl-3">
            <span className="text-sm text-muted-foreground truncate flex-1">
              {profileUrl}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(profileUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-primary hover:text-primary/80 text-xs font-medium px-3 py-1.5 bg-primary/10 rounded-lg transition-colors shrink-0 cursor-pointer"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info & Appearance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Profile Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Display Name</label>
              <input
                type="text"
                className={inputClass}
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Bio</label>
              <textarea
                className="flex min-h-20 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring resize-y"
                placeholder="A short description about you..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Avatar URL</label>
              <input
                type="text"
                className={inputClass}
                placeholder="https://example.com/avatar.png"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Appearance & Monetization</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Accent Color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  className="w-10 h-10 rounded-xl border border-border cursor-pointer bg-card"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
                <input
                  type="text"
                  className={`${inputClass} flex-1 uppercase`}
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Embed Ad</label>
              <select className={inputClass} value={adId} onChange={(e) => setAdId(e.target.value)}>
                <option value="">-- No Ad --</option>
                {ads.map((ad) => (
                  <option key={ad._id} value={ad._id}>
                    {ad.name} ({ad.type})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Display a Versatile Ad in the middle of your profile to generate impressions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between w-full">
            <div>
              <CardTitle className="text-sm">Links</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Add links to your social media or external sites.
              </p>
            </div>
            <button onClick={addLink} className={btnOutline}>
              <Plus className="h-4 w-4" />
              Add Link
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {links.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed border-border rounded-xl">
              <p className="text-sm">No links added yet. Click "Add Link" to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link, index) => (
                <div
                  key={index}
                  className="flex flex-col sm:flex-row gap-3 p-4 bg-background border border-border rounded-xl relative group"
                >
                  <div className="w-full sm:w-1/3 space-y-1">
                    <label className="text-xs text-muted-foreground">Title</label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="E.g., GitHub"
                      value={link.title}
                      onChange={(e) => updateLink(index, 'title', e.target.value)}
                    />
                  </div>
                  <div className="flex-1 w-full space-y-1">
                    <label className="text-xs text-muted-foreground">URL</label>
                    <input
                      type="url"
                      className={inputClass}
                      placeholder="https://"
                      value={link.url}
                      onChange={(e) => updateLink(index, 'url', e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-28 space-y-1">
                    <label className="text-xs text-muted-foreground">Icon</label>
                    <select
                      className={inputClass}
                      value={link.icon || 'link'}
                      onChange={(e) => updateLink(index, 'icon', e.target.value)}
                    >
                      <option value="link">Link</option>
                      <option value="twitter">Twitter</option>
                      <option value="instagram">Instagram</option>
                      <option value="github">GitHub</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                      <option value="globe">Globe</option>
                      <option value="email">Email</option>
                    </select>
                  </div>
                  <button
                    className={`${btnDanger} sm:self-end sm:mb-0.5`}
                    onClick={() => removeLink(index)}
                    title="Remove link"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
