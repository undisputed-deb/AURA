'use client';

import dynamic from 'next/dynamic';
import { InterviewComposition } from './InterviewComposition';

const Player = dynamic(
  () => import('@remotion/player').then(m => m.Player),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          aspectRatio: '16/9',
          background: '#1a1822',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ color: 'rgba(212,163,90,0.5)', fontSize: 14 }}>Loading demo...</div>
      </div>
    ),
  }
);

export function RemotionPlayerWrapper() {
  return (
    <Player
      component={InterviewComposition}
      durationInFrames={420}
      compositionWidth={900}
      compositionHeight={506}
      fps={30}
      style={{ width: '100%', borderRadius: '12px' }}
      autoPlay
      loop
      controls={false}
      inputProps={{}}
    />
  );
}
