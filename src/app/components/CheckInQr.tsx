/**
 * CheckInQr.tsx
 *
 * Wraps qrcode.react so the QR encoder is only downloaded when a student
 * opens the "Show Check-in QR" dialog (import with React.lazy).
 */
import { QRCodeSVG } from "qrcode.react";

export default function CheckInQr({
  value,
  size = 200,
}: {
  value: string;
  size?: number;
}) {
  return <QRCodeSVG value={value} size={size} level="M" />;
}
