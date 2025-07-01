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

  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    buscarResultados();
    buscarPartidas();

    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      .select(`id_partida, rodada, status_partida, 
        clubes_mandante:tab_clube!tab_partida_id_clube_mandante_fkey(descricao), 
        clubes_visitante:tab_clube!tab_partida_id_clube_visitante_fkey(descricao)`);

    if (!error) setPartidas(data);
  };

  const handleInputChange = (e) => {
    setSearchTerm(e.target.value);
    setDropdownOpen(true);
  };

  const selecionarPartida = (p) => {
    setForm(prev => ({
      ...prev,
      id_partida: p.id_partida,
      placar_mandante: 0,
      placar_visitante: 0,
      felinos_mandante: 0,
      felinos_visitante: 0,
      penalidades_mandante: 0,
      penalidades_visitante: 0,
      sinucas_mandante: 0,
      sinucas_visitante: 0,
      vencedor: "",
    }));
    setSearchTerm(`Rodada ${p.rodada} - ${p.id_partida} - ${p.clubes_mandante?.descricao} x ${p.clubes_visitante?.descricao} (${p.status_partida})`);
    setDropdownOpen(false);
  };

  const alterarValor = (campo, incremento) => {
    setForm(prev => ({
      ...prev,
      [campo]: Math.max(0, prev[campo] + incremento)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.id_partida) {
      setMessage("Selecione uma partida válida");
      return;
    }
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
      setSearchTerm("");
      buscarResultados();
      buscarPartidas();
    } else {
      setMessage("Erro ao salvar resultado.");
    }

    setLoading(false);
  };

  const CampoContador = ({ titulo, campoMandante, campoVisitante }) => {
    const partidaSelecionada = partidas.find(p => p.id_partida === form.id_partida);
    const mandanteNome = partidaSelecionada?.clubes_mandante?.descricao || "Mandante";
    const visitanteNome = partidaSelecionada?.clubes_visitante?.descricao || "Visitante";

    return (
      <div className="border rounded-lg p-4 mb-4 bg-blue-50">
        <h3 className="text-xl font-bold mb-4 text-center text-blue-800">{titulo}</h3>
        <div className="grid grid-cols-2 gap-4 text-center">
          {[campoMandante, campoVisitante].map((campo, idx) => (
            <div key={campo} className="flex flex-col items-center">
              <label className="mb-1 font-semibold text-blue-700">{idx === 0 ? mandanteNome : visitanteNome}</label>
              <div className="flex items-center gap-2 justify-center">
                <button
                  type="button"
                  className="px-2 py-1 bg-red-500 text-white rounded"
                  onClick={() => alterarValor(campo, -1)}
                >
                  -
                </button>
                <span className="w-8 text-center">{form[campo]}</span>
                <button
                  type="button"
                  className="px-2 py-1 bg-green-600 text-white rounded"
                  onClick={() => alterarValor(campo, 1)}
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const partidasFiltradas = partidas.filter(p => {
    const texto = `${p.rodada} ${p.id_partida} ${p.clubes_mandante?.descricao} ${p.clubes_visitante?.descricao} ${p.status_partida}`.toLowerCase();
    return texto.includes(searchTerm.toLowerCase());
  });

  return (
    <div>
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

        <form onSubmit={handleSubmit} className="space-y-6" autoComplete="off" ref={wrapperRef}>
          <div className="flex gap-4 mb-6">
            <div className="w-1/2 relative">
              <label className="block mb-1 font-medium">Partida</label>
              <input
                type="text"
                name="id_partida"
                value={searchTerm}
                onChange={handleInputChange}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Digite o número ou parte da partida"
                className="w-full p-2 border rounded"
                autoComplete="off"
                required
              />
              {dropdownOpen && partidasFiltradas.length > 0 && (
                <ul className="absolute z-10 bg-white border max-h-48 overflow-auto w-full mt-1 rounded shadow-lg">
                  {partidasFiltradas.map(p => (
                    <li
                      key={p.id_partida}
                      onClick={() => selecionarPartida(p)}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                    >
                      Rodada {p.rodada} - {p.id_partida} - {p.clubes_mandante?.descricao} x {p.clubes_visitante?.descricao} ({p.status_partida})
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="w-1/2">
              <label className="block mb-1 font-medium">Juiz</label>
              <select name="juiz" value={form.juiz} onChange={handleChange} className="w-full p-2 border rounded" required>
                <option value="">Selecione o Juiz</option>
                {nomes.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </div>
          </div>

          <CampoContador titulo="Placar" campoMandante="placar_mandante" campoVisitante="placar_visitante" />
          <CampoContador titulo="Penalidades" campoMandante="penalidades_mandante" campoVisitante="penalidades_visitante" />
          <CampoContador titulo="Felinos" campoMandante="felinos_mandante" campoVisitante="felinos_visitante" />
          <CampoContador titulo="Sinucas" campoMandante="sinucas_mandante" campoVisitante="sinucas_visitante" />

          <div className="flex items-end gap-4">
            <div className="w-1/2">
              <label className="block mb-1 font-medium">Vencedor</label>
              <select
                name="vencedor"
                value={form.vencedor}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Selecione o Vencedor</option>
                {nomes.map((nome) => (
                  <option key={nome} value={nome}>{nome}</option>
                ))}
              </select>
            </div>

            <div className="w-1/2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Salvando..." : "Salvar Resultado"}
              </button>
            </div>
          </div>

          {message && <p className="mt-2 text-green-700 font-semibold">{message}</p>}
        </form>
      </div>
    </div>
  );
}
