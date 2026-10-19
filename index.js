import { spawn } from "node:child_process"

const OPEN_URL_ROUTE = "/dsh-link-open/open-url"
const MAX_BODY_BYTES = 8 * 1024

export const inject = ["webServer"]

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let data = ""
    request.on("data", (chunk) => {
      data += chunk
      if (data.length > MAX_BODY_BYTES) {
        request.destroy()
        reject(new Error("request body too large"))
      }
    })
    request.on("end", () => {
      try { resolve(data ? JSON.parse(data) : {}) } catch { reject(new Error("invalid JSON body")) }
    })
    request.on("error", reject)
  })
}

function respond(response, status, payload) {
  const body = JSON.stringify(payload)
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  })
  response.end(body)
}

function isSameOriginJsonRequest(request) {
  const contentType = request.headers?.["content-type"] || ""
  if (!/^application\/json(?:\s*;|$)/i.test(contentType)) return { ok: false, status: 415, error: "unsupported-media-type" }
  const origin = request.headers?.origin
  const host = request.headers?.host
  if (origin && host) {
    let sameOrigin = false
    try { sameOrigin = new URL(origin).host === host } catch {}
    if (!sameOrigin) return { ok: false, status: 403, error: "cross-origin-request" }
  }
  return { ok: true }
}

function safeWebUrl(value) {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null
  } catch {
    return null
  }
}

function spawnDetached(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { detached: true, stdio: "ignore", windowsHide: true })
    child.once("error", reject)
    child.once("spawn", () => {
      child.unref()
      resolve()
    })
  })
}

async function openUrl(url) {
  if (process.platform === "win32") {
    await spawnDetached("rundll32.exe", ["url.dll,FileProtocolHandler", url])
    return
  }
  if (process.platform === "darwin") {
    await spawnDetached("open", [url])
    return
  }
  await spawnDetached("xdg-open", [url])
}

export function apply(ctx) {
  const disposeRoute = ctx.webServer.register({
    kind: "exact",
    path: OPEN_URL_ROUTE,
    handler: async (request, response) => {
      if (request.method !== "POST") return respond(response, 405, { ok: false, error: "method-not-allowed" })
      const validation = isSameOriginJsonRequest(request)
      if (!validation.ok) return respond(response, validation.status, { ok: false, error: validation.error })
      let body
      try { body = await readJsonBody(request) } catch { return respond(response, 400, { ok: false, error: "bad-request" }) }
      const url = safeWebUrl(body?.url)
      if (!url) return respond(response, 400, { ok: false, error: "invalid-url" })
      try {
        await openUrl(url)
        respond(response, 200, { ok: true })
      } catch (error) {
        ctx.logger.warn(`[dsh-link-open] failed to open URL ${url}:`, error)
        respond(response, 500, { ok: false, error: "open-url-failed" })
      }
    },
  })

  return () => { disposeRoute?.() }
}
