// Minimal Server-Sent Events reader for fetch() responses. EventSource can't
// be used because the tutor endpoints are POST requests.

function parseEvent(block) {
  let event = 'message';
  const dataLines = [];

  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) event = line.slice(6).trim();
    else if (line.startsWith('data:')) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return null;

  const raw = dataLines.join('\n');
  try {
    return { event, data: JSON.parse(raw) };
  } catch {
    return { event, data: raw };
  }
}

/** Yields `{ event, data }` objects as they arrive on the response stream. */
export async function* readServerSentEvents(response) {
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    // Normalize on the whole buffer: a "\r\n" may be split across chunks.
    buffer = (buffer + value).replace(/\r\n/g, '\n');
    let boundary;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const parsed = parseEvent(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      if (parsed) yield parsed;
    }
  }

  const trailing = parseEvent(buffer.trim());
  if (trailing) yield trailing;
}
