// index.js
import { useEffect, useState, useRef } from "react";
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
    arbitro: "",
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
  const [partidas, setPartidas] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    buscarPartidas();
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buscarPartidas = async () => {
    const { data } = await supabase
      .from("tab_partida")
      .select(`
        id_partida, rodada, status_partida,
        clubes_mandante:tab_clube!tab_partida_id_clube_mandante_fkey(descricao),
        clubes_visitante:tab_clube!tab_partida_id_clube_visitante_fkey(descricao),
        resultado:tab_resultado_partida(id_partida, vencedor, placar_mandante, placar_visitante, felinos_mandante, felinos_visitante, penalidades_mandante, penalidades_visitante, sinucas_mandante, sinucas_visitante)
      `);
    setPartidas(data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_partida) return;

    const { error } = await supabase.from("tab_resultado_partida").insert({ ...form });
    if (!error) {
      await supabase
        .from("tab_partida")
        .update({ status_partida: "LANÇADO" })
        .eq("id_partida", form.id_partida);
      setMessage("Resultado salvo!");
      setForm({ ...form, id_partida: "", arbitro: "", vencedor: "" });
      setSearchTerm("");
      buscarPartidas();
    } else {
      setMessage("Erro ao salvar.");
    }
  };

  const partidasFiltradas = partidas.filter(p => {
    const texto = `${p.rodada} ${p.id_partida} ${p.clubes_mandante?.descricao} ${p.clubes_visitante?.descricao}`.toLowerCase();
    return texto.includes(searchTerm.toLowerCase());
  });

  const partidaSelecionada = partidas.find(p => p.id_partida === form.id_partida);
  // const nomesValidos = [partidaSelecionada?.clubes_mandante?.descricao, partidaSelecionada?.clubes_visitante?.descricao];
  const nomesValidos = [];
  if (partidaSelecionada) {
    if (partidaSelecionada.clubes_mandante?.descricao) nomesValidos.push(partidaSelecionada.clubes_mandante.descricao);
    if (partidaSelecionada.clubes_visitante?.descricao) nomesValidos.push(partidaSelecionada.clubes_visitante.descricao);
  }

  return (
    <div style={{ fontFamily: "Helvetica, sans-serif" }}>
      <header className="bg-gray-800 text-white py-3 text-center text-xl font-bold">
        F.O.S.S.A. - Federação Organizada de Sinuca e Sports Alternativos
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Lançar Resultado</h1>
          <button
            onClick={() => setMostrarTabela(!mostrarTabela)}
            className="bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            {mostrarTabela ? "Voltar" : "Ver Partidas"}
          </button>
        </div>

        {mostrarTabela ? (
          <div className="overflow-auto border rounded p-4">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-200">
                <tr>
                  <th>Rodada</th><th>ID</th><th>Status</th><th>Mandante</th><th>Visitante</th>
                  <th>Placar</th><th>Felinos</th><th>Penalidades</th><th>Sinucas</th>
                </tr>
              </thead>
              <tbody>
                {partidas.map(p => (
                  <tr key={p.id_partida} className="border-t">
                    <td>{p.rodada}</td>
                    <td>{p.id_partida}</td>
                    <td className={`font-bold ${p.status_partida === 'LANÇADO' ? 'text-green-600' : 'text-blue-600'}`}>
                      {p.status_partida}
                    </td>
                    <td>{p.clubes_mandante?.descricao}</td>
                    <td>{p.clubes_visitante?.descricao}</td>
                    <td>{p.resultado?.placar_mandante} x {p.resultado?.placar_visitante}</td>
                    <td>{p.resultado?.felinos_mandante} x {p.resultado?.felinos_visitante}</td>
                    <td>{p.resultado?.penalidades_mandante} x {p.resultado?.penalidades_visitante}</td>
                    <td>{p.resultado?.sinucas_mandante} x {p.resultado?.sinucas_visitante}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" ref={wrapperRef}>
            <div className="flex gap-4">
              <div className="w-1/2 relative">
                <label className="font-medium">Partida</label>
                <input
                  value={searchTerm}
                  onChange={e => { setSearchTerm(e.target.value); setDropdownOpen(true); }}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full p-2 border rounded"
                  placeholder="Rodada ou Clube..."
                />
                {dropdownOpen && (
                  <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-auto mt-1 rounded shadow">
                    {partidasFiltradas.map(p => (
                      <li key={p.id_partida} className="p-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          setForm(f => ({ ...f, id_partida: p.id_partida }));
                          setSearchTerm(`Rodada ${p.rodada} - ${p.id_partida} - ${p.clubes_mandante?.descricao} x ${p.clubes_visitante?.descricao}`);
                          setDropdownOpen(false);
                        }}>
                        Rodada {p.rodada} - {p.id_partida} - {p.clubes_mandante?.descricao} x {p.clubes_visitante?.descricao} ({p.status_partida})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="w-1/2">
                <label className="font-medium">Árbitro</label>
                <select
                  name="arbitro"
                  value={form.arbitro}
                  onChange={e => setForm(f => ({ ...f, arbitro: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Selecione</option>
                  {nomes
                    .filter(n => !nomesValidos.includes(n))
                    .map(nome => (
                      <option key={nome} value={nome}>{nome}</option>
                    ))}
                </select>
              </div>
            </div>

            {/* Contadores */}
            {["Placar", "Felinos", "Penalidades", "Sinucas"].map((titulo, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-blue-50 mb-4">
                <h3 className="text-xl font-bold text-blue-800 text-center mb-4">{titulo}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[0, 1].map(i => {
                    const campo = `${titulo.toLowerCase()}_${i === 0 ? "mandante" : "visitante"}`;
                    const nome = i === 0
                      ? `${partidaSelecionada?.clubes_mandante?.descricao || "Mandante"}`
                      : `${partidaSelecionada?.clubes_visitante?.descricao || "Visitante"}`;
                    return (
                      <div key={campo} className="flex flex-col items-center">
                        <label className="text-blue-700 font-semibold mb-1">{nome}</label>
                        <div className="flex items-center gap-2">
                          <button className="px-3 py-1 text-white bg-red-500 rounded" type="button" onClick={() => alterarValor(campo, -1)}>-</button>
                          <span>{form[campo]}</span>
                          <button className="px-3 py-1 text-white bg-green-600 rounded" type="button" onClick={() => alterarValor(campo, 1)}>+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex gap-4">
              <div className="w-1/2">
                <label className="font-medium">Vencedor</label>
                <select
                  name="vencedor"
                  value={form.vencedor}
                  onChange={e => setForm(f => ({ ...f, vencedor: e.target.value }))}
                  className="w-full p-2 border rounded"
                  required
                >
                  <option value="">Selecione</option>
                  {nomesValidos.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
              <div className="w-1/2 flex items-end">
                <button className="bg-blue-600 text-white px-6 py-2 rounded w-full" type="submit" disabled={loading}>
                  {loading ? "Salvando..." : "Salvar Resultado"}
                </button>
              </div>
            </div>

            {message && <p className="text-green-700 font-semibold">{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
