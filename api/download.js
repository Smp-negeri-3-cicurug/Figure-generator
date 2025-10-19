export const config = { 
  runtime: "edge" 
};

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return new Response("URL gambar tidak ditemukan.", { 
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      return new Response(`Gagal mengunduh file. Status: ${response.status}`, { 
        status: response.status,
        headers: {
          "Content-Type": "text/plain; charset=utf-8"
        }
      });
    }

    // Ambil nama file dari URL atau generate default
    const urlParts = imageUrl.split("/").pop().split("?")[0];
    const filename = urlParts || `figure_art_${Date.now()}.jpg`;

    // Pastikan ada ekstensi
    const finalFilename = filename.includes('.') 
      ? filename 
      : `${filename}.jpg`;

    return new Response(response.body, {
      headers: {
        "Content-Type": "image/jpeg",
        "Content-Disposition": `attachment; filename="${finalFilename}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0"
      },
    });

  } catch (err) {
    console.error("Download error:", err);
    return new Response("Terjadi kesalahan saat mengunduh gambar.", { 
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }
                        }
