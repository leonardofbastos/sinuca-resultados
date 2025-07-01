import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Juízes (nomes que não podem ser clubes)
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

  useEffect(() => {
    buscarResultados();
    buscarPartidas();
  }, []);

  const buscarResultados = async () => {
    const { data, error } = await supabase
      .from("tab_resultado_partida")
      .select("*")
      .order("data_criacao", { ascending: false })
      .limit(10);

    if (!error) setResultados(data);
  };

  const buscarPartidas = async () => {
    const { data, error } = await supabase
      .from("tab_partida")
      .select(`id_partida, rodada, status_partida, clubes_mandante:tab_clube!tab_partida_id_clube_mandante_fkey(descricao), clubes_visitante:tab_clube!tab_partida_id_clube_visitante_fkey(descricao)`);

    if (!error) setPartidas(data);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "id_partida") {
      setForm((prev) => ({
        ...prev,
        [name]: value,
        vencedor: "",
        juiz: ""
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const alterarValor = (campo, incremento) => {
    setForm((prev) => ({
      ...prev,
      [campo]: Math.max(0, prev[campo] + incremento)
    }));
  };

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

      setPartidas((oldPartidas) =>
        oldPartidas.map((p) =>
          p.id_partida.toString() === form.id_partida.toString()
            ? { ...p, status_partida: "LANÇADO" }
            : p
        )
      );

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
    } else {
      setMessage("Erro ao salvar resultado.");
    }

    setLoading(false);
  };

  const partidasFiltradas = partidas.filter((p) => {
    const textoBusca = filtroPartida.toLowerCase();
    const label = `${p.id_partida} Rodada ${p.rodada} - ${p.clubes_mandante?.descricao} x ${p.clubes_visitante?.descricao}`.toLowerCase();
    return label.includes(textoBusca);
  });

  const partidaSelecionada = partidas.find((p) => p.id_partida.toString() === form.id_partida);

  const nomeMandante = partidaSelecionada?.clubes_mandante?.descricao || "";
  const nomeVisitante = partidaSelecionada?.clubes_visitante?.descricao || "";

  const juizesValidos = nomes.filter(
    (nome) => nome !== nomeMandante && nome !== nomeVisitante
  );

  return (
    <div style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <header className="bg-gray-800 text-white py-3 text-center text-xl font-bold">
        F.O.S.S.A. - Federação Organizada de Sinuca e Sports Alternativos
      </header>

      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Lançar Resultado</h1>
          <button
            onClick={() => alert('Redirecionar para tela de partidas')}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            Ver Partidas Lançadas
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-4 mb-4">
            <div className="w-1/2">
              <label className="block mb-1 font-medium">Partida</label>
              <input
                type="text"
                placeholder="Buscar partida pelo ID, rodada ou clube..."
                value={filtroPartida}
                onChange={(e) => setFiltroPartida(e.target.value)}
                className="w-full p-2 border rounded"
                list="partidas-list"
              />
              <datalist id="partidas-list">
                {partidasFiltradas.map((p) => (
                  <option
                    key={p.id_partida}
                    value={p.id_partida}
                  >
                    {p.id_partida} Rodada {p.rodada} - {p.clubes_mandante?.descricao} x {p.clubes_visitante?.descricao} ({p.status_partida})
                  </option>
                ))}
              </datalist>
            </div>

            <div className="w-1/2">
              <label className="block mb-1 font-medium">Juiz</label>
              <select
                name="juiz"
                value={form.juiz}
                onChange={handleChange}
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

          {/* Placar em card azul */}
          <div className="border rounded-lg p-4 mb-4 bg-blue-50">
            <h3 className="text-2xl font-bold mb-4 text-center text-blue-700">Placar</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              {[{
                campo: "placar_mandante",
                label: `${nomeMandante} (Mandante)`,
              },{
                campo: "placar_visitante",
                label: `${nomeVisitante} (Visitante)`
              }].map(({ campo, label }) => (
                <div key={campo} className="flex flex-col items-center">
                  <label className="mb-1 font-medium">{label}</label>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      type="button"
                      className="px-3 py-2 text-lg bg-red-500 text-white rounded"
                      onClick={() => alterarValor(campo, -1)}
                    >-</button>
                    <span className="w-10 text-center text-lg">{form[campo]}</span>
                    <button
                      type="button"
                      className="px-3 py-2 text-lg bg-green-600 text-white rounded"
                      onClick={() => alterarValor(campo, 1)}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Penalidades */}
          <div className="border rounded-lg p-4 mb-4 bg-blue-50">
            <h3 className="text-xl font-semibold mb-4 text-center text-blue-700">Penalidades</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              {[{
                campo: "penalidades_mandante",
                label: `${nomeMandante} (Mandante)`,
              },{
                campo: "penalidades_visitante",
                label: `${nomeVisitante} (Visitante)`
              }].map(({ campo, label }) => (
                <div key={campo} className="flex flex-col items-center">
                  <label className="mb-1 font-medium">{label}</label>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      type="button"
                      className="px-3 py-2 text-lg bg-red-500 text-white rounded"
                      onClick={() => alterarValor(campo, -1)}
                    >-</button>
                    <span className="w-10 text-center text-lg">{form[campo]}</span>
                    <button
                      type="button"
                      className="px-3 py-2 text-lg bg-green-600 text-white rounded"
                      onClick={() => alterarValor(campo, 1)}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Felinos */}
          <div className="border rounded-lg p-4 mb-4 bg-blue-50">
            <h3 className="text-xl font-semibold mb-4 text-center text-blue-700">Felinos</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              {[{
                campo: "felinos_mandante",
                label: `${nomeMandante} (Mandante)`,
              },{
                campo: "felinos_visitante",
                label: `${nomeVisitante} (Visitante)`
              }].map(({ campo, label }) => (
                <div key={campo} className="flex flex-col items-center">
                  <label className="mb-1 font-medium">{label}</label>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      type="button"
                      className="px-3 py-2 text-lg bg-red-500 text-white rounded"
                      onClick={() => alterarValor(campo, -1)}
                    >-</button>
                    <span className="w-10 text-center text-lg">{form[campo]}</span>
                    <button
                      type="button"
                      className="px-3 py-2 text-lg bg-green-600 text-white rounded"
                      onClick={() => alterarValor(campo, 1)}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sinucas */}
          <div className="border rounded-lg p-4 mb-4 bg-blue-50">
            <h3 className="text-xl font-semibold mb-4 text-center text-blue-700">Sinucas</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              {[{
                campo: "sinucas_mandante",
                label: `${nomeMandante} (Mandante)`,
              },{
                campo: "sinucas_visitante",
                label: `${nomeVisitante} (Visitante)`
              }].map(({ campo, label }) => (
                <div key={campo} className="flex flex-col items-center">
                  <label className="mb-1 font-medium">{label}</label>
                  <div className="flex items-center gap-3 justify-center">
                    <button
                      type="button"
                      className="px-3 py-2 text-lg bg-red-500 text-white rounded"
                      onClick={() => alterarValor(campo, -1)}
                    >-</button>
                    <span className="w-10 text-center text-lg">{form[campo]}</span>
                    <button
                      type="button"
                      className="px-3 py-2 text-lg bg-green-600 text-white rounded"
                      onClick={() => alterarValor(campo, 1)}
                    >+</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vencedor e botão Salvar lado a lado */}
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block mb-1 font-medium">Vencedor</label>
              <select
                name="vencedor"
                value={form.vencedor}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Selecione o Vencedor</option>
                {[nomeMandante, nomeVisitante].map((nome) => (
                  <option key={nome} value={nome}>
                    {nome}
                  </option>
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
