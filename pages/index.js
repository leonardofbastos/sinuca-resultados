const CampoContador = ({ titulo, nomeMandante, nomeVisitante, campoMandante, campoVisitante }) => (
  <div className="border rounded-lg p-4 mb-4 bg-blue-50">
    <h3 className="text-xl font-semibold mb-4 text-center text-blue-700">{titulo}</h3>
    <div className="grid grid-cols-2 gap-4 text-center">
      {[
        { campo: campoMandante, label: `${nomeMandante} (Mandante)` },
        { campo: campoVisitante, label: `${nomeVisitante} (Visitante)` }
      ].map(({ campo, label }) => (
        <div key={campo} className="flex flex-col items-center">
          <label className="mb-1 font-medium">{label}</label>
          <div className="flex items-center gap-3 justify-center">
            <button
              type="button"
              className="px-3 py-2 text-lg bg-red-500 text-white rounded"
              onClick={() => alterarValor(campo, -1)}
            >
              -
            </button>
            <span className="w-10 text-center text-lg">{form[campo]}</span>
            <button
              type="button"
              className="px-3 py-2 text-lg bg-green-600 text-white rounded"
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

// Na parte do form onde ficam Vencedor e botão Salvar:
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
      {nomes.map((nome) => (
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
