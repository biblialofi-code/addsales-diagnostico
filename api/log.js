// api/log.js — grava (de forma anônima) cada pergunta feita no chat.
// Sem nome, sem e-mail, sem o número da base. Só: ramo, pergunta,
// resposta da IA, se travou, e a etapa da conversa.
// Roda na Vercel. As chaves ficam em variáveis de ambiente, nunca no código.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método não permitido" });
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;

  // Se o Supabase não estiver configurado, não quebra o chat:
  // apenas ignora o log e responde ok.
  if (!url || !key) {
    return res.status(200).json({ logged: false, reason: "sem config" });
  }

  try {
    const { ramo, pergunta, resposta, travou, etapa } = req.body || {};

    // sanidade mínima: nada de gravar campos gigantes
    const row = {
      ramo: (ramo || "").toString().slice(0, 60),
      pergunta: (pergunta || "").toString().slice(0, 500),
      resposta: (resposta || "").toString().slice(0, 1000),
      travou: !!travou,
      etapa: (etapa || "").toString().slice(0, 20),
    };

    const r = await fetch(`${url}/rest/v1/perguntas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!r.ok) {
      const detail = await r.text();
      return res.status(200).json({ logged: false, detail });
    }
    return res.status(200).json({ logged: true });
  } catch (e) {
    // nunca deixa o log derrubar o fluxo do usuário
    return res.status(200).json({ logged: false, detail: String(e) });
  }
}
