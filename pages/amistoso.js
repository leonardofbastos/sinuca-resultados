import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Navbar from "../components/Navbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function Amistoso() {
  const [tipo, setTipo] = useState("INDIVIDUAL");
  const [clubes, setClubes] = useState([]);
  const [form, setForm] = useState({
    mandante1: "",
    mandante2: "",
    visitante1: "",
    visitante2: "",
    data_amistoso: "",
    placar_mandante: 0,
    placar_visitante: 0,
    felinos_mandante: 0,
    felinos_visitante: 0,
    penalidades_mandante: 0,
    penalidades_visitante: 0,
    sinucas_mandante: 0,
    sinucas_visitante: 0,
    vencedor1: "",
    vencedor2: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // BUSCA O CADASTRO DE CLUBES
  useEffect(() => {
    fetchClubes();
  }, []);

  async function fetchClubes() {
    const { data, error } = await supabase
      .from("tab_clube")
      .select("id_clube,descricao")
      .order("descricao");

    if (error) {
      console.error("Erro ao buscar clubes:", error);
      return;
    }
    setClubes(data);
  }

  function alterarValor(campo, incremento) {
    setForm((prev) => ({
      ...prev,
      [campo]: Math.max(0, prev[campo] + incremento),
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.mandante1 || !form.visitante1 || !form.data_amistoso) {
      setMessage("Mandante 1, Visitante 1 e Data do amistoso são obrigatórios");
      return;
    }

    if (tipo === "DUPLA" && (!form.mandante2 || !form.visitante2)) {
      setMessage("Para dupla, é necessário selecionar mandante 2 e visitante 2");
      return;
    }

    if (tipo === "INDIVIDUAL" && !form.vencedor1) {
      setMessage("Selecione o vencedor 1");
      return;
    }

    if (tipo === "DUPLA" && (!form.vencedor1 || !form.vencedor2)) {
      setMessage("Selecione os vencedores 1 e 2");
      return;
    }

    setLoading(true);
    setMessage("");

    const objInsert = {
      tipo,
      mandante1: Number(form.mandante1),
      mandante2: tipo === "DUPLA" ? Number(form.mandante2) : null,
      visitante1: Number(form.visitante1),
      visitante2: tipo === "DUPLA" ? Number(form.visitante2) : null,
      data_amistoso: form.data_amistoso,
      placar_mandante: Number(form.placar_mandante) || 0,
      placar_visitante: Number(form.placar_visitante) || 0,
      felinos_mandante: Number(form.felinos_mandante) || 0,
      felinos_visitante: Number(form.felinos_visitante) || 0,
      penalidades_mandante: Number(form.penalidades_mandante) || 0,
      penalidades_visitante: Number(form.penalidades_visitante) || 0,
      sinucas_mandante: Number(form.sinucas_mandante) || 0,
      sinucas_visitante: Number(form.sinucas_visitante) || 0,
      vencedor1: form.vencedor1,
      vencedor2: tipo === "DUPLA" ? form.vencedor2 : null,
    };

    const { error } = await supabase.from("tab_amistoso").insert(objInsert);
    if (error) {
      setMessage("Erro ao salvar amistoso: " + error.message);
      setLoading(false);
      return;
    }

    setMessage("Amistoso salvo com sucesso!");
    setForm({
      mandante1: "",
      mandante2: "",
      visitante1: "",
      visitante2: "",
      data_amistoso: "",
      placar_mandante: 0,
      placar_visitante: 0,
      felinos_mandante: 0,
      felinos_visitante: 0,
      penalidades_mandante: 0,
      penalidades_visitante: 0,
      sinucas_mandante: 0,
      sinucas_visitante: 0,
      vencedor1: "",
      vencedor2: "",
    });
    setLoading(false);
  }

  // Helpers para nomes dos clubes (ID → nome)
  const getNomeClube = (id) => clubes.find((c) => c.id_clube == id)?.descricao || "";

  return (
    <>
    <Navbar />

    <div style={{ fontFamily: "Open Sans, Helvetica, sans-serif" }}>
      <header className="fixed top-0 left-0 w-full bg-gray-800 text-white py-3 text-center text-xl font-bold z-50">
        F.O.S.S.A.®
      </header>

    {/* TITULO DO TOPO*/}
      <div className="max-w-6xl mx-auto p-6 pt-32">
        <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-bold">
          Lançar Resultado Amistoso</h1>
        </div>

      <div className="flex gap-4">
        {/* CAMPO DE TIPO AMISTOSO */}
        <div className="w-1/2">
            <label className="block font-semibold mb-2">Tipo de Amistoso</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="INDIVIDUAL">Individual</option>
              <option value="DUPLA">Dupla</option>
            </select>
          </div>

          {/* CAMPO DE DATA DO AMISTOSO */}
          <div className="w-1/2">
            <label className="block font-semibold mb-2">Data do Amistoso</label>
            <input
              type="date"
              value={form.data_amistoso}
              onChange={(e) => setForm({ ...form, data_amistoso: e.target.value })}
              className="w-full p-2 border rounded"
              required
            />
        </div>
      </div>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded shadow"
        >
          {/* Dados Mandante */}
          <div>
            <h2 className="font-semibold text-lg mb-2">Mandante</h2>
            <select
              value={form.mandante1}
              onChange={(e) => setForm({ ...form, mandante1: e.target.value })}
              required
              className="w-full p-2 border"
            >
              <option value="">Selecione...</option>
              {clubes.map((c) => (
                <option key={c.id_clube} value={c.id_clube}>
                  {c.descricao}
                </option>
              ))}
            </select>

            {tipo === "DUPLA" && (
              <select
                value={form.mandante2}
                onChange={(e) => setForm({ ...form, mandante2: e.target.value })}
                className="w-full p-2 border mt-2"
              >
                <option value="">Selecione...</option>
                {clubes.map((c) => (
                  <option key={c.id_clube} value={c.id_clube}>
                    {c.descricao}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Dados Visitante */}
          <div>
            <h2 className="font-semibold text-lg mb-2">Visitante</h2>
            <select
              value={form.visitante1}
              onChange={(e) => setForm({ ...form, visitante1: e.target.value })}
              required
              className="w-full p-2 border"
            >
              <option value="">Selecione...</option>
              {clubes.map((c) => (
                <option key={c.id_clube} value={c.id_clube}>
                  {c.descricao}
                </option>
              ))}
            </select>

            {tipo === "DUPLA" && (
              <select
                value={form.visitante2}
                onChange={(e) => setForm({ ...form, visitante2: e.target.value })}
                className="w-full p-2 border mt-2"
              >
                <option value="">Selecione...</option>
                {clubes.map((c) => (
                  <option key={c.id_clube} value={c.id_clube}>
                    {c.descricao}
                  </option>
                ))}
              </select>
            )}
          </div>

            {/* BLOCOS DE LANÇAR PONTUAÇÕES */}
          <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {["Placar", "Felinos", "Penalidades", "Sinucas"].map((titulo, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-blue-50 mb-4">
                <h3 className="text-xl font-bold text-blue-800 text-center mb-4">{titulo}</h3>
                <div className="grid grid-cols-2 gap-4">
                  {["mandante", "visitante"].map((tipo, i) => {
                    const campo = `${titulo.toLowerCase()}_${tipo}`;
                     return (
                      <div key={i} className="flex flex-col items-center">
                        <label className="text-blue-700 font-semibold mb-1">{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</label>

                        {/* BOTOES DE MAIS E MENOS */}
                        <div className="flex items-center gap-2">
                          {/* <span className="capitalize">{}</span> */}
                          <button
                            type="button"
                            onClick={() => alterarValor(campo,-1)}
                            className="px-3 py-1 text-white bg-red-500 rounded"
                          >
                            -
                          </button>
                        <span>{form[campo]}</span>
                          <button
                            type="button"
                            onClick={() => alterarValor(campo, 1)}
                            className="px-3 py-1 text-white bg-green-600 rounded" 
                          >
                            +
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Vencedor + Botão Salvar, lado a lado em telas grandes */}
          <div className="col-span-2 flex flex-col md:flex-row items-end justify-between gap-4 mt-4">
            {/* <div className="w-full md:w-1/2"> */}
            <div className="w-1/2">
              <label className="block font-semibold mb-2">Vencedor</label>

              {tipo === "INDIVIDUAL" ? (
                <select
                  value={form.vencedor1}
                  onChange={(e) => setForm({ ...form, vencedor1: e.target.value })}
                  required
                  className="w-full p-2 border rounded"
                >
                  <option value="">Selecione o vencedor</option>
                  {[form.mandante1, form.visitante1].map((id) =>
                    id ? (
                      <option key={id} value={id}>
                        {getNomeClube(id)}
                      </option>
                    ) : null
                  )}
                </select>
              ) : (
                <select
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "MANDANTE") {
                      setForm({
                        ...form,
                        vencedor1: form.mandante1,
                        vencedor2: form.mandante2,
                      });
                    } else if (val === "VISITANTE") {
                      setForm({
                        ...form,
                        vencedor1: form.visitante1,
                        vencedor2: form.visitante2,
                      });
                    } else {
                      setForm({ ...form, vencedor1: "", vencedor2: "" });
                    }
                  }}
                  className="w-full p-2 border rounded"
                  value={
                    form.vencedor1 === form.mandante1 && form.vencedor2 === form.mandante2
                      ? "MANDANTE"
                      : form.vencedor1 === form.visitante1 && form.vencedor2 === form.visitante2
                      ? "VISITANTE"
                      : ""
                  }
                >
                  <option value="">Selecione a dupla vencedora</option>
                  {form.mandante1 && form.mandante2 && (
                    <option value="MANDANTE">
                      {getNomeClube(form.mandante1)} + {getNomeClube(form.mandante2)}
                    </option>
                  )}
                  {form.visitante1 && form.visitante2 && (
                    <option value="VISITANTE">
                      {getNomeClube(form.visitante1)} + {getNomeClube(form.visitante2)}
                    </option>
                  )}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-1/2 bg-blue-600 text-white p-2 rounded"
            >
              {loading ? "Salvando..." : "Salvar Amistoso"}
            </button>
          </div>

          {/* Mensagem de sucesso ou erro */}
          {message && (
            <p
              className={`col-span-2 mt-2 text-center text-sm ${
                message.includes("sucesso") ? "text-green-600" : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
    </>
  );
}
