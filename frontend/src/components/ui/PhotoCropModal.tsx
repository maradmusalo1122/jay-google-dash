/**
 * PhotoCropModal — Facebook-style "Reposition" / LinkedIn "Adjust photo" flow.
 *
 * Lets the user drag-to-pan and scroll/pinch-to-zoom an uploaded image inside
 * either a circular (avatar) or wide-rectangular (cover) mask, then outputs a
 * cropped image as a data URL ready to drop into <img src=…>.
 *
 *   <PhotoCropModal
 *     open={!!sourceImage}
 *     image={sourceImage}
 *     shape="round"       // 'round' = 1:1 circle (avatar), 'rect' = aspect ratio
 *     aspect={1}          // ignored when shape='round' (forced to 1)
 *     outputSize={400}    // longer-edge px of the saved image
 *     onCancel={…}
 *     onSave={(dataUrl) => …}
 *   />
 */
import { useCallback, useState } from 'react'
import Cropper, { type Area } from 'react-easy-crop'
import Modal from './Modal'

type Shape = 'round' | 'rect'

interface Props {
  open: boolean
  image: string | null
  shape: Shape
  /** Width / height ratio of the crop box. Ignored when shape='round'. */
  aspect?: number
  /** Longer-edge size of the saved image, in pixels. Defaults to 400 for avatars, 1600 for covers. */
  outputSize?: number
  onCancel: () => void
  onSave: (croppedDataUrl: string) => void
}

export default function PhotoCropModal({
  open,
  image,
  shape,
  aspect,
  outputSize,
  onCancel,
  onSave,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [busy, setBusy] = useState(false)

  // Effective aspect ratio
  const effectiveAspect = shape === 'round' ? 1 : aspect ?? 16 / 9
  const longEdge = outputSize ?? (shape === 'round' ? 400 : 1600)

  // Reset pan/zoom whenever a new image is loaded
  const handleImgChange = useCallback(() => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }, [])

  const handleSave = useCallback(async () => {
    if (!image || !croppedAreaPixels) return
    setBusy(true)
    try {
      const dataUrl = await renderCroppedImage(image, croppedAreaPixels, longEdge)
      onSave(dataUrl)
    } finally {
      setBusy(false)
    }
  }, [image, croppedAreaPixels, longEdge, onSave])

  return (
    <Modal open={open && !!image} onClose={onCancel} size="lg">
      <div className="p-5 sm:p-6">
        <h2 className="font-display text-xl mb-1">
          {shape === 'round' ? 'Adjust profile photo' : 'Adjust cover photo'}
        </h2>
        <p className="text-xs text-ink-3 mb-4">Drag to reposition · scroll or pinch to zoom</p>

        {image && (
          <div
            className="relative w-full bg-ink/95 rounded-md overflow-hidden"
            // Make the stage tall enough that round mask is comfortable + cover is panoramic
            style={{ height: shape === 'round' ? 360 : 260 }}
            onLoad={handleImgChange}
          >
            <Cropper
              image={image}
              crop={crop}
              zoom={zoom}
              aspect={effectiveAspect}
              cropShape={shape}
              showGrid={shape === 'rect'}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_a, areaPx) => setCroppedAreaPixels(areaPx)}
              objectFit="contain"
              minZoom={1}
              maxZoom={4}
              zoomSpeed={0.5}
              restrictPosition
            />
          </div>
        )}

        {/* Zoom slider — handy for desktop trackpads / accessibility */}
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-ink-3 w-10">Zoom</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-g-blue"
          />
          <span className="text-xs text-ink-3 w-10 text-right tabular-nums">{zoom.toFixed(2)}x</span>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-md text-ink-2 hover:text-ink rounded-sm"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={busy || !croppedAreaPixels}
            className="px-4 py-2 text-md rounded-sm bg-g-blue text-white hover:bg-g-blue/90 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ────────────────────────────────────────────────────────────────────────
 *  Rendering helper — takes the source image + the pixel area the user
 *  cropped to + the desired long-edge output size, and renders it onto
 *  an off-screen canvas. Returns a JPEG data URL (~85% quality) — kept
 *  as JPEG since profile/cover photos are virtually always photos and
 *  JPEG is a fraction of the size of PNG for the same visual quality.
 * ──────────────────────────────────────────────────────────────────── */
async function renderCroppedImage(
  src: string,
  area: Area,
  longEdge: number,
): Promise<string> {
  const img = await loadImage(src)

  // Compute output dimensions: longest edge of the CROP becomes `longEdge`
  const scale = longEdge / Math.max(area.width, area.height)
  const outW = Math.round(area.width * scale)
  const outH = Math.round(area.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = outW
  canvas.height = outH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('canvas 2d context unavailable')

  // Better image smoothing for downscaling
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'

  ctx.drawImage(
    img,
    area.x, area.y, area.width, area.height,
    0, 0, outW, outH,
  )

  return canvas.toDataURL('image/jpeg', 0.85)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = (e) => reject(e)
    img.src = src
  })
}
