import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const __dirname = path.resolve()

// Helper to count lines of code in a directory recursively
function getCodeStats(dir, extensions = ['.js', '.jsx', '.css', '.html', '.sql']) {
    let fileCount = 0
    let lineCount = 0

    function walk(currentDir) {
        if (!fs.existsSync(currentDir)) return
        const files = fs.readdirSync(currentDir)
        for (const file of files) {
            const fullPath = path.join(currentDir, file)
            if (fs.statSync(fullPath).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                    walk(fullPath)
                }
            } else {
                const ext = path.extname(file)
                if (extensions.includes(ext)) {
                    fileCount++
                    const content = fs.readFileSync(fullPath, 'utf8')
                    lineCount += content.split('\n').length
                }
            }
        }
    }

    walk(dir)
    return { fileCount, lineCount }
}

// Check feature completion based on actual files and contents
function getFeaturesStatus() {
    const checkFile = (p) => fs.existsSync(path.join(__dirname, p))
    const checkSize = (p) => checkFile(p) ? fs.statSync(path.join(__dirname, p)).size : 0

    // Features definition
    const features = [
        {
            name: 'Cliente Supabase & Conexão',
            status: checkFile('src/services/supabase.js') ? 'done' : 'pending',
            detail: 'Conexão configurada em src/services/supabase.js'
        },
        {
            name: 'Contexto de Autenticação',
            status: checkFile('src/context/AuthContext.jsx') ? 'done' : 'pending',
            detail: 'AuthProvider e useAuth criados em src/context/AuthContext.jsx'
        },
        {
            name: 'Banco de Dados (Migrations & Seeds)',
            status: (checkFile('.supabase/migrations/20260815000000_initial_schema.sql') && checkFile('.supabase/seeds/seeds.sql')) ? 'done' : 'pending',
            detail: 'Esquema de 8 tabelas e carga inicial de ativos'
        },
        {
            name: 'Layout & Roteamento',
            status: (checkFile('src/routes/index.jsx') && checkSize('src/App.jsx') > 100) ? 'done' : 'pending',
            detail: 'Configurado react-router-dom no App.jsx'
        },
        {
            name: 'Dashboard do Participante',
            status: checkFile('src/pages/Dashboard.jsx') ? 'in-progress' : 'pending',
            detail: 'Página criada, pendente integração dinâmica com hooks de portfólio'
        },
        {
            name: 'Painel do Administrador',
            status: checkFile('src/pages/Admin.jsx') ? 'in-progress' : 'pending',
            detail: 'Página criada, pendente controle das janelas operacionais via banco'
        },
        {
            name: 'Hooks de Negócio (usePortfolio / useOrders)',
            status: (checkFile('src/hooks/usePortfolio.js') || checkFile('src/hooks/useOrders.js')) ? 'done' : 'pending',
            detail: 'Consulta e mutação de ativos e transações'
        },
        {
            name: 'Mercado (Negociação de Ativos)',
            status: checkFile('src/pages/Market.jsx') ? 'done' : 'pending',
            detail: 'Envio de ordens a mercado e limitadas'
        },
        {
            name: 'Classificação / Ranking',
            status: checkFile('src/pages/Ranking.jsx') ? 'done' : 'pending',
            detail: 'Tabela de posições e rentabilidade das equipes'
        }
    ]

    const total = features.length
    const doneCount = features.filter(f => f.status === 'done').length
    const inProgressCount = features.filter(f => f.status === 'in-progress').length
    
    // Calculate total progress: done = 100%, in-progress = 50%
    const progressPercent = Math.round(((doneCount + inProgressCount * 0.5) / total) * 100)

    return { features, progressPercent }
}

// Get Git Information
function getGitInfo() {
    try {
        const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim()
        const commitHash = execSync('git rev-parse --short HEAD').toString().trim()
        const commitMsg = execSync('git log -1 --pretty=%B').toString().trim()
        const commitDate = execSync('git log -1 --format=%cd --date=format:"%d/%m/%Y %H:%M"').toString().trim()
        const totalCommits = parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10)
        return { branch, commitHash, commitMsg, commitDate, totalCommits }
    } catch {
        return {
            branch: 'desconhecido',
            commitHash: 'n/a',
            commitMsg: 'Nenhum commit encontrado',
            commitDate: 'n/a',
            totalCommits: 0
        }
    }
}

function generateReport() {
    console.log('Analisando diretório e gerando métricas reais...')
    const stats = getCodeStats(__dirname)
    const { features, progressPercent } = getFeaturesStatus()
    const gitInfo = getGitInfo()

    const reportData = {
        updatedAt: new Date().toLocaleString('pt-BR'),
        stats,
        features,
        progressPercent,
        gitInfo
    }

    const templatePath = path.join(__dirname, 'dashboard_template.html')
    const outputPath = path.join(__dirname, 'dashboard.html')

    if (!fs.existsSync(templatePath)) {
        console.error('dashboard_template.html não encontrado!')
        return
    }

    let html = fs.readFileSync(templatePath, 'utf8')
    // Inject data
    html = html.replace('/*DATA_INJECTION_PLACEHOLDER*/', `window.PROJECT_DATA = ${JSON.stringify(reportData, null, 2)};`)

    fs.writeFileSync(outputPath, html, 'utf8')
    console.log(`Relatório real gerado com sucesso em: ${outputPath}`)
}

generateReport()
