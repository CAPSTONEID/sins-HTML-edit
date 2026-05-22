import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";

const appDir = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || process.argv[2] || 4189);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml; charset=utf-8",
  ".ico": "image/x-icon"
};

const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      sendJson(response, 405, { error: "정적 파일 요청만 처리합니다." });
      return;
    }

    const url = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`);
    await serveStatic(url.pathname, response, request.method === "HEAD");
  } catch (error) {
    sendJson(response, 500, { error: error.message || "서버 오류가 발생했습니다." });
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`HTML Live Editor 서버 실행: http://127.0.0.1:${port}`);
});

async function serveStatic(pathname, response, headOnly) {
  const requested = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const filePath = path.resolve(appDir, requested);

  if (!filePath.startsWith(appDir + path.sep) && filePath !== appDir) {
    sendJson(response, 403, { error: "접근할 수 없는 경로입니다." });
    return;
  }

  let info;
  try {
    info = await stat(filePath);
  } catch {
    sendJson(response, 404, { error: "파일을 찾을 수 없습니다." });
    return;
  }

  if (!info.isFile()) {
    sendJson(response, 404, { error: "파일을 찾을 수 없습니다." });
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": "no-store"
  });

  if (headOnly) {
    response.end();
    return;
  }

  response.end(await readFile(filePath));
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(payload));
}
