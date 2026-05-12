import { Paddle, Environment } from "@paddle/paddle-node-sdk";

export const paddle = new Paddle(process.env.PADDLE_API_KEY || "", {
  environment: (process.env.NEXT_PUBLIC_PADDLE_ENV === 'production' ? Environment.production : Environment.sandbox),
});

// Load Paddle.js only on client, production-only
export function loadPaddle() {
  if (typeof window === 'undefined') return null;
  
  // Only load in production with correct domain
  if (process.env.NEXT_PUBLIC_PADDLE_ENV !== 'production') {
    console.warn('Paddle not loaded: not in production');
    return null;
  }

  if (!(window as any).Paddle) {
    const script = document.createElement('script');
    script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    script.async = true;
    document.body.appendChild(script);
  }

  return (window as any).Paddle;
}
