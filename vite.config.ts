import { defineConfig, loadEnv, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { blueApiService } from "./server/blueApi";

function blueApiPlugin(): Plugin {
  return {
    name: "blue-api-plugin",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api/blue/")) {
          return next();
        }

        res.setHeader("Content-Type", "application/json");

        // Reload .env dynamically so file changes are immediately picked up
        const runtimeEnv = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
        if (runtimeEnv.GEMINI_API_KEY) {
          process.env.GEMINI_API_KEY = runtimeEnv.GEMINI_API_KEY.trim();
        }
        if (runtimeEnv.GEMINI_MODEL) {
          process.env.GEMINI_MODEL = runtimeEnv.GEMINI_MODEL.trim();
        }

        const url = req.url.split("?")[0];

        if (req.method === "GET" && url === "/api/blue/status") {
          const status = await blueApiService.handleStatus();
          res.statusCode = 200;
          res.end(JSON.stringify(status));
          return;
        }

        if (req.method === "POST") {
          let bodyStr = "";
          req.on("data", (chunk: any) => { bodyStr += chunk; });
          req.on("end", async () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              const headerApiKey = req.headers["x-gemini-key"] as string | undefined;
              if (headerApiKey && !body.apiKey) {
                body.apiKey = headerApiKey;
              }

              let result: any = { success: false, error: "Endpoint não encontrado" };

              if (url === "/api/blue/status") {
                result = await blueApiService.handleStatus(body.apiKey);
              } else if (url === "/api/blue/chat") {
                result = await blueApiService.handleChat(body);
              } else if (url === "/api/blue/propose-domain") {
                result = await blueApiService.handleProposeDomain(body);
              } else if (url === "/api/blue/suggest-lessons") {
                result = await blueApiService.handleSuggestLessons(body);
              } else if (url === "/api/blue/suggest-modules") {
                result = await blueApiService.handleSuggestModules(body);
              } else if (url === "/api/blue/generate-questions") {
                result = await blueApiService.handleGenerateQuestions(body);
              } else if (url === "/api/blue/evaluate-answer") {
                result = await blueApiService.handleEvaluateAnswer(body);
              } else if (url === "/api/blue/recommendations") {
                result = await blueApiService.handleRecommendations(body);
              }

              res.statusCode = result.success !== false ? 200 : 400;
              res.end(JSON.stringify(result));
            } catch (err: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ success: false, error: err?.message || "Erro interno do servidor" }));
            }
          });
        } else {
          res.statusCode = 405;
          res.end(JSON.stringify({ success: false, error: "Método não permitido" }));
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  process.env.GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  process.env.GEMINI_MODEL = env.GEMINI_MODEL || process.env.GEMINI_MODEL || "gemini-2.5-flash";
  process.env.AI_REQUEST_LIMIT_PER_DAY = env.AI_REQUEST_LIMIT_PER_DAY || "150";

  return {
    plugins: [react(), blueApiPlugin()],
    base: "./",
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
    server: {
      port: 5173,
      host: true,
    },
  };
});