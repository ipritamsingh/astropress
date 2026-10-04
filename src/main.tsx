// Polyfill/guard to ensure window.fetch can be assigned without throwing
// "Cannot set property fetch of #<Window> which has only a getter"
try {
  if (typeof window !== 'undefined') {
    const nativeFetch = window.fetch;
    let activeFetch = nativeFetch ? nativeFetch.bind(window) : undefined;
    if (typeof Window !== 'undefined' && Window.prototype) {
      const protoDesc = Object.getOwnPropertyDescriptor(Window.prototype, 'fetch');
      if (protoDesc && !protoDesc.set && protoDesc.configurable) {
        Object.defineProperty(Window.prototype, 'fetch', {
          get() {
            return activeFetch;
          },
          set(fn) {
            activeFetch = typeof fn === 'function' ? fn : nativeFetch;
          },
          configurable: true,
          enumerable: true,
        });
      }
    }
    Object.defineProperty(window, 'fetch', {
      get() {
        return activeFetch;
      },
      set(fn) {
        activeFetch = typeof fn === 'function' ? fn : nativeFetch;
      },
      configurable: true,
      enumerable: true,
    });
  }
} catch (_) {}

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);

