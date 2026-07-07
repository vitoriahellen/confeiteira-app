/** Converte a hora UTC atual para horário de Brasília (UTC-3, sem horário de verão). */
export function horaAtualBrasil() {
  const agora = new Date();
  return (agora.getUTCHours() - 3 + 24) % 24;
}

/** Verifica se a hora atual (Brasília) bate com o horário configurado ("HH:mm"). */
export function dentroDoHorarioConfigurado(horaConfigurada) {
  if (!horaConfigurada) return true;
  const horaAlvo = Number(String(horaConfigurada).split(":")[0]);
  if (Number.isNaN(horaAlvo)) return true;
  return horaAtualBrasil() === horaAlvo;
}
