// Feriados nacionais e datas comemorativas relevantes para uma confeitaria,
// calculados sob demanda (sem tabela no banco) — funciona para qualquer ano.

function chave(data) {
  const y = data.getFullYear();
  const m = String(data.getMonth() + 1).padStart(2, "0");
  const d = String(data.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function somarDias(data, n) {
  const d = new Date(data);
  d.setDate(d.getDate() + n);
  return d;
}

/** Domingo da Páscoa (algoritmo de Meeus/Jones/Butcher, calendário gregoriano). */
function calcularPascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(ano, mes - 1, dia);
}

function segundoDomingo(ano, mesIndex0) {
  const primeiro = new Date(ano, mesIndex0, 1);
  const diaSemana = primeiro.getDay();
  const primeiroDomingo = diaSemana === 0 ? 1 : 1 + (7 - diaSemana);
  return new Date(ano, mesIndex0, primeiroDomingo + 7);
}

/** Feriados e datas comemorativas de um ano específico: mapa "yyyy-MM-dd" -> {nome, tipo}. */
export function obterDatasComemorativas(ano) {
  const pascoa = calcularPascoa(ano);
  const mapa = {};
  const add = (data, nome, tipo) => {
    mapa[chave(data)] = { nome, tipo };
  };

  // Feriados nacionais
  add(new Date(ano, 0, 1), "Confraternização Universal", "feriado");
  add(somarDias(pascoa, -47), "Carnaval", "feriado");
  add(somarDias(pascoa, -2), "Sexta-feira Santa", "feriado");
  add(pascoa, "Páscoa", "feriado");
  add(new Date(ano, 3, 21), "Tiradentes", "feriado");
  add(new Date(ano, 4, 1), "Dia do Trabalho", "feriado");
  add(somarDias(pascoa, 60), "Corpus Christi", "feriado");
  add(new Date(ano, 8, 7), "Independência do Brasil", "feriado");
  add(new Date(ano, 9, 12), "Nossa Sra. Aparecida / Dia das Crianças", "feriado");
  add(new Date(ano, 10, 2), "Finados", "feriado");
  add(new Date(ano, 10, 15), "Proclamação da República", "feriado");
  add(new Date(ano, 11, 25), "Natal", "feriado");

  // Datas comemorativas de alta demanda para confeitarias
  add(segundoDomingo(ano, 4), "Dia das Mães", "comemorativa");
  add(new Date(ano, 5, 12), "Dia dos Namorados", "comemorativa");
  add(segundoDomingo(ano, 7), "Dia dos Pais", "comemorativa");
  add(new Date(ano, 9, 31), "Halloween", "comemorativa");

  return mapa;
}

/** Junta as datas comemorativas de vários anos (útil quando a visão cruza a virada do ano). */
export function obterDatasComemorativasParaAnos(anos) {
  const mapa = {};
  for (const ano of anos) Object.assign(mapa, obterDatasComemorativas(ano));
  return mapa;
}
