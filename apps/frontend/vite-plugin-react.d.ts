declare module '@vitejs/plugin-react' {
  import type { PluginOption } from 'vite';

  export interface ViteReactPluginOptions {
    [key: string]: unknown;
  }

  export default function react(options?: ViteReactPluginOptions): PluginOption;
}
