import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import JavaScriptObfuscator from 'javascript-obfuscator';
import path from 'path';

function fullObfuscatorPlugin() {
  return {
    name: 'vite-plugin-javascript-obfuscator',
    enforce: 'post' as const,
    transformIndexHtml: {
      order: 'post' as const,
      handler(html: string) {
        // Obfuscate all script tags in the generated HTML
        return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, code) => {
          if (!code.trim()) return match;
          if (attrs.includes('type="application/json"')) return match;

          try {
            const obfuscated = JavaScriptObfuscator.obfuscate(code, {
              compact: true,
              controlFlowFlattening: true,
              controlFlowFlatteningThreshold: 0.75,
              deadCodeInjection: true,
              deadCodeInjectionThreshold: 0.4,
              debugProtection: false,
              disableConsoleOutput: false,
              identifierNamesGenerator: 'hexadecimal',
              log: false,
              numbersToExpressions: true,
              renameGlobals: false,
              selfDefending: true,
              simplify: true,
              splitStrings: true,
              splitStringsChunkLength: 10,
              stringArray: true,
              stringArrayCallsTransform: true,
              stringArrayEncoding: ['base64'],
              stringArrayIndexShift: true,
              stringArrayRotate: true,
              stringArrayShuffle: true,
              stringArrayWrappersCount: 2,
              stringArrayWrappersChainedCalls: true,
              stringArrayWrappersParametersMaxCount: 4,
              stringArrayWrappersType: 'function',
              stringArrayThreshold: 0.75,
              unicodeEscapeSequence: false,
            });

            return `<script${attrs}>${obfuscated.getObfuscatedCode()}</script>`;
          } catch (e) {
            console.error('Obfuscation failed:', e);
            return match;
          }
        });
      },
    },
  };
}

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      react(),
      viteSingleFile(),
      isProd ? fullObfuscatorPlugin() : null,
    ].filter(Boolean),
    build: {
      cssCodeSplit: false,
      assetsInlineLimit: 100000000,
      minify: 'esbuild',
    },
  };
});
