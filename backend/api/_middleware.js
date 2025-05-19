export default function middleware(request, event) {
  const response = event.respondWith();
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: response.headers
    });
  }
  
  return response;
}