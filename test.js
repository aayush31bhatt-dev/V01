const key = process.env.GEMINI_API_KEY || 'AIzaSyCeEDGnazHE1YvfTMsB27Ks7mYlINPKg1s';
fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + key, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ contents: [{ parts: [{ text: `Return only strict JSON. The JSON shape: {"title":"string","summary":"string","tasks":[{"id":"task_1","title":"string"}],"fileActions":[{"taskId":"task_1","filePath":"relative/path.tsx","action":"create|update","content":"file content","summary":"string"}],"explanation":"string"} Prompt: Create a hello world TS file` }] }] })
}).then(r => r.json()).then(data => { const text = data.candidates?.[0]?.content?.parts?.[0]?.text; console.log(text) }).catch(console.error);
