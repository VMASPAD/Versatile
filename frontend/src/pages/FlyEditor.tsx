import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from 'gnome-ui/card';
import { ArrowLeft, Rocket, ShieldAlert } from 'lucide-react';

const inputClass =
  'flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const btnClass =
  'cursor-pointer inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring gap-2';

const btnOutline =
  'cursor-pointer inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-150 hover:bg-accent/50 gap-2';

export default function FlyEditor() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ads, setAds] = useState<any[]>([]);

  const [targetUrl, setTargetUrl] = useState('');
  const [adId, setAdId] = useState('');
  const [internalLabel, setInternalLabel] = useState('');

  useEffect(() => {
    api.getAds().then(setAds).catch(console.error);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUrl || !adId) {
      alert('Target URL and Ad ID are required.');
      return;
    }

    try {
      let url = targetUrl;
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      setLoading(true);
      await api.createFly({ targetUrl: url, adId, internalLabel });
      navigate('/fly');
    } catch (err: any) {
      alert('Error creating link: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/fly')} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Create Fly Link</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Monetize a shortlink by showing an Ad before redirecting.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Destination</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Target URL <span className="text-destructive">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://example.com/download"
                  className={inputClass}
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The final destination the user will reach after the countdown.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Display Ad <span className="text-destructive">*</span>
                </label>
                <select
                  required
                  className={inputClass}
                  value={adId}
                  onChange={(e) => setAdId(e.target.value)}
                >
                  <option value="">-- Select an Ad to show --</option>
                  {ads.map((ad) => (
                    <option key={ad._id} value={ad._id}>
                      {ad.name} ({ad.width}x{ad.height})
                    </option>
                  ))}
                </select>
                {ads.length === 0 && (
                  <div className="flex items-start gap-2 text-xs text-amber-400/80 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
                    <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>You don't have any ads created yet. Create an Ad first to use this service.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Internal Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="E.g., Spring Campaign 2026"
                  className={inputClass}
                  value={internalLabel}
                  onChange={(e) => setInternalLabel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Only you will see this label. Used to organize your links.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || !targetUrl || !adId}
              className={btnClass}
            >
              <Rocket className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Monetized Link'}
            </button>
            <button type="button" className={btnOutline} onClick={() => navigate('/fly')}>
              Cancel
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
