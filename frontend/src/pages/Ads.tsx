import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { api } from '../lib/api';
import { Card, CardContent } from 'gnome-ui/card';
import { Plus, Trash2, ExternalLink, BarChart3, Copy } from 'lucide-react';

const btnClass =
  'cursor-pointer inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring gap-2';

const btnOutline =
  'cursor-pointer inline-flex items-center justify-center rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-150 hover:bg-accent/50 gap-1.5';

export default function Ads() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.getAds()
      .then(setAds)
      .catch(() => setAds([]))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return;
    try {
      await api.deleteAd(id);
      setAds(ads.filter((a) => a._id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const copyEmbedCode = (ad: any) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3514';
    const code = `<script src="${apiBase}/widget/versatile.js" data-ad-id="${ad._id}" data-api="${apiBase}"></script>`;
    navigator.clipboard.writeText(code);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ads</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your ad banners
          </p>
        </div>
        <button type="button" className={btnClass} onClick={() => navigate('/ads/new')}>
          <Plus className="h-4 w-4" />
          Create Ad
        </button>
      </div>

      {/* Ad list */}
      {ads.length > 0 ? (
        <div className="grid gap-4">
          {ads.map((ad: any) => (
            <Card key={ad._id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  {/* Preview */}
                  <div className="w-40 h-28 bg-muted/50 flex items-center justify-center border-r border-border shrink-0 overflow-hidden">
                    {ad.type === 'image' ? (
                      <img
                        src={ad.content}
                        alt={ad.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '';
                          (e.target as HTMLImageElement).alt = 'Failed to load';
                        }}
                      />
                    ) : (
                      <div className="text-xs text-muted-foreground font-mono p-2 overflow-hidden max-h-full">
                        {'<html/>'}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground truncate">
                          {ad.name}
                        </h3>
                        <span
                          className={`inline-block w-1.5 h-1.5 rounded-full ${
                            ad.active ? 'bg-success' : 'bg-muted-foreground'
                          }`}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {ad.type === 'image' ? 'Image' : 'HTML'} · {ad.width}×{ad.height}px
                      </p>
                      {ad.targetUrl && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs flex items-center gap-1">
                          <ExternalLink className="h-3 w-3 shrink-0" />
                          {ad.targetUrl}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className={btnOutline}
                        onClick={() => copyEmbedCode(ad)}
                        title="Copy embed code"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Embed
                      </button>
                      <button
                        className={btnOutline}
                        onClick={() => navigate(`/analytics/${ad._id}`)}
                        title="View analytics"
                      >
                        <BarChart3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className={btnOutline}
                        onClick={() => navigate(`/ads/${ad._id}`)}
                      >
                        Edit
                      </button>
                      <button
                        className="cursor-pointer inline-flex items-center justify-center rounded-xl border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-all duration-150 hover:bg-destructive/10 gap-1.5"
                        onClick={() => handleDelete(ad._id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No ads yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first ad banner to get started.
            </p>
            <button type="button" className={btnClass} onClick={() => navigate('/ads/new')}>
              <Plus className="h-4 w-4" />
              Create Ad
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
