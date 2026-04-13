import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Input } from 'gnome-ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'gnome-ui/card';
import { User, Shield } from 'lucide-react';

const inputClass =
  'flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50';

const btnClass =
  'cursor-pointer inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all duration-150 hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring gap-2';

export default function Settings() {
  const { user } = useAuth();
  const [apiBase] = useState(import.meta.env.VITE_API_URL || 'http://localhost:3514');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account settings
        </p>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm">Account</CardTitle>
              <CardDescription>Your account details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Username</label>
            <Input
              className={inputClass}
              value={user?.username || ''}
              disabled
            />
          </div>
        </CardContent>
      </Card>

      {/* API Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm">API</CardTitle>
              <CardDescription>Integration details</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">API Base URL</label>
            <Input
              className={inputClass}
              value={apiBase}
              disabled
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Widget Script</label>
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <code className="text-xs text-foreground font-mono break-all">
                {`<script src="${apiBase}/widget/versatile.js" data-ad-id="YOUR_AD_ID" data-api="${apiBase}"></script>`}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Replace YOUR_AD_ID with your ad's ID. Get the embed code from each ad's Embed button.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">With target div</label>
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <code className="text-xs text-foreground font-mono break-all">
                {`<div id="my-ad"></div>\n<script src="${apiBase}/widget/versatile.js" data-ad-id="YOUR_AD_ID" data-api="${apiBase}" data-target="my-ad"></script>`}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Use <code className="bg-muted px-1 rounded">data-target</code> to render the ad inside an existing element.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Shortlink</label>
            <div className="p-3 rounded-xl bg-muted/50 border border-border">
              <code className="text-xs text-foreground font-mono break-all">
                {`${apiBase}/go/YOUR_AD_ID`}
              </code>
            </div>
            <p className="text-xs text-muted-foreground">
              Share this link to redirect users to your ad's target URL with a 5-second countdown.
            </p>
          </div>

          <button
            type="button"
            className={btnClass}
            onClick={() => {
              navigator.clipboard.writeText(
                `<script src="${apiBase}/widget/versatile.js" data-ad-id="YOUR_AD_ID" data-api="${apiBase}"></script>`
              );
            }}
          >
            Copy Template
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
