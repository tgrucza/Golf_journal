import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { C } from '../theme.js';

export default function ConfigMissing() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '24px', width: '100%', textAlign: 'center' }}>
        <AlertTriangle size={36} color={C.miss} style={{ marginBottom: 12 }} />
        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 8 }}>
          Cloud storage isn't set up yet
        </div>
        <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5 }}>
          This build needs a Supabase project connected. Add <code>VITE_SUPABASE_URL</code> and{' '}
          <code>VITE_SUPABASE_ANON_KEY</code> to a <code>.env</code> file locally, and to the site's
          environment variables in Netlify, then redeploy.
        </p>
      </div>
    </div>
  );
}
