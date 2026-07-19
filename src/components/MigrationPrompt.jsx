import React, { useState } from 'react';
import { UploadCloud, Check } from 'lucide-react';
import { C } from '../theme.js';
import BigButton from './BigButton.jsx';
import { storageGet } from '../lib/storage.js';
import { queueRoundSync, flushSyncQueue } from '../lib/sync.js';

export default function MigrationPrompt({ userId, holesConfig, courseId, localRoundsCount, onDone }) {
  const [status, setStatus] = useState('idle'); // idle | working | done

  async function handleUpload() {
    setStatus('working');
    const idx = (await storageGet('rounds-index')) || [];
    for (const r of idx) {
      await queueRoundSync(r.id);
    }
    await flushSyncQueue(userId, holesConfig, courseId);
    setStatus('done');
    setTimeout(() => onDone(true), 900);
  }

  function handleSkip() {
    onDone(false);
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '24px', width: '100%', textAlign: 'center' }}>
        <UploadCloud size={40} color={C.pine} style={{ marginBottom: 10 }} />
        <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: 20, fontWeight: 600, color: C.ink, marginBottom: 6 }}>
          Found {localRoundsCount} round{localRoundsCount === 1 ? '' : 's'} on this phone
        </div>
        <p style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 22 }}>
          Upload them to your account so they're backed up and available on any device.
        </p>

        <BigButton onClick={handleUpload} disabled={status === 'working'} style={{ marginBottom: 10 }}>
          {status === 'done' ? (
            <>
              <Check size={19} /> Uploaded
            </>
          ) : status === 'working' ? (
            'Uploading…'
          ) : (
            'Upload My Rounds'
          )}
        </BigButton>
        <button type="button" onClick={handleSkip} style={{ background: 'none', border: 'none', color: C.inkSoft, fontSize: 13, fontWeight: 600 }}>
          Skip for now
        </button>
      </div>
    </div>
  );
}
