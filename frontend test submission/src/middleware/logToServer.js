// src/middleware/logToServer.js

const LOG_API_URL = 'http://200.244.56.144/evaluation-service/logs';
const AUTH_TOKEN = 'Bearer your_token_here'; // Replace with actual token if needed

export async function logToServer(stack, level, pkg, message) {
  try {
    const res = await fetch(LOG_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH_TOKEN,
      },
      body: JSON.stringify({ stack, level, package: pkg, message })
    });
    return await res.json();
  } catch (error) {
    console.error('Failed to send log:', error);
  }
}
