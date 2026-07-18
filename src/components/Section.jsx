import React from 'react';
import { SECTION_TITLE_STYLE } from '../theme.js';

export default function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 9 }}>
      <div style={SECTION_TITLE_STYLE}>{title}</div>
      {children}
    </div>
  );
}

