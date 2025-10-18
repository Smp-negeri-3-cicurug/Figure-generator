// api/generate.js
export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Parse form data
    const formData = await req.formData();
    const imageFile = formData.get('image');

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Convert to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Step 1: Upload to tmpfiles.org
    const uploadFormData = new FormData();
    const blob = new Blob([buffer], { type: imageFile.type });
    uploadFormData.append('file', blob, imageFile.name || 'image.jpg');

    const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload image to tmpfiles.org');
    }

    const uploadData = await uploadResponse.json();
    
    // Extract and fix URL
    let fileUrl = null;
    if (uploadData?.data?.url) {
      fileUrl = uploadData.data.url.replace('/tmpfiles.org/', '/tmpfiles.org/dl/');
    } else {
      const uploadText = JSON.stringify(uploadData);
      const match = uploadText.match(/https?:\/\/tmpfiles\.org\/(\d+\/[A-Za-z0-9._-]+)/);
      if (match) {
        fileUrl = `https://tmpfiles.org/dl/${match[1]}`;
      }
    }

    if (!fileUrl) {
      throw new Error('Failed to get file URL from tmpfiles.org');
    }

    console.log('Uploaded to:', fileUrl);

    // Step 2: Call Figure API
    const apiUrl = `https://api.nekolabs.my.id/tools/convert/tofigure?imageUrl=${encodeURIComponent(fileUrl)}`;
    
    const figureResponse = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!figureResponse.ok) {
      throw new Error('Failed to generate figure from API');
    }

    const figureData = await figureResponse.json();

    if (!figureData?.result) {
      throw new Error('API did not return a result');
    }

    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        result: figureData.result,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('API Error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
      }
