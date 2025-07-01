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
    const { data, error } = await supabase
      .from("tab_partida")
      .select(`
        id_partida,
        rodada,
        status_partida,
        clubes_mandante:tab_clube!id_clube_mandante(descricao),
        clubes_visitante:tab_clube!id_clube_visitante(descricao)
      `);

    if (error) {
      console.error("Erro ao buscar partidas:", error);
    } else {
      setPartidas(data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_partida) {
      setMessage("Selecione uma partida válida");
      return;
    }

    setLoading(true);
    setMessage("");

    const idPartida = Number(form.id_partida);

    const objInsert = {
      id_partida: idPartida,
      arbitro: form.arbitro,
      vencedor: form.vencedor,
      placar_mandante: Number(form.placar_mandante),
      placar_visitante: Number(form.placar_visitante),
      felinos_mandante: Number(form.felinos_mandante),
      felinos_visitante: Number(form.felinos_visitante),
      penalidades_mandante: Number(form.penalidades_mandante),
      penalidades_visitante: Number(form.penalidades_visitante),
      sinucas_mandante: Number(form.sinucas_mandante),
      sinucas_visitante: Number(form.sinucas_visitante)
    };

    const { error: insertError } = await supabase
      .from("tab_resultado_partida")
      .insert(objInsert);

    if (insertError) {
      setMessage("Erro ao salvar resultado: " + insertError.message);
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("tab_partida")
      .update({ status_partida: "LANÇADO" })
      .eq("id_partida", idPartida);

    if (updateError) {
      setMessage("Erro ao atualizar status da partida: " + updateError.message);
    } else {
      setMessage("Resultado salvo com sucesso!");
      setForm({
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
      setSearchTerm("");
      buscarPartidas();
    }

    setLoading(false);
  };

  const partidasFiltradas = partidas.filter(p => {
    const texto = `${p.rodada ?? ""} ${p.id_partida ?? ""} ${p.clubes_mandante?.descricao ?? ""} ${p.clubes_visitante?.descricao ?? ""}`.toLowerCase();
    return texto.includes(searchTerm.toLowerCase());
  });

  const partidaSelecionada = partidas.find(p => p.id_partida === Number(form.id_partida));

  const nomesValidos = [];
  if (partidaSelecionada) {
    if (partidaSelecionada.clubes_mandante?.descricao) nomesValidos.push(partidaSelecionada.clubes_mandante.descricao);
    if (partidaSelecionada.clubes_visitante?.descricao) nomesValidos.push(partidaSelecionada.clubes_visitante.descricao);
  }

  const alterarValor = (campo, incremento) => {
    setForm(prev => ({
      ...prev,
      [campo]: Math.max(0, prev[campo] + incremento)
    }));
  };

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
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full p-2 border rounded"
                  placeholder="Rodada ou Clube..."
                  required
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

            <div className="grid grid-cols-2 gap-4">
              {["placar", "felinos", "penalidades", "sinucas"].map((campo, i) => (
                <div key={i} className="border p-4 rounded bg-blue-50">
                  <h3 className="text-center text-blue-800 font-bold capitalize mb-2">{campo}</h3>
                  {[0, 1].map(j => {
                    const tipo = j === 0 ? "mandante" : "visitante";
                    const nome = j === 0
                      ? partidaSelecionada?.clubes_mandante?.descricao || "Mandante"
                      : partidaSelecionada?.clubes_visitante?.descricao || "Visitante";
                    const key = `${campo}_${tipo}`;
                    return (
                      <div key={key} className="mb-2 flex justify-between items-center">
                        <span className="font-medium">{nome}</span>
                        <div className="flex gap-2 items-center">
                          <button type="button" onClick={() => alterarValor(key, -1)} className="bg-red-500 text-white px-2 rounded">-</button>
                          <span>{form[key]}</span>
                          <button type="button" onClick={() => alterarValor(key, 1)} className="bg-green-600 text-white px-2 rounded">+</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="flex gap-4 items-end mt-4">
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
              <div className="w-1/2">
                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white px-4 py-2 rounded">
                  {loading ? "Salvando..." : "Salvar Resultado"}
                </button>
              </div>
            </div>

            {message && <p className="text-green-700 font-semibold mt-2">{message}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
