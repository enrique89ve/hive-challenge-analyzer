// Script de prueba para demostrar la funcionalidad de lista simple
const ejemploUsuarios = [
  { name: "alice", images: [1, 2, 3], powerUpDate: "2025-09-01", powerUpAmount: "50.000" },
  { name: "bob", images: [1, 2], powerUpDate: null, powerUpAmount: undefined },
  { name: "charlie", images: [1, 2, 3, 4], powerUpDate: "2025-09-02", powerUpAmount: "100.500" },
  { name: "diana", images: [1], powerUpDate: "2025-09-01", powerUpAmount: "25.750" }
];pt de prueba para demostrar la funcionalidad de lista simple
const ejemploUsuarios = [
  { name: "alice", images: [1, 2, 3], powerUpDate: "2025-09-01" },
  { name: "bob", images: [1, 2], powerUpDate: null },
  { name: "charlie", images: [1, 2, 3, 4], powerUpDate: "2025-09-02" },
  { name: "diana", images: [1], powerUpDate: "2025-09-01" },
];

// Función de lista simple (igual que en la aplicación)
function generarListaSimple(usuarios) {
  return usuarios.map((user) => `@${user.name}`).join("\n");
}

// Función de formato Markdown
function generarMarkdown(usuarios) {
  return usuarios
    .map(
      (user, index) =>
        `${index + 1}. @${user.name} (${user.images.length} imagen${
          user.images.length !== 1 ? "es" : ""
        }${user.powerUpDate ? `, Power Up: ${user.powerUpDate}` : ""})`
    )
    .join("\n");
}

// Función de formato CSV
function generarCSV(usuarios) {
  const csvHeader = "Usuario,Imágenes,Power Up";
  const csvData = usuarios
    .map(
      (user) =>
        `@${user.name},${user.images.length},${user.powerUpDate || "N/A"}`
    )
    .join("\n");
  return `${csvHeader}\n${csvData}`;
}

// Función de formato JSON
function generarJSON(usuarios) {
  return JSON.stringify(
    usuarios.map((user) => ({
      username: user.name,
      images: user.images.length,
      powerUpDate: user.powerUpDate || null,
    })),
    null,
    2
  );
}

console.log("=".repeat(50));
console.log("EJEMPLOS DE FORMATOS DE COPIA");
console.log("=".repeat(50));

console.log("\n📋 LISTA SIMPLE:");
console.log("-".repeat(20));
console.log(generarListaSimple(ejemploUsuarios));

console.log("\n📝 FORMATO MARKDOWN:");
console.log("-".repeat(20));
console.log(generarMarkdown(ejemploUsuarios));

console.log("\n📊 FORMATO CSV:");
console.log("-".repeat(20));
console.log(generarCSV(ejemploUsuarios));

console.log("\n💾 FORMATO JSON:");
console.log("-".repeat(20));
console.log(generarJSON(ejemploUsuarios));

console.log("\n" + "=".repeat(50));
console.log("¡Estos son los formatos disponibles en la aplicación!");
console.log("=".repeat(50));
