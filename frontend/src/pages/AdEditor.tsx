import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { api } from '../lib/api';
import { Input } from 'gnome-ui/input';
import { Card, CardContent, CardHeader, CardTitle } from 'gnome-ui/card';
import { Tabs } from 'gnome-ui/tabs';
import { ArrowLeft, Code, ImageIcon } from 'lucide-react';

const inputClass =
  'flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

const btnClass =
  'cursor-pointer inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring gap-2';

const btnOutline =
  'cursor-pointer inline-flex items-center justify-center rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-150 hover:bg-accent/50 gap-2';

export default function AdEditor() {
  const { id } = useParams();
  const isEditing = !!id && id !== 'new';
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [type, setType] = useState<'image' | 'html'>('image');
  const [content, setContent] = useState('');
  const [styles, setStyles] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [width, setWidth] = useState(728);
  const [height, setHeight] = useState(90);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setLoading(true);
      api.getAd(id!)
        .then((ad) => {
          setName(ad.name);
          setType(ad.type);
          setContent(ad.content);
          setStyles(ad.styles || '');
          setTargetUrl(ad.targetUrl);
          setWidth(ad.width);
          setHeight(ad.height);
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const data = { name, type, content, styles, targetUrl, width, height };
      if (isEditing) {
        await api.updateAd(id!, data);
      } else {
        await api.createAd(data);
      }
      navigate('/ads');
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/ads')} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Ad' : 'Create Ad'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? 'Update your ad banner' : 'Design a new ad banner'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Name</label>
                  <Input
                    className={inputClass}
                    placeholder="My awesome banner"
                    value={name}
                    onChange={(e: any) => setName(e.target?.value ?? e)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Target URL</label>
                  <Input
                    className={inputClass}
                    placeholder="https://example.com/landing"
                    value={targetUrl}
                    onChange={(e: any) => setTargetUrl(e.target?.value ?? e)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Width (px)</label>
                    <Input
                      className={inputClass}
                      type="number"
                      value={width}
                      onChange={(e: any) => setWidth(Number(e.target?.value ?? e))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Height (px)</label>
                    <Input
                      className={inputClass}
                      type="number"
                      value={height}
                      onChange={(e: any) => setHeight(Number(e.target?.value ?? e))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Content</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <Tabs.Root
                  defaultValue={type}
                  onValueChange={(v: any) => setType(v as 'image' | 'html')}
                >
                  <Tabs.List className="relative flex border-b border-border mb-4">
                    <Tabs.Tab
                      value="image"
                      className="px-4 py-2 text-sm font-medium text-muted-foreground data-[active]:text-foreground transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                      Image
                    </Tabs.Tab>
                    <Tabs.Tab
                      value="html"
                      className="px-4 py-2 text-sm font-medium text-muted-foreground data-[active]:text-foreground transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <Code className="h-3.5 w-3.5" />
                      HTML
                    </Tabs.Tab>
                    <Tabs.Indicator
                      className="absolute bottom-0 h-0.5 rounded-full bg-primary transition-[left,width] duration-200"
                      style={{
                        left: 'var(--active-tab-left)',
                        width: 'var(--active-tab-width)',
                      }}
                    />
                  </Tabs.List>

                  <Tabs.Panel value="image" className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">Image URL</label>
                      <Input
                        className={inputClass}
                        placeholder="https://example.com/banner.png"
                        value={type === 'image' ? content : ''}
                        onChange={(e: any) => setContent(e.target?.value ?? e)}
                      />
                    </div>
                  </Tabs.Panel>

                  <Tabs.Panel value="html" className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">HTML Content</label>
                      <textarea
                        className="flex min-h-32 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring font-mono resize-y"
                        placeholder='<div class="banner">Your ad here</div>'
                        value={type === 'html' ? content : ''}
                        onChange={(e) => setContent(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">CSS Styles</label>
                      <textarea
                        className="flex min-h-20 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring font-mono resize-y"
                        placeholder=".banner { background: linear-gradient(...); }"
                        value={styles}
                        onChange={(e) => setStyles(e.target.value)}
                      />
                    </div>
                  </Tabs.Panel>
                </Tabs.Root>
              </CardContent>
            </Card>

            <div className="flex gap-3">
              <button type="submit" className={btnClass} disabled={saving}>
                {saving ? 'Saving...' : isEditing ? 'Update Ad' : 'Create Ad'}
              </button>
              <button type="button" className={btnOutline} onClick={() => navigate('/ads')}>
                Cancel
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm">Preview</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className="border border-dashed border-border rounded-xl overflow-hidden bg-muted/30 flex items-center justify-center"
                  style={{ width: '100%', aspectRatio: `${width}/${height}` }}
                >
                  {type === 'image' && content ? (
                    <img
                      src={content}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : type === 'html' && content ? (
                    <div className="w-full h-full overflow-hidden">
                      {styles && <style>{styles}</style>}
                      <div dangerouslySetInnerHTML={{ __html: content }} />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">No content yet</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {width} × {height} px
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
