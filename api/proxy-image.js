export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return new Response('URL tidak ditemukan', { 
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }

    // Get image buffer
    const imageBuffer = await response.arrayBuffer();

    // Return image dengan proper headers
    return new Response(imageBuffer, {
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Gagal memuat gambar', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}
