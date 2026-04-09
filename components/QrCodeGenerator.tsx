import React, { useEffect, useState } from 'react';
import axios from 'axios';
import QRCodeStyling from 'qr-code-styling';

export const QrCodeGenerator: React.FC<{ targetId: string }> = ({ targetId }) => {
  const [pngUrl, setPngUrl] = useState<string>('');
  const [svgUrl, setSvgUrl] = useState<string>('');

  useEffect(() => {
    async function fetchQr() {
      const res = await axios.post('/api/qr/generate', { targetId });
      const { imageUrl, token } = res.data;
      setPngUrl(imageUrl);
      // Generate SVG with logo overlay
      const qr = new QRCodeStyling({
        width: 256,
        height: 256,
        data: token,
        image: '/logo.svg', // path to Enlive logo in public folder
        dotsOptions: { color: '#000000', type: 'rounded' },
        backgroundOptions: { color: '#FFFFFF' },
        imageOptions: { hideBackgroundDots: true, imageSize: 0.4 },
      });
      const blob = await qr.getRawData('svg');
      const url = URL.createObjectURL(blob);
      setSvgUrl(url);
    }
    fetchQr();
  }, [targetId]);

  return (
    <div>
      {pngUrl && <a href={pngUrl} download="qr.png">Download PNG</a>}
      {svgUrl && <a href={svgUrl} download="qr.svg">Download SVG</a>}
    </div>
  );
};
