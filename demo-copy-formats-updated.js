// Script de prueba para demostrar la funcionalidad de lista simple
const ejemploUsuarios = [
  {
    name: "alice",
    images: [1, 2, 3],
    powerUpDate: "2025-09-01",
    powerUpAmount: "50000", // 50 HP real
    powerUpTxId: "abc123def456789",
  },
  { name: "bob", images: [1, 2], powerUpDate: null, powerUpAmount: undefined },
  {
    name: "charlie",
    images: [1, 2, 3, 4],
    powerUpDate: "2025-09-02",
    powerUpAmount: "100500", // 100.5 HP real
    powerUpTxId: "xyz789uvw012345",
  },
  {
    name: "diana",
    images: [1],
    powerUpDate: "2025-09-01",
    powerUpAmount: "25750", // 25.75 HP real
    powerUpTxId: "mno456pqr678901",
  },
];

// Función para formatear Hive Power
function formatHivePower(amount) {
  if (!amount || amount === "N/A") return "N/A";

  try {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "N/A";

    // Dividir entre 1000 para obtener el valor real de HP (viene en la unidad más pequeña)
    const hivePowerAmount = numericAmount / 1000;

    return `${hivePowerAmount.toFixed(3)} HP`;
  } catch (error) {
    console.error("Error formateando Hive Power:", error);
    return "N/A";
  }
}

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
        }${user.powerUpDate ? `, Power Up: ${user.powerUpDate}` : ""}${
          user.powerUpAmount ? `, ${formatHivePower(user.powerUpAmount)}` : ""
        }${
          user.powerUpTxId
            ? ` - [Ver TX](https://hivehub.dev/tx/${user.powerUpTxId})`
            : ""
        })`
    )
    .join("\n");
}

// Función de formato CSV
function generarCSV(usuarios) {
  const csvHeader = "Usuario,Imágenes,Power Up,Hive Power,Transacción";
  const csvData = usuarios
    .map(
      (user) =>
        `@${user.name},${user.images.length},${
          user.powerUpDate || "N/A"
        },${formatHivePower(user.powerUpAmount)},${
          user.powerUpTxId
            ? `https://hivehub.dev/tx/${user.powerUpTxId}`
            : "N/A"
        }`
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
      powerUpAmount: user.powerUpAmount || null,
      powerUpAmountFormatted: formatHivePower(user.powerUpAmount),
      powerUpTxId: user.powerUpTxId || null,
      transactionUrl: user.powerUpTxId
        ? `https://hivehub.dev/tx/${user.powerUpTxId}`
        : null,
    })),
    null,
    2
  );
}

console.log("=".repeat(50));
console.log("EJEMPLOS DE FORMATOS DE COPIA - CON HIVE POWER");
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
console.log("¡Ahora con información del Hive Power y enlaces de transacción!");
console.log("=".repeat(50));
