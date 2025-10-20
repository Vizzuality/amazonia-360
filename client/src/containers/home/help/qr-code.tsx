"use client";

import { QRCode, QRCodeCanvas } from "@/components/ui/qr-code";

export const QRCodeHelp = () => {
  return (
    <QRCode value={window.location.href} size={88}>
      <QRCodeCanvas />
    </QRCode>
  );
};

export default QRCodeHelp;
