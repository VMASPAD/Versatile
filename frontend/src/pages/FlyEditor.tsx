import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useNavigate } from 'react-router';
import { ArrowLeft, Rocket, ShieldAlert } from 'lucide-react';

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
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/fly')}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors bg-muted/50 rounded-xl"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Fly Link</h1>
          <p className="text-muted-foreground">Monetize a shortlink by showing an Ad before redirecting.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Target URL <span className="text-destructive">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://example.com/download"
                className="input"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                The final destination the user will reach after the countdown.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">
                Display Ad <span className="text-destructive">*</span>
              </label>
              <select
                required
                className="input"
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
                <div className="flex items-start gap-2 mt-2 text-xs text-warning/80 bg-warning/10 p-2 rounded-lg border border-warning/20">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <p>You don't have any ads created yet. Create an Ad first to use this service.</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border">
              <label className="block text-sm font-medium mb-1.5">
                Internal Label (Optional)
              </label>
              <input
                type="text"
                placeholder="E.g., Spring Campaign 2026"
                className="input"
                value={internalLabel}
                onChange={(e) => setInternalLabel(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Only you will see this label. Used to organize your links.
              </p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading || !targetUrl || !adId}
              className="btn btn-primary flex items-center gap-2"
            >
              <Rocket className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Monetized Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
