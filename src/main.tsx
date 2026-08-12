import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {GoogleOAuthProvider} from '@react-oauth/google';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '1088730999557-placeholder.apps.googleusercontent.com';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider
      clientId={googleClientId}
      onScriptLoadError={() => {
        // Trình duyệt/tiện ích chặn thẳng script accounts.google.com/gsi/client
        // (hay gặp với chế độ Chống theo dõi Nâng cao của Firefox, hoặc extension
        // chặn quảng cáo/tracker). Phát sự kiện toàn cục để LoginView hiện hướng
        // dẫn khắc phục thay vì để ô đăng nhập trống mà không rõ lý do — xem
        // LoginView.tsx (useGoogleScriptBlocked).
        window.dispatchEvent(new Event('gimasys:google-script-error'));
      }}
    >
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </GoogleOAuthProvider>
  </StrictMode>,
);
