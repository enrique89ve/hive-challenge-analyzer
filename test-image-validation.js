// Script de prueba para validar URLs de imágenes
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

function isValidImageUrl(url) {
  try {
    // Verificar que sea una URL válida
    const urlObj = new URL(url);

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

// URLs de prueba
const urlsDePrueba = [
  "https://images.ecency.com/DQmYhg123abc.jpg",
  "https://cdn.steemitimages.com/photo.png",
  "https://i.imgur.com/abc123.gif",
  "https://example.com/image.webp",
  "https://images.hive.blog/photo.jpeg",
  "https://static.peakd.com/image.svg",
  "invalid-url",
  "https://example.com/not-an-image.txt",
  "https://example.com/no-extension",
  "https://files.peakd.com/file/peakd-hive/image.bmp",
  "https://user-assets.githubusercontent.com/avatar.png",
  "",
  null,
  undefined,
];

console.log("=".repeat(60));
console.log("PRUEBA DE VALIDACIÓN DE IMÁGENES");
console.log("=".repeat(60));

console.log("\n🔍 Validando URLs individuales:");
console.log("-".repeat(40));

urlsDePrueba.forEach((url, index) => {
  if (url === null || url === undefined) {
    console.log(`${index + 1}. ${url} → ❌ Valor nulo/indefinido`);
    return;
  }

  const isValid = isValidImageUrl(url);
  const status = isValid ? "✅ VÁLIDA" : "❌ INVÁLIDA";
  console.log(`${index + 1}. ${url} → ${status}`);
});

console.log("\n📋 Resumen de filtrado:");
console.log("-".repeat(40));

const validImages = getValidImages(
  urlsDePrueba.filter((url) => url !== null && url !== undefined)
);
console.log(
  `\n📊 Resultado: ${validImages.length} imágenes válidas de ${urlsDePrueba.length} URLs totales`
);

console.log("\n🎯 Imágenes válidas encontradas:");
validImages.forEach((img, index) => {
  console.log(`  ${index + 1}. ${img}`);
});

console.log("\n" + "=".repeat(60));
console.log(
  "✨ ¡Ahora acepta cualquier dominio con extensiones de imagen válidas!"
);
console.log("=".repeat(60));
