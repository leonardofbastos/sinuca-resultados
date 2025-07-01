// Novo index.js com campo único de busca e seleção de partida
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const nomes = [
  "Leonardo", "Douglas", "Sandro", "Vagner", "João",
  "Luis", "Pedro", "Iuri", "Gustavo", "Erick"
];

export default function Home() {
  const [form, setForm] = useState({
    id_partida: "",
    juiz: "",
    vencedor: "",
    placar_mandante: 0,
    placar_visitante: 0,
    felinos_mandante: 0,
    felinos_visitante: 0,
    penalidades_mandante: 0,
    penalidades_visitante: 0,
    sinucas_mandante: 0,
    sinucas_visitante: 0
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [partidas, setPartidas] = useState([]);
  const [filtroPartida, setFiltroPartida] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);

  useEffect(() => {
    buscarResultados();
    buscarPartidas();
  }, []);

  const buscarResultados = async () => {
    const { data } = await supabase
      .from("tab_resultado_partida")
      .select("*")
      .order("data_criacao", { ascending: false })
      .limit(10);
    if (data) setResultados(data);
  };

  const buscarPartidas = async () => {
    const { data } = await supabase
      .from("tab_partida")
      .select(`id_partida, rodada, status_partida, clubes_mandante:tab_clube!tab_partida_id_clube_mandante_fkey(descricao), clubes_visitante:tab_clube!tab_partida_id_clube_visitante_fkey(descricao)`);
    if (data) setPartidas(data);
  };

  const partidaSelecionada = partidas.find(
    (p) => p.id_partida.toString() === form.id_partida.toString()
  );

  const nomeMandante = partidaSelecionada?.clubes_mandante?.descricao || "";
  const nomeVisitante = partidaSelecionada?.clubes_visitante?.descricao || "";

  const juizesValidos = nomes.filter(
    (nome) => nome !== nomeMandante && nome !== nomeVisitante
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.from("tab_resultado_partida").insert({ ...form });

    if (!error) {
      await supabase
        .from("tab_partida")
        .update({ status_partida: "LANÇADO" })
        .eq("id_partida", form.id_partida);
      setMessage("Resultado salvo com sucesso!");
      setForm({
        id_partida: "",
        juiz: "",
        vencedor: "",
        placar_mandante: 0,
        placar_visitante: 0,
        felinos_mandante: 0,
        felinos_visitante: 0,
        penalidades_mandante: 0,
        penalidades_visitante: 0,
        sinucas_mandante: 0,
        sinucas_visitante: 0
      });
      buscarResultados();
      buscarPartidas();
    } else {
      setMessage("Erro ao salvar resultado.");
    }

    setLoading(false);
  };

  const partidasFiltradas = partidas.filter((p) => {
    const texto = `${p.id_partida} Rodada ${p.rodada} - ${p.clubes_mandante?.descricao} x ${p.clubes_visitante?.descricao}`.toLowerCase();
    return texto.includes(filtroPartida.toLowerCase());
  });

  return (
    <div className="font-sans">
      <header className="bg-gray-800 text-white py-3 text-center text-xl font-bold">
        F.O.S.S.A. - Federação Organizada de Sinuca e Sports Alternativos
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block mb-1 font-medium">Partida</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                placeholder="Buscar partida..."
                value={filtroPartida}
                onChange={(e) => {
                  setFiltroPartida(e.target.value);
                  setMenuAberto(true);
                }}
                onFocus={() => setMenuAberto(true)}
              />
              {menuAberto && (
                <ul className="absolute z-10 w-full bg-white border max-h-60 overflow-y-auto rounded shadow">
                  {partidasFiltradas.map((p) => (
                    <li
                      key={p.id_partida}
                      className="px-3 py-2 hover:bg-gray-200 cursor-pointer"
                      onClick={() => {
                        setForm({ ...form, id_partida: p.id_partida });
                        setFiltroPartida(`${p.id_partida} Rodada ${p.rodada} - ${p.clubes_mandante?.descricao} x ${p.clubes_visitante?.descricao}`);
                        setMenuAberto(false);
                      }}
                    >
                      {p.id_partida} Rodada {p.rodada} - {p.clubes_mandante?.descricao} x {p.clubes_visitante?.descricao} ({p.status_partida})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block mb-1 font-medium">Juiz</label>
              <select
                name="juiz"
                value={form.juiz}
                onChange={(e) => setForm({ ...form, juiz: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Selecione o Juiz</option>
                {juizesValidos.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">{nomeMandante && `${nomeMandante} (Mandante)`}</label>
              <input
                type="number"
                value={form.placar_mandante}
                onChange={(e) => setForm({ ...form, placar_mandante: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
            <div>
              <label className="block mb-1">{nomeVisitante && `${nomeVisitante} (Visitante)`}</label>
              <input
                type="number"
                value={form.placar_visitante}
                onChange={(e) => setForm({ ...form, placar_visitante: parseInt(e.target.value) })}
                className="w-full p-2 border rounded"
              />
            </div>
          </div>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Vencedor</label>
              <select
                name="vencedor"
                value={form.vencedor}
                onChange={(e) => setForm({ ...form, vencedor: e.target.value })}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Selecione o Vencedor</option>
                {[nomeMandante, nomeVisitante].filter(Boolean).map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Salvando..." : "Salvar Resultado"}
            </button>
          </div>

          {message && <p className="mt-2 text-green-700 font-semibold">{message}</p>}
        </form>
      </div>
    </div>
  );
}