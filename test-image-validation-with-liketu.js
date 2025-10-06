// Script de prueba para validar URLs de imágenes con dominios de confianza
const VALID_IMAGE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".bmp",
  ".svg",
  ".avif",
  ".tiff",
  ".tif",
  ".ico",
]);

// Dominios de confianza para imágenes (no requieren extensión específica)
const TRUSTED_IMAGE_DOMAINS = new Set([
  "cdn.liketu.com",
  "images.ecency.com",
  "images.hive.blog",
  "cdn.steemitimages.com",
  "files.peakd.com",
  "static.peakd.com",
]);

function isValidImageUrl(url) {
  try {
    // Verificar que sea una URL válida
    const urlObj = new URL(url);

    // Verificar si es un dominio de confianza (Liketu, Ecency, etc.)
    if (TRUSTED_IMAGE_DOMAINS.has(urlObj.hostname.toLowerCase())) {
      return true;
    }

    // Extraer la extensión del pathname
    const pathname = urlObj.pathname.toLowerCase();
    const lastDotIndex = pathname.lastIndexOf(".");

    if (lastDotIndex === -1) {
      return false; // No hay extensión
    }

    const extension = pathname.substring(lastDotIndex);

    // Verificar si la extensión está en la lista de extensiones válidas
    return VALID_IMAGE_EXTENSIONS.has(extension);
  } catch (error) {
    // Si no es una URL válida, retornar falso
    console.warn(`⚠️ URL inválida: ${url}`, error.message);
    return false;
  }
}

function getValidImages(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  const validImages = images.filter((img) => {
    if (typeof img !== "string" || img.trim() === "") {
      return false;
    }

    const isValid = isValidImageUrl(img.trim());
    if (!isValid) {
      console.log(`🚫 Imagen inválida descartada: ${img}`);
    } else {
      console.log(`✅ Imagen válida: ${img}`);
    }

    return isValid;
  });

  return validImages;
}

// URLs de prueba incluyendo Liketu
const urlsDePrueba = [
  // Dominios de confianza (deberían ser válidas sin extensión)
  "https://cdn.liketu.com/v2/posts/abc123def456",
  "https://cdn.liketu.com/media/user123/photo",
  "https://images.ecency.com/DQmYhg123abc",
  "https://images.hive.blog/photo",
  "https://cdn.steemitimages.com/photo",
  "https://files.peakd.com/file/peakd-hive/image",
  "https://static.peakd.com/image",

  // URLs tradicionales con extensión
  "https://images.ecency.com/DQmYhg123abc.jpg",
  "https://cdn.steemitimages.com/photo.png",
  "https://i.imgur.com/abc123.gif",
  "https://example.com/image.webp",
  "https://images.hive.blog/photo.jpeg",
  "https://static.peakd.com/image.svg",
  "https://files.peakd.com/file/peakd-hive/image.bmp",
  "https://user-assets.githubusercontent.com/avatar.png",

  // URLs inválidas
  "invalid-url",
  "https://example.com/not-an-image.txt",
  "https://example.com/no-extension",
  "",
  null,
  undefined,
];

console.log("=".repeat(80));
console.log("PRUEBA DE VALIDACIÓN DE IMÁGENES CON DOMINIOS DE CONFIANZA");
console.log("=".repeat(80));

console.log("\n🔍 Validando URLs individuales:");
console.log("-".repeat(60));

urlsDePrueba.forEach((url, index) => {
  if (url === null || url === undefined) {
    console.log(
      `${String(index + 1).padStart(2, "0")}. ${url} → ❌ Valor nulo/indefinido`
    );
    return;
  }

  const isValid = isValidImageUrl(url);
  const status = isValid ? "✅ VÁLIDA" : "❌ INVÁLIDA";

  // Detectar si es dominio de confianza
  let reason = "";
  try {
    const urlObj = new URL(url);
    if (TRUSTED_IMAGE_DOMAINS.has(urlObj.hostname.toLowerCase())) {
      reason = " (dominio confianza)";
    }
  } catch {}

  console.log(
    `${String(index + 1).padStart(2, "0")}. ${url} → ${status}${reason}`
  );
});

console.log("\n📋 Resumen de filtrado:");
console.log("-".repeat(60));

const validImages = getValidImages(
  urlsDePrueba.filter((url) => url !== null && url !== undefined)
);
console.log(
  `\n📊 Resultado: ${validImages.length} imágenes válidas de ${urlsDePrueba.length} URLs totales`
);

if (validImages.length > 0) {
  console.log(`\n🎯 Imágenes válidas encontradas:`);
  validImages.forEach((img, index) => {
    console.log(`  ${index + 1}. ${img}`);
  });
}

console.log("\n" + "=".repeat(80));
console.log("✨ ¡Ahora incluye cdn.liketu.com y otros dominios de Hive!");
console.log("=".repeat(80));
