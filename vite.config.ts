import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
    // Använd PORT från miljövariabel, annars 5000 (user) som default
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;
    return {
      server: {
        port,
        host: '0.0.0.0',
        allowedHosts: true,
        middlewareMode: false,
      },
      plugins: [
        {
          name: 'api-middleware',
          configureServer(server) {
            server.middlewares.use('/api/config/anthropic-key', (req, res) => {
              const key = process.env.ANTHROPIC_API_KEY;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ apiKey: key || '' }));
            });
            server.middlewares.use('/api/config/google-key', (req, res) => {
              const key = process.env.GOOGLE_GENAI_API_KEY;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ apiKey: key || '' }));
            });
            server.middlewares.use('/api/config/openai-key', (req, res) => {
              const key = process.env.OPENAI_API_KEY;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ apiKey: key || '' }));
            });
            server.middlewares.use('/api/config/groq-key', (req, res) => {
              const key = process.env.GROQ_API_KEY;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ apiKey: key || '' }));
            });
            server.middlewares.use('/api/config/mistral-key', (req, res) => {
              const key = process.env.MISTRAL_API_KEY;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ apiKey: key || '' }));
            });
          }
        }
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
