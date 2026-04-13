import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Save, ExternalLink } from 'lucide-react';
import { useAuth } from '../lib/auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3514';

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bio Profile</h1>
          <p className="text-muted-foreground">Manage your monetized Link-in-Bio page.</p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            View Page
          </a>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="btn btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-lg">Your Public Link</h3>
            <p className="text-sm text-muted-foreground">Share this link anywhere to drive traffic.</p>
          </div>
          <div className="flex items-center gap-2 bg-background border border-border rounded-lg p-1 pr-2 pl-3">
            <span className="text-sm text-muted-foreground truncate max-w-[200px] sm:max-w-md">
              {profileUrl}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(profileUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="ml-2 text-primary hover:text-primary/80 text-sm font-medium px-2 py-1 bg-primary/10 rounded-md"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-medium">Profile Info</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Display Name</label>
              <input
                type="text"
                className="input"
                placeholder="John Doe"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bio</label>
              <textarea
                className="input min-h-[80px]"
                placeholder="A short description about you..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Avatar Content (URL or Image Link)</label>
              <input
                type="text"
                className="input"
                placeholder="https://example.com/avatar.png"
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">Appearance & Monetization</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Accent Color</label>
              <div className="flex gap-3 items-center">
                <input
                  type="color"
                  className="w-10 h-10 rounded border border-border cursor-pointer bg-background"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
                <input
                  type="text"
                  className="input flex-1 uppercase"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Embed Ad</label>
              <select className="input" value={adId} onChange={(e) => setAdId(e.target.value)}>
                <option value="">-- No Ad --</option>
                {ads.map((ad) => (
                  <option key={ad._id} value={ad._id}>
                    {ad.name} ({ad.type})
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Display a Versatile Ad in the middle of your profile to generate impressions.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="font-semibold text-lg">Links</h3>
            <p className="text-sm text-muted-foreground">Add links to your social media or external sites.</p>
          </div>
          <button onClick={addLink} className="btn btn-secondary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Link
          </button>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
            No links added yet. Click "Add Link" to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link, index) => (
              <div
                key={index}
                className="flex flex-col sm:flex-row gap-3 p-4 bg-background border border-border rounded-xl relative group"
              >
                <div className="w-full sm:w-1/3">
                  <label className="block text-xs text-muted-foreground mb-1">Title</label>
                  <input
                    type="text"
                    className="input py-2 text-sm"
                    placeholder="E.g., GitHub"
                    value={link.title}
                    onChange={(e) => updateLink(index, 'title', e.target.value)}
                  />
                </div>
                <div className="flex-1 w-full sm:-mt-0">
                  <label className="block text-xs text-muted-foreground mb-1">URL</label>
                  <input
                    type="url"
                    className="input py-2 text-sm"
                    placeholder="https://"
                    value={link.url}
                    onChange={(e) => updateLink(index, 'url', e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-28">
                  <label className="block text-xs text-muted-foreground mb-1">Icon</label>
                  <select
                    className="input py-2 text-sm"
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
                  className="sm:self-end sm:mb-1 p-2 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  onClick={() => removeLink(index)}
                  title="Remove link"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
