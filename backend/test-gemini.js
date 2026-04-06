require('dotenv').config();
const key = process.env.GEMINI_API_KEY;

async function test() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: "Hello from Node" }] }]
    })
  });
  
  if (!response.ok) {
    console.error("FAILED!", response.status);
  }
  const text = await response.text();
  console.log(text);
}

test();
