/**
 * Minimal cURL parser for bash commands and C libcurl snippets.
 * Extracts URL, Method, Headers, and Body.
 */
export function parseCurl(input: string) {
  const result: {
    url?: string;
    method?: string;
    headers: Record<string, string>;
    body?: any;
  } = {
    headers: {},
    method: 'GET'
  };

  if (!input) return result;

  // 1. Try parsing C libcurl snippet (if it contains curl_easy_setopt)
  if (input.includes('curl_easy_setopt')) {
    const urlMatch = input.match(/CURLOPT_URL\s*,\s*"([^"]+)"/);
    if (urlMatch) result.url = urlMatch[1];

    const methodMatch = input.match(/CURLOPT_CUSTOMREQUEST\s*,\s*"([^"]+)"/);
    if (methodMatch) result.method = methodMatch[1];

    // For C snippets, we check if there are any header-like strings being added to slists
    // This is a heuristic as C headers are usually in a separate block
    const headerLines = input.match(/"([^"]+:[^"]+)"/g);
    if (headerLines) {
      headerLines.forEach(line => {
        const str = line.replace(/"/g, '');
        if (str.startsWith('http') || str.startsWith('https')) return; // Skip URLs
        const sepIdx = str.indexOf(':');
        if (sepIdx > -1) {
          const key = str.slice(0, sepIdx).trim();
          const value = str.slice(sepIdx + 1).trim();
          result.headers[key] = value;
        }
      });
    }

    return result;
  }

  // 2. Treat as bash cURL
  // Clean up backslashes for multi-line commands
  const cleanInput = input.replace(/\\\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Extract URL (usually the first thing that looks like a URL or follows curl)
  const urlMatch = cleanInput.match(/curl\s+(?:'|")?(https?:\/\/[^\s'"]+)(?:'|")?/i) || 
                   cleanInput.match(/(https?:\/\/[^\s'"]+)/i);
  if (urlMatch) result.url = urlMatch[1];

  // Extract Method
  const methodMatch = cleanInput.match(/(?:-X|--request)\s+['"]?([A-Z]+)['"]?/);
  if (methodMatch) result.method = methodMatch[1];

  // Extract Headers
  const headerRegex = /(?:-H|--header)\s+['"]([^'"]+)['"]/g;
  let match;
  while ((match = headerRegex.exec(cleanInput)) !== null) {
    const headerStr = match[1];
    const sepIdx = headerStr.indexOf(':');
    if (sepIdx > -1) {
      const key = headerStr.slice(0, sepIdx).trim();
      const value = headerStr.slice(sepIdx + 1).trim();
      result.headers[key] = value;
    }
  }

  // Extract Body
  const dataMatch = cleanInput.match(/(?:-d|--data|--data-raw|--data-binary)\s+['"]({[^'"]+})['"]/) ||
                    cleanInput.match(/(?:-d|--data|--data-raw|--data-binary)\s+({[^}]+})/);
  if (dataMatch) {
    try {
      result.body = JSON.parse(dataMatch[1]);
    } catch (e) {
      result.body = dataMatch[1]; // fallback to raw string
    }
    if (result.method === 'GET' || !result.method) {
        result.method = 'POST'; // Usually data presence implies POST if not specified
    }
  }

  return result;
}
