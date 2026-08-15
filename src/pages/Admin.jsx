export default function Admin() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Painel do Administrador</h1>
          <p className="text-slate-400 mt-1">Configuração e controle operacional do app_carteira.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4">Janela Operacional</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-950/30 border border-emerald-800/50 rounded-lg">
              <div>
                <span className="font-medium text-emerald-400 block">Status de Mercado: ABERTO</span>
                <span className="text-xs text-emerald-500">Ordens a mercado e limitadas estão sendo processadas</span>
              </div>
              <button className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-medium text-sm transition-colors">
                Fechar Mercado
              </button>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-400">Taxa de Corretagem/Venda</span>
              <input 
                type="text" 
                defaultValue="0.025%" 
                className="w-24 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-right text-sm text-slate-200" 
              />
            </div>
          </div>
        </section>

        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4">Gestão de Equipes e Usuários</h2>
          <p className="text-sm text-slate-400 mb-6">
            Adicione novas equipes de participantes e defina o saldo inicial da competição.
          </p>
          <div className="flex gap-3">
            <button className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm transition-colors">
              Nova Equipe
            </button>
            <button className="flex-1 px-4 py-2.5 bg-slate-750 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg font-medium text-sm transition-colors">
              Gerenciar Equipes
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
