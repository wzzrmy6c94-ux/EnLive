import React, { useEffect, useState } from 'react';
import axios from 'axios';
import QRCodeStyling from 'qr-code-styling';

export const QrCodeGenerator: React.FC<{ targetId: string }> = ({ targetId }) => {
  const [pngUrl, setPngUrl] = useState<string>('');
  const [svgUrl, setSvgUrl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQr() {
      try {
        const res = await axios.post('/api/qr/generate', { targetId });
        const { imageUrl, token } = res.data;
        setPngUrl(imageUrl);
        // Generate SVG with logo overlay
        const qr = new QRCodeStyling({
          width: 256,
          height: 256,
          data: token,
          image: '/logo.svg',
          dotsOptions: { color: '#000000', type: 'rounded' },
          backgroundOptions: { color: '#FFFFFF' },
          imageOptions: { hideBackgroundDots: true, imageSize: 0.4 },
        });
        const blob = await qr.getRawData('svg');
        const url = URL.createObjectURL(blob);
        setSvgUrl(url);
        setLoading(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to generate QR code');
        setLoading(false);
      }
    }
    fetchQr();
  }, [targetId]);

  if (loading) return <p>Generating QR code…</p>;
  if (error) return <p className="text-sm text-[var(--primary)]">{error}</p>;

  return (
    <div>
      {pngUrl && <a href={pngUrl} download="qr.png">Download PNG</a>}
      {svgUrl && <a href={svgUrl} download="qr.svg">Download SVG</a>}
    </div>
  );
};
