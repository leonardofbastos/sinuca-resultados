export default async function handler(req, res) {
  const SUPABASE_API_URL = 'https://jnptjemzncjmyoquncrv.supabase.co/rest/v1/tab_resultado_partida';
  const SUPABASE_API_KEY = process.env.SUPABASE_API_KEY; // ← Usando variável de ambiente

  try {
    const response = await fetch(`${SUPABASE_API_URL}?select=*`, {
      headers: {
        apikey: SUPABASE_API_KEY,
        Authorization: `Bearer ${SUPABASE_API_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Erro ao acessar Supabase', details: await response.text() });
    }

    const data = await response.json();
    res.status(200).json({ data }); // ← Envolve a resposta no campo "data"
  } catch (error) {
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
}
