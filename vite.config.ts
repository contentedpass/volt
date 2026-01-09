import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .env 파일에서 환경 변수를 로드합니다.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // 브라우저 환경에서도 process.env.API_KEY를 사용할 수 있도록 치환합니다.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
    },
  };
});