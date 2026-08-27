import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 20,
          background: 'linear-gradient(135deg, #0f172a 0%, #064e3b 50%, #022c22 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
          border: '1.5px solid rgba(52, 211, 153, 0.5)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          position: 'relative',
        }}
      >
        <div
          style={{
            fontWeight: 900,
            fontSize: 20,
            color: '#34d399',
            textShadow: '0 0 8px rgba(52, 211, 153, 0.8), 0 2px 4px rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          V
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
