'use client'

import { QRCodeSVG } from 'qrcode.react'

export default function QRCode({ value }: { value: string }) {
  return (
    <QRCodeSVG
      value={value}
      size={220}
      level="H"
    />
  )
}