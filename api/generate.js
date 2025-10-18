export const config = {
  runtime: 'edge', // wajib agar jalan di Edge Function
};

export default async function handler(req) {
  // ✅ CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // ✅ Handle preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // ✅ Hanya izinkan POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // ✅ Ambil form data
    const formData = await req.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Convert File ke Blob langsung (Edge runtime tidak support Buffer)
    const uploadFormData = new FormData();
    uploadFormData.append('file', imageFile, imageFile.name || 'image.jpg');

    // ✅ Upload ke tmpfiles.org
    const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) throw new Error('Failed to upload to tmpfiles.org');

    const uploadData = await uploadResponse.json();

    // ✅ Ambil URL download tmpfiles
    let fileUrl = null;
    if (uploadData?.data?.url) {
      fileUrl = uploadData.data.url.replace('/tmpfiles.org/', '/tmpfiles.org/dl/');
    } else {
      const match = JSON.stringify(uploadData).match(/https?:\/\/tmpfiles\.org\/(\d+\/[A-Za-z0-9._-]+)/);
      if (match) fileUrl = `https://tmpfiles.org/dl/${match[1]}`;
    }

    if (!fileUrl) throw new Error('Could not extract file URL');

    console.log('✅ Uploaded to:', fileUrl);

    // ✅ Panggil API Figure
    const apiUrl = `https://api.nekolabs.my.id/tools/convert/tofigure?imageUrl=${encodeURIComponent(fileUrl)}`;
    const figureResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Edge Runtime Function)',
      },
    });

    if (!figureResponse.ok) throw new Error('Failed to fetch from Nekolabs API');

    const figureData = await figureResponse.json();
    if (!figureData?.result) throw new Error('No result returned by API');

    // ✅ Return hasil
    return new Response(
      JSON.stringify({ success: true, result: figureData.result }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ API Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
          }
