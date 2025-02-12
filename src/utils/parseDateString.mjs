export function parseDateString(dateString) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
    console.error("Formato de data inválido. Use DD/MM/AAAA.");
    return { error: "Formato de data inválido. Use DD/MM/AAAA." };
  }

  try {
    const [day, month, year] = dateString.split("/");

    if (month > 12 || day > 31) {
      return { error: "Formato de data inválido. Use DD/MM/AAAA." };
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    if (isNaN(date)) {
      return { error: "Data inválida." };
    }

    return { date };
  } catch (error) {
    return { error: "Erro ao parsear a data: " + error.message };
  }
}
