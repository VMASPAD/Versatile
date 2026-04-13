import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from 'gnome-ui/card';
import { Plus, Trash2, Rocket, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3514';

const btnClass =
  'cursor-pointer inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring gap-2';

const btnOutline =
  'cursor-pointer inline-flex items-center justify-center rounded-xl border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all duration-150 hover:bg-accent/50 gap-1.5';

const btnDanger =
  'cursor-pointer inline-flex items-center justify-center rounded-xl border border-destructive/30 px-3 py-1.5 text-xs font-medium text-destructive transition-all duration-150 hover:bg-destructive/10 gap-1.5';

export default function FlyList() {
  const [flies, setFlies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadFlies();
  }, []);

  const loadFlies = async () => {
    try {
      const data = await api.getFlies();
      setFlies(data.sort((a: any, b: any) => new Date(b._created_at || b.createdAt).getTime() - new Date(a._created_at || a.createdAt).getTime()));
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this shortlink?')) return;
    try {
      await api.deleteFly(id);
      setFlies(flies.filter((f) => f._id !== id));
    } catch (err: any) {
      alert('Error deleting link: ' + err.message);
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${API_BASE}/fly/go/${slug}`);
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
          <h1 className="text-2xl font-bold text-foreground">Fly Links</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your monetized shortlinks and traffic
          </p>
        </div>
        <button type="button" className={btnClass} onClick={() => navigate('/fly/new')}>
          <Plus className="h-4 w-4" />
          Create Link
        </button>
      </div>

      {flies.length > 0 ? (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-medium text-xs">Link Info</th>
                    <th className="px-6 py-4 font-medium text-xs">Stats</th>
                    <th className="px-6 py-4 font-medium text-xs">Created</th>
                    <th className="px-6 py-4 font-medium text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {flies.map((fly) => (
                    <tr key={fly._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-foreground">{fly.internalLabel || fly.slug}</span>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="text-primary truncate max-w-[150px]" title={fly.targetUrl}>
                              {fly.targetUrl}
                            </span>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <button 
                              onClick={() => copyLink(fly.slug)}
                              className="text-foreground hover:text-primary hover:underline cursor-pointer"
                              title="Click to copy"
                            >
                              .../fly/go/{fly.slug}
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                            {fly.clicks || 0} clicks
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground text-xs">
                        {new Date(fly.createdAt || fly._created_at || Date.now()).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <a
                            href={`${API_BASE}/fly/go/${fly.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={btnOutline}
                            title="Open Link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                          <button
                            onClick={() => handleDelete(fly._id)}
                            className={btnDanger}
                            title="Delete Link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Rocket className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">No Fly Links yet</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-md mx-auto">
              Create a shortlink wrapped with your ads to monetize your outbound traffic.
            </p>
            <button type="button" className={btnClass} onClick={() => navigate('/fly/new')}>
              <Plus className="h-4 w-4" />
              Create First Link
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
