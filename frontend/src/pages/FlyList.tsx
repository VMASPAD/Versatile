import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Rocket, ArrowRight, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3514';

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
      setFlies(data.sort((a, b) => new Date(b._created_at || b.createdAt).getTime() - new Date(a._created_at || a.createdAt).getTime()));
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fly Links</h1>
          <p className="text-muted-foreground">Manage your monetized shortlinks and traffic.</p>
        </div>
        <button onClick={() => navigate('/fly/new')} className="btn btn-primary flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Link
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading shortlinks...</div>
        ) : flies.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
              <Rocket className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-medium mb-1">No Fly Links yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create a shortlink wrapped with your ads to monetize your outbound traffic.
            </p>
            <button onClick={() => navigate('/fly/new')} className="btn btn-primary">
              Create First Link
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Link Info</th>
                  <th className="px-6 py-4 font-medium">Stats</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-mediumtext-right">Actions</th>
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
                            className="text-foreground hover:text-primary hover:underline"
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
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(fly.createdAt || fly._created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <a
                          href={`${API_BASE}/fly/go/${fly.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-muted-foreground hover:text-primary transition-colors bg-muted/50 rounded-lg"
                          title="Open Link"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                        <button
                          onClick={() => handleDelete(fly._id)}
                          className="p-2 text-muted-foreground hover:text-destructive transition-colors bg-muted/50 rounded-lg"
                          title="Delete Link"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
