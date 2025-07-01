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
  const [idSelecionado, setIdSelecionado] = useState(""); // <-- Guarda o id_partida selecionado explicitamente
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

  // const buscarPartidas = async () => {
  //   const { data, error } = await supabase
  //     .from("tab_partida")
  //     .select(`
  //       id_partida,
  //       rodada,
  //       status_partida,
  //       clubes_mandante:tab_clube!id_clube_mandante(descricao),
  //       clubes_visitante:tab_clube!id_clube_visitante(descricao)
  //     `);

  //   if (error) {
  //     console.error("Erro ao buscar partidas:", error);
  //   } else {
  //     setPartidas(data);
  //   }
  // };

  const buscarPartidas = async () => {
    const { data, error } = await supabase
      .from("tab_partida")
      .select(`
        id_partida,
        rodada,
        status_partida,
        clubes_mandante:tab_clube!id_clube_mandante(descricao),
        clubes_visitante:tab_clube!id_clube_visitante(descricao),
        resultados:tab_resultado_partida(
          id_partida,
          placar_mandante,
          placar_visitante,
          felinos_mandante,
          felinos_visitante,
          penalidades_mandante,
          penalidades_visitante,
          sinucas_mandante,
          sinucas_visitante
        )
      `)
      .order("tab_partida.rodada", { ascending: true })
      .order("tab_partida.id_partida", { ascending: true })
      .order("tab_resultado_partida.data_criacao", { ascending: false });

    if (error) {
      console.error("Erro ao buscar partidas:", error);
    } else {
      // Para duplicar as linhas com múltiplos resultados
      const partidasComResultados = data.flatMap(partida => {
        if (!partida.resultados || partida.resultados.length === 0) {
          return [{ ...partida, resultado: null }];
        }
        return partida.resultados.map(r => ({
          ...partida,
          resultado: r
        }));
      });

      setPartidas(partidasComResultados);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!idSelecionado) {
      setMessage("Selecione uma partida válida");
      return;
    }
    setLoading(true);
    setMessage("");

    const objInsert = {
      id_partida: Number(idSelecionado),
      arbitro: form.arbitro,
      vencedor: form.vencedor,
      placar_mandante: Number(form.placar_mandante) || 0,
      placar_visitante: Number(form.placar_visitante) || 0,
      felinos_mandante: Number(form.felinos_mandante) || 0,
      felinos_visitante: Number(form.felinos_visitante) || 0,
      penalidades_mandante: Number(form.penalidades_mandante) || 0,
      penalidades_visitante: Number(form.penalidades_visitante) || 0,
      sinucas_mandante: Number(form.sinucas_mandante) || 0,
      sinucas_visitante: Number(form.sinucas_visitante) || 0,
    };

    // Inserir resultado
    const { error: insertError } = await supabase.from("tab_resultado_partida").insert(objInsert);
    if (insertError) {
      setMessage("Erro ao salvar resultado: " + insertError.message);
      setLoading(false);
      return;
    }

    // Atualizar status da partida usando idSelecionado como string
    const { error: updateError } = await supabase
      .from("tab_partida")
      .update({ status_partida: "LANÇADA" })
      .eq("id_partida", String(idSelecionado));  // <-- Aqui o ajuste importante!

    if (updateError) {
      setMessage("Erro ao atualizar status da partida: " + updateError.message);
      setLoading(false);
      return;
    }

    setMessage("Resultado salvo e status atualizado com sucesso!");

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
      sinucas_visitante: 0,
    });
    setSearchTerm("");
    setIdSelecionado("");
    buscarPartidas();
    setLoading(false);
  };

  // Filtro para dropdown de partidas
  const partidasFiltradas = partidas.filter(p => {
    if (!searchTerm.trim()) return true;
    const texto = `${p.rodada ?? ''} ${p.id_partida ?? ''} ${p.clubes_mandante?.descricao ?? ''} ${p.clubes_visitante?.descricao ?? ''}`.toLowerCase();
    return texto.includes(searchTerm.toLowerCase());
  });

  // Encontra partida selecionada pelo idSelecionado (que é número/string coerente)
  const partidaSelecionada = partidas.find(p => p.id_partida === Number(idSelecionado));

  // Para filtro de nomes já usados na partida
  const nomesValidos = [];
  if (partidaSelecionada) {
    if (partidaSelecionada.clubes_mandante?.descricao) nomesValidos.push(partidaSelecionada.clubes_mandante.descricao);
    if (partidaSelecionada.clubes_visitante?.descricao) nomesValidos.push(partidaSelecionada.clubes_visitante.descricao);
  }

  // Incrementa/decrementa os valores no form
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
          <h1 className="text-3xl font-bold">
            {mostrarTabela ? "Todas as Partidas" : "Lançar Resultado"}
          </h1>
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
                    <td className={`font-bold ${p.status_partida === 'LANÇADA' ? 'text-green-600' : 'text-blue-600'}`}>
                      {p.status_partida}
                    </td>
                    <td>{p.clubes_mandante?.descricao}</td>
                    <td>{p.clubes_visitante?.descricao}</td>
                    <td>{p.resultado?.placar_mandante ?? 0} x {p.resultado?.placar_visitante ?? 0}</td>
                    <td>{p.resultado?.felinos_mandante ?? 0} x {p.resultado?.felinos_visitante ?? 0}</td>
                    <td>{p.resultado?.penalidades_mandante ?? 0} x {p.resultado?.penalidades_visitante ?? 0}</td>
                    <td>{p.resultado?.sinucas_mandante ?? 0} x {p.resultado?.sinucas_visitante ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6" ref={wrapperRef} autoComplete="off">
            <div className="flex gap-4">
              <div className="w-1/2 relative">
                <label className="font-medium">Partida</label>
                <input
                  value={searchTerm}
                  onChange={e => {
                    setSearchTerm(e.target.value);
                    setDropdownOpen(true);
                    setIdSelecionado(""); // limpa ao digitar novo texto
                    setForm(f => ({ ...f, id_partida: "" }));
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  className="w-full p-2 border rounded"
                  placeholder="Rodada ou Clube..."
                  autoComplete="off"
                  required
                />
                {dropdownOpen && (
                  <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-auto mt-1 rounded shadow">
                    {partidasFiltradas.length > 0 ? partidasFiltradas.map(p => (
                      <li
                        key={p.id_partida}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                        onClick={() => {
                          setForm(f => ({ ...f, id_partida: p.id_partida }));
                          setSearchTerm(`Rodada ${p.rodada} - ${p.id_partida} - ${p.clubes_mandante?.descricao} x ${p.clubes_visitante?.descricao}`);
                          setIdSelecionado(String(p.id_partida)); // <-- salva ID selecionado aqui
                          setDropdownOpen(false);
                        }}
                      >
                        Rodada {p.rodada} - {p.id_partida} - {p.clubes_mandante?.descricao} x {p.clubes_visitante?.descricao} ({p.status_partida})
                      </li>
                    )) : (
                      <li className="p-2 text-gray-500">Nenhuma partida encontrada</li>
                    )}
                  </ul>
                )}
              </div>

              <div className="w-1/2">
                <label className="font-medium">Id Partida Selecionada</label>
                <input
                  type="text"
                  readOnly
                  value={idSelecionado}
                  className="w-full p-2 border rounded bg-gray-100"
                  placeholder="Nenhuma partida selecionada"
                />
              </div>
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
