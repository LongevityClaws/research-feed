import { NextRequest } from "next/server"
import { trackOpen } from "../../../../lib/kv"

// 1x1 transparent GIF
const PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)

export async function GET(req: NextRequest) {
  const emailId = req.nextUrl.searchParams.get("id")
  if (emailId) {
    trackOpen(emailId).catch(err => console.error("[track/open] Error:", err))
  }
  return new Response(PIXEL, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}
