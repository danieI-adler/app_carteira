export default function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <header className="max-w-7xl mx-auto flex justify-between items-center border-b border-slate-800 pb-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard da Carteira</h1>
          <p className="text-slate-400 mt-1">Bem-vindo à simulação de investimentos.</p>
        </div>
        <div className="flex gap-4">
          <div className="text-right">
            <span className="text-sm text-slate-400 block">Patrimônio Líquido</span>
            <span className="text-xl font-bold text-emerald-400">R$ 10.000.000,00</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4">Resumo da Conta</h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Caixa Disponível</span>
              <span className="font-medium text-slate-200">R$ 10.000.000,00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Posições Compradas</span>
              <span className="font-medium text-slate-200">R$ 0,00</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Posições Vendidas (Short)</span>
              <span className="font-medium text-slate-200">R$ 0,00</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-3">
              <span className="text-slate-400">Lucro/Prejuízo Acumulado</span>
              <span className="font-medium text-emerald-400">R$ 0,00 (0,00%)</span>
            </div>
          </div>
        </section>

        <section className="bg-slate-800 border border-slate-700/50 rounded-xl p-6 shadow-sm md:col-span-2">
          <h2 className="text-lg font-semibold text-white mb-4">Seu Portfólio</h2>
          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-700 rounded-lg">
            Você ainda não possui posições ativas. Vá ao mercado para enviar ordens de compra ou venda.
          </div>
        </section>
      </main>
    </div>
  )
}
