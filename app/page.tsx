'use client'

import { useState, useEffect, useRef } from 'react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type UserProfile = {
  idade?: number
  sexo?: string
  altura?: number
  peso?: number
  objetivo?: string
  prazo?: string
  nivelAtividade?: string
  rotina?: string
  restricoes?: string
  alergias?: string
  limitacoes?: string
  condicoes?: string
  tdee?: number
  deficitCalorico?: number
  metaCalorias?: number
  metaProteina?: number
  metaPassos?: number
  abordagem?: 'calorias' | 'porcoes'
}

type LogEntry = {
  data: string
  peso?: number
  sono?: number
  fome?: number
  passos?: number
  humor?: string
  refeicao?: string
  notas?: string
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [profile, setProfile] = useState<UserProfile>({})
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [step, setStep] = useState<string>('inicio')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const saved = localStorage.getItem('profile')
    const savedLogs = localStorage.getItem('logs')
    if (saved) {
      setProfile(JSON.parse(saved))
      setStep('comandos')
      addMessage('assistant', 'Bem-vindo de volta! Seus dados foram carregados.\n\nComandos disponíveis:\n• checkin - Registrar peso, sono, fome e atividade\n• refeicao - Registrar uma refeição\n• plano semana - Gerar plano semanal\n• lista compras - Lista de compras baseada no plano\n• relatorio - Resumo dos últimos 7 dias\n• meta - Revisar suas metas\n• ajuda - Ver todos os comandos\n\nO que deseja fazer?')
    } else {
      addMessage('assistant', 'Olá! Sou seu agente de emagrecimento. Vou te ajudar a perder gordura de forma sustentável, com foco em hábitos e consistência.\n\n⚠️ IMPORTANTE: Não sou médico nem nutricionista. Se você tem menos de 18 anos, está grávida, amamentando, tem histórico de transtorno alimentar, diabetes não controlada ou problemas cardíacos, procure um profissional de saúde antes de seguir qualquer plano.\n\nVamos começar com algumas perguntas essenciais. Primeiro:\n\n1. Qual sua idade?')
      setStep('idade')
    }
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs))
    }
  }, [])

  const addMessage = (role: 'user' | 'assistant', content: string) => {
    setMessages(prev => [...prev, { role, content }])
  }

  const saveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile)
    localStorage.setItem('profile', JSON.stringify(newProfile))
  }

  const saveLogs = (newLogs: LogEntry[]) => {
    setLogs(newLogs)
    localStorage.setItem('logs', JSON.stringify(newLogs))
  }

  const calcularTDEE = (peso: number, altura: number, idade: number, sexo: string, nivel: string): number => {
    let bmr: number
    if (sexo.toLowerCase().includes('m')) {
      bmr = 10 * peso + 6.25 * altura - 5 * idade + 5
    } else {
      bmr = 10 * peso + 6.25 * altura - 5 * idade - 161
    }

    const multiplicadores: { [key: string]: number } = {
      'sedentario': 1.2,
      'sedentário': 1.2,
      'leve': 1.375,
      'moderado': 1.55,
      'alto': 1.725,
      'muito alto': 1.9
    }

    const mult = multiplicadores[nivel.toLowerCase()] || 1.2
    return Math.round(bmr * mult)
  }

  const handleCommand = (cmd: string) => {
    const lower = cmd.toLowerCase().trim()

    if (lower === 'ajuda') {
      addMessage('assistant', '📋 COMANDOS DISPONÍVEIS:\n\n• checkin - Registrar peso, sono, fome, passos e humor\n• refeicao - Registrar uma refeição\n• plano semana - Gerar plano semanal de treino e alimentação\n• lista compras - Gerar lista de compras\n• relatorio - Ver resumo dos últimos 7 dias e tendências\n• meta - Revisar e ajustar metas\n• ajuda - Ver esta lista de comandos\n\nDigite o comando que deseja executar.')
      return
    }

    if (lower === 'checkin') {
      setStep('checkin-peso')
      addMessage('assistant', '📊 CHECKIN DIÁRIO\n\nVamos registrar seus dados de hoje.\n\n1. Qual seu peso atual (em kg)?')
      return
    }

    if (lower === 'refeicao' || lower === 'refeição') {
      setStep('refeicao')
      addMessage('assistant', '🍽️ REGISTRO DE REFEIÇÃO\n\nDescreva sua refeição (ex: "2 ovos mexidos, 1 pão integral, 1 banana")')
      return
    }

    if (lower === 'plano semana') {
      const plano = gerarPlanoSemanal()
      addMessage('assistant', plano)
      addMessage('assistant', '\nPróximo passo: Quer gerar a "lista compras" baseada neste plano?')
      return
    }

    if (lower === 'lista compras') {
      const lista = gerarListaCompras()
      addMessage('assistant', lista)
      return
    }

    if (lower === 'relatorio' || lower === 'relatório') {
      const relatorio = gerarRelatorio()
      addMessage('assistant', relatorio)
      return
    }

    if (lower === 'meta') {
      addMessage('assistant', `📊 SUAS METAS ATUAIS:\n\n• TDEE estimado: ${profile.tdee || 'não calculado'} kcal/dia\n• Meta calórica: ${profile.metaCalorias || 'não definida'} kcal/dia\n• Déficit: ${profile.deficitCalorico || 0} kcal/dia\n• Proteína: ${profile.metaProteina || 'não definida'}g/dia (~${profile.peso ? Math.round((profile.metaProteina || 0) / profile.peso * 10) / 10 : 0}g/kg)\n• Passos: ${profile.metaPassos || '8.000-10.000'}/dia\n• Abordagem: ${profile.abordagem === 'calorias' ? 'Contagem de calorias' : 'Método por porções'}\n\nDeseja ajustar alguma meta? (digite "sim" ou "não")`)
      setStep('meta-ajuste')
      return
    }

    addMessage('assistant', 'Comando não reconhecido. Digite "ajuda" para ver os comandos disponíveis.')
  }

  const gerarPlanoSemanal = (): string => {
    const nivel = profile.nivelAtividade?.toLowerCase() || ''
    let treinos = ''

    if (nivel.includes('sedentario') || nivel.includes('sedentário')) {
      treinos = `SEG: Caminhada 20min\nTER: Descanso ativo (alongamento)\nQUA: Caminhada 25min\nQUI: Descanso\nSEX: Caminhada 20min + alongamento\nSAB: Atividade livre (dança, bike, etc)\nDOM: Descanso`
    } else if (nivel.includes('leve')) {
      treinos = `SEG: Treino A (peito, ombro, tríceps) + 15min caminhada\nTER: 30min cardio leve\nQUA: Treino B (costas, bíceps) + 15min caminhada\nQUI: Descanso ou yoga\nSEX: Treino C (pernas, abdômen)\nSAB: 40min caminhada ou atividade livre\nDOM: Descanso ativo`
    } else {
      treinos = `SEG: Treino A (peito, ombro, tríceps)\nTER: HIIT 20min + cardio 20min\nQUA: Treino B (costas, bíceps)\nQUI: Cardio moderado 30-40min\nSEX: Treino C (pernas, core)\nSAB: Atividade intensa (corrida, bike, esporte)\nDOM: Descanso ativo (caminhada leve)`
    }

    const refeicoes = `
EXEMPLO DE REFEIÇÕES (ajuste porções conforme sua meta):

CAFÉ DA MANHÃ:
• 2-3 ovos mexidos + 1 pão integral + 1 fruta
• Iogurte natural + aveia + frutas vermelhas + 1 colher de pasta de amendoim
• Tapioca com queijo cottage + presunto de peru

ALMOÇO/JANTAR:
• Proteína (frango, peixe, carne) + arroz integral + feijão + salada
• Macarrão integral com molho de tomate + carne moída magra + legumes
• Peixe grelhado + batata doce + brócolis

LANCHES:
• Frutas + oleaginosas (castanhas, amêndoas)
• Iogurte grego + granola
• Sanduíche natural (pão integral + peito de peru + queijo + salada)
`

    const habitos = `
HÁBITOS DIÁRIOS:
✓ Beber 2-3L de água
✓ Dormir 7-9h por noite
✓ ${profile.metaPassos || '8.000-10.000'} passos
✓ Registrar peso 2-3x/semana (mesma hora)
✓ Fazer checkin diário no app
`

    return `📅 PLANO SEMANAL\n\n🏋️ TREINOS:\n${treinos}\n${refeicoes}\n${habitos}`
  }

  const gerarListaCompras = (): string => {
    return `🛒 LISTA DE COMPRAS SEMANAL\n\n🥚 PROTEÍNAS:\n☐ Ovos (1-2 dúzias)\n☐ Frango (peito ou coxa, 1-2kg)\n☐ Peixe (filé de tilápia/salmão, 500g-1kg)\n☐ Carne vermelha magra (patinho, 500g)\n☐ Iogurte natural/grego (2-3 potes)\n☐ Queijo cottage (1 pote)\n☐ Peito de peru fatiado (200g)\n\n🌾 CARBOIDRATOS:\n☐ Arroz integral (1 pacote)\n☐ Pão integral (1 pacote)\n☐ Aveia (1 pacote)\n☐ Batata doce (1kg)\n☐ Macarrão integral (1 pacote)\n☐ Feijão (2 latas ou 500g)\n☐ Tapioca (1 pacote)\n\n🥗 VEGETAIS:\n☐ Brócolis (2 maços)\n☐ Tomate (500g)\n☐ Alface/rúcula (2 maços)\n☐ Cenoura (500g)\n☐ Abobrinha (3 unidades)\n☐ Cebola (3 unidades)\n☐ Alho (1 cabeça)\n\n🍎 FRUTAS:\n☐ Banana (1 cacho)\n☐ Maçã (6 unidades)\n☐ Frutas vermelhas congeladas (1 pacote)\n☐ Laranja (6 unidades)\n\n🥜 GORDURAS SAUDÁVEIS:\n☐ Azeite extra virgem\n☐ Pasta de amendoim integral (1 pote)\n☐ Castanhas/amêndoas (200g)\n☐ Abacate (2 unidades)\n\n🧂 TEMPEROS/OUTROS:\n☐ Sal rosa/light\n☐ Pimenta\n☐ Orégano, alho em pó, cúrcuma\n☐ Chá verde/hibisco`
  }

  const gerarRelatorio = (): string => {
    if (logs.length === 0) {
      return '📊 RELATÓRIO\n\nAinda não há dados registrados. Faça um "checkin" para começar a acompanhar seu progresso!'
    }

    const ultimos7 = logs.slice(-7)
    const pesos = ultimos7.filter(l => l.peso).map(l => l.peso!)
    const mediaPeso = pesos.length > 0 ? (pesos.reduce((a, b) => a + b, 0) / pesos.length).toFixed(1) : 'N/A'
    const pesoInicial = pesos[0]
    const pesoAtual = pesos[pesos.length - 1]
    const variacao = pesoInicial && pesoAtual ? (pesoAtual - pesoInicial).toFixed(1) : 'N/A'

    const sonoMedio = ultimos7.filter(l => l.sono).length > 0
      ? (ultimos7.filter(l => l.sono).reduce((a, b) => a + (b.sono || 0), 0) / ultimos7.filter(l => l.sono).length).toFixed(1)
      : 'N/A'

    const fomeMedio = ultimos7.filter(l => l.fome).length > 0
      ? (ultimos7.filter(l => l.fome).reduce((a, b) => a + (b.fome || 0), 0) / ultimos7.filter(l => l.fome).length).toFixed(1)
      : 'N/A'

    let ajustes = '\n📈 AJUSTES SUGERIDOS:\n'

    if (variacao !== 'N/A' && parseFloat(variacao) >= 0) {
      ajustes += '• Peso não caiu esta semana. Vamos reduzir 100-200 kcal/dia OU aumentar 1.000 passos diários.\n'
    } else if (variacao !== 'N/A' && parseFloat(variacao) < -1) {
      ajustes += '• Ótimo progresso! Continue assim. Se sentir muita fome, pode aumentar 50-100 kcal/dia.\n'
    } else {
      ajustes += '• Progresso consistente! Mantenha o plano atual.\n'
    }

    if (fomeMedio !== 'N/A' && parseFloat(fomeMedio) > 7) {
      ajustes += '• Fome alta. Aumente proteína e fibras. Considere adicionar 100-150 kcal de alimentos saciantes.\n'
    }

    if (sonoMedio !== 'N/A' && parseFloat(sonoMedio) < 7) {
      ajustes += '• Sono abaixo do ideal. Priorize dormir 7-9h - isso afeta hormônios da fome e recuperação.\n'
    }

    return `📊 RELATÓRIO DOS ÚLTIMOS 7 DIAS\n\n⚖️ PESO:\n• Média: ${mediaPeso} kg\n• Variação: ${variacao} kg\n\n💤 SONO:\n• Média: ${sonoMedio}h/noite\n\n🍽️ FOME:\n• Média: ${fomeMedio}/10\n\n📝 REGISTROS:\n• Check-ins: ${ultimos7.length}\n• Refeições registradas: ${ultimos7.filter(l => l.refeicao).length}${ajustes}\n\nPróximo passo: Faça um novo "checkin" ou ajuste suas "meta"s se necessário.`
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    addMessage('user', input)
    const userInput = input
    setInput('')

    if (step === 'comandos') {
      handleCommand(userInput)
      return
    }

    if (step === 'idade') {
      const idade = parseInt(userInput)
      if (isNaN(idade) || idade < 10 || idade > 100) {
        addMessage('assistant', 'Por favor, digite uma idade válida (entre 10 e 100 anos).')
        return
      }
      saveProfile({ ...profile, idade })
      setStep('sexo')
      addMessage('assistant', '2. Sexo (masculino/feminino - opcional, mas ajuda no cálculo)?')
      return
    }

    if (step === 'sexo') {
      saveProfile({ ...profile, sexo: userInput })
      setStep('altura')
      addMessage('assistant', '3. Qual sua altura em cm? (ex: 170)')
      return
    }

    if (step === 'altura') {
      const altura = parseInt(userInput)
      if (isNaN(altura) || altura < 100 || altura > 250) {
        addMessage('assistant', 'Por favor, digite uma altura válida em cm (ex: 170).')
        return
      }
      saveProfile({ ...profile, altura })
      setStep('peso')
      addMessage('assistant', '4. Qual seu peso atual em kg? (ex: 75.5)')
      return
    }

    if (step === 'peso') {
      const peso = parseFloat(userInput)
      if (isNaN(peso) || peso < 30 || peso > 300) {
        addMessage('assistant', 'Por favor, digite um peso válido em kg.')
        return
      }
      saveProfile({ ...profile, peso })
      setStep('objetivo')
      addMessage('assistant', '5. Qual seu objetivo?\nExemplos:\n• Perder 10kg em 6 meses\n• Reduzir cintura/gordura abdominal\n• Melhorar condicionamento e perder gordura')
      return
    }

    if (step === 'objetivo') {
      saveProfile({ ...profile, objetivo: userInput })
      setStep('atividade')
      addMessage('assistant', '6. Nível de atividade atual:\n• sedentário - pouco ou nenhum exercício\n• leve - exercício 1-3x/semana\n• moderado - exercício 3-5x/semana\n• alto - exercício intenso 6-7x/semana\n\nDigite uma opção:')
      return
    }

    if (step === 'atividade') {
      const nivelValido = ['sedentario', 'sedentário', 'leve', 'moderado', 'alto'].includes(userInput.toLowerCase())
      if (!nivelValido) {
        addMessage('assistant', 'Por favor, escolha: sedentário, leve, moderado ou alto.')
        return
      }
      saveProfile({ ...profile, nivelAtividade: userInput })
      setStep('restricoes')
      addMessage('assistant', '7. Tem restrições alimentares? (vegetariano, vegano, sem lactose, etc)\nSe não tiver, digite "não".')
      return
    }

    if (step === 'restricoes') {
      saveProfile({ ...profile, restricoes: userInput })
      setStep('limitacoes')
      addMessage('assistant', '8. Tem limitações físicas ou condições médicas relevantes?\nSe não, digite "não".')
      return
    }

    if (step === 'limitacoes') {
      saveProfile({ ...profile, limitacoes: userInput })

      const tdee = calcularTDEE(
        profile.peso!,
        profile.altura!,
        profile.idade!,
        profile.sexo || 'masculino',
        profile.nivelAtividade!
      )

      const deficit = 400
      const metaCalorias = tdee - deficit
      const metaProteina = Math.round(profile.peso! * 1.6)

      const newProfile = {
        ...profile,
        limitacoes: userInput,
        tdee,
        deficitCalorico: deficit,
        metaCalorias,
        metaProteina,
        metaPassos: 8000
      }

      saveProfile(newProfile)
      setStep('abordagem')
      addMessage('assistant', `✅ Cadastro completo!\n\n📊 ESTIMATIVAS CALCULADAS:\n• TDEE (gasto diário): ~${tdee} kcal\n• Meta para déficit: ~${metaCalorias} kcal/dia\n• Déficit: ${deficit} kcal/dia\n• Proteína sugerida: ~${metaProteina}g/dia (~1.6g/kg)\n• Passos: 8.000-10.000/dia\n\n🎯 ESCOLHA SUA ABORDAGEM:\n\nA) COM CONTAGEM DE CALORIAS\n   • Você vai rastrear calorias e macros\n   • Mais preciso, requer app (MyFitnessPal, FatSecret)\n   • Meta: ${metaCalorias} kcal/dia, ${metaProteina}g proteína\n\nB) SEM CONTAGEM (MÉTODO POR PORÇÕES)\n   • Prato equilibrado: 1/2 vegetais, 1/4 proteína, 1/4 carboidrato\n   • Proteína do tamanho da palma em cada refeição\n   • Mais simples, flexível\n\nDigite A ou B:`)
      return
    }

    if (step === 'abordagem') {
      const escolha = userInput.toUpperCase()
      if (escolha !== 'A' && escolha !== 'B') {
        addMessage('assistant', 'Por favor, digite A ou B.')
        return
      }

      const abordagem = escolha === 'A' ? 'calorias' : 'porcoes'
      saveProfile({ ...profile, abordagem })

      const texto = abordagem === 'calorias'
        ? `Você escolheu: CONTAGEM DE CALORIAS\n\n📱 Baixe um app:\n• MyFitnessPal\n• FatSecret\n• Cronometer\n\nSua meta diária:\n• ${profile.metaCalorias} kcal\n• ${profile.metaProteina}g proteína`
        : `Você escolheu: MÉTODO POR PORÇÕES\n\n🍽️ Regra do prato:\n• 1/2 do prato: vegetais/salada\n• 1/4 do prato: proteína (tamanho da palma)\n• 1/4 do prato: carboidrato (arroz, batata, macarrão)\n\nProteína em TODAS as refeições!`

      addMessage('assistant', `${texto}\n\n✅ Configuração completa!\n\n📋 COMANDOS DISPONÍVEIS:\n• checkin - Registrar peso, sono, fome e atividade\n• refeicao - Registrar uma refeição\n• plano semana - Gerar plano semanal\n• lista compras - Lista de compras\n• relatorio - Resumo dos últimos 7 dias\n• meta - Revisar metas\n• ajuda - Ver comandos\n\nDigite um comando para começar!`)
      setStep('comandos')
      return
    }

    if (step === 'checkin-peso') {
      const peso = parseFloat(userInput)
      if (isNaN(peso)) {
        addMessage('assistant', 'Digite um peso válido em kg (ex: 75.5)')
        return
      }
      const hoje = new Date().toISOString().split('T')[0]
      const logHoje: LogEntry = { data: hoje, peso }
      const newLogs = [...logs.filter(l => l.data !== hoje), logHoje]
      saveLogs(newLogs)
      setStep('checkin-sono')
      addMessage('assistant', '2. Quantas horas dormiu ontem? (ex: 7.5)')
      return
    }

    if (step === 'checkin-sono') {
      const sono = parseFloat(userInput)
      if (isNaN(sono) || sono < 0 || sono > 24) {
        addMessage('assistant', 'Digite horas de sono válidas (0-24)')
        return
      }
      const hoje = new Date().toISOString().split('T')[0]
      const logHoje = logs.find(l => l.data === hoje) || { data: hoje }
      logHoje.sono = sono
      const newLogs = [...logs.filter(l => l.data !== hoje), logHoje]
      saveLogs(newLogs)
      setStep('checkin-fome')
      addMessage('assistant', '3. Nível de fome/vontade de comer (0-10, sendo 0=sem fome e 10=faminto)?')
      return
    }

    if (step === 'checkin-fome') {
      const fome = parseInt(userInput)
      if (isNaN(fome) || fome < 0 || fome > 10) {
        addMessage('assistant', 'Digite um número de 0 a 10')
        return
      }
      const hoje = new Date().toISOString().split('T')[0]
      const logHoje = logs.find(l => l.data === hoje) || { data: hoje }
      logHoje.fome = fome
      const newLogs = [...logs.filter(l => l.data !== hoje), logHoje]
      saveLogs(newLogs)
      setStep('checkin-passos')
      addMessage('assistant', '4. Quantos passos deu ontem? (aproximado, se não souber digite 0)')
      return
    }

    if (step === 'checkin-passos') {
      const passos = parseInt(userInput)
      if (isNaN(passos)) {
        addMessage('assistant', 'Digite um número de passos')
        return
      }
      const hoje = new Date().toISOString().split('T')[0]
      const logHoje = logs.find(l => l.data === hoje) || { data: hoje }
      logHoje.passos = passos
      const newLogs = [...logs.filter(l => l.data !== hoje), logHoje]
      saveLogs(newLogs)
      setStep('checkin-humor')
      addMessage('assistant', '5. Como está seu humor/energia? (ótimo/bom/regular/ruim)')
      return
    }

    if (step === 'checkin-humor') {
      const hoje = new Date().toISOString().split('T')[0]
      const logHoje = logs.find(l => l.data === hoje) || { data: hoje }
      logHoje.humor = userInput
      const newLogs = [...logs.filter(l => l.data !== hoje), logHoje]
      saveLogs(newLogs)

      let feedback = '✅ Check-in registrado!\n\n'
      if (logHoje.fome && logHoje.fome > 7) {
        feedback += '⚠️ Fome alta. Considere aumentar proteína e fibras nas refeições.\n'
      }
      if (logHoje.sono && logHoje.sono < 7) {
        feedback += '⚠️ Sono abaixo do ideal. Tente dormir 7-9h - isso afeta muito a perda de gordura.\n'
      }
      if (logHoje.passos && logHoje.passos < 5000) {
        feedback += '💡 Poucos passos. Tente aumentar gradualmente para 8.000-10.000/dia.\n'
      }

      feedback += '\nPróximo passo: Digite "relatorio" para ver seu progresso ou "plano semana" para ver seu plano de treino!'

      addMessage('assistant', feedback)
      setStep('comandos')
      return
    }

    if (step === 'refeicao') {
      const hoje = new Date().toISOString().split('T')[0]
      const logHoje = logs.find(l => l.data === hoje) || { data: hoje }
      logHoje.refeicao = (logHoje.refeicao || '') + '\n' + userInput
      const newLogs = [...logs.filter(l => l.data !== hoje), logHoje]
      saveLogs(newLogs)

      addMessage('assistant', '✅ Refeição registrada!\n\n💡 DICA: Se estiver contando calorias, registre no seu app. Se não, avalie:\n• Tinha proteína? (carne, ovo, peixe, leguminosa)\n• Tinha vegetais/fibras?\n• Porção adequada?\n\nDigite outro comando ou "refeicao" para registrar outra.')
      setStep('comandos')
      return
    }

    if (step === 'meta-ajuste') {
      if (userInput.toLowerCase().includes('sim')) {
        addMessage('assistant', 'Qual meta deseja ajustar?\n• calorias - Ajustar meta calórica\n• proteina - Ajustar meta de proteína\n• passos - Ajustar meta de passos\n• abordagem - Mudar entre contagem e porções')
        setStep('meta-escolha')
      } else {
        addMessage('assistant', 'Ok! Metas mantidas. Digite outro comando.')
        setStep('comandos')
      }
      return
    }

    if (step === 'meta-escolha') {
      const escolha = userInput.toLowerCase()
      if (escolha.includes('caloria')) {
        addMessage('assistant', `Meta atual: ${profile.metaCalorias} kcal/dia\nDigite nova meta (ex: 1800):`)
        setStep('meta-calorias-valor')
      } else if (escolha.includes('proteina') || escolha.includes('proteína')) {
        addMessage('assistant', `Meta atual: ${profile.metaProteina}g/dia\nDigite nova meta (ex: 120):`)
        setStep('meta-proteina-valor')
      } else if (escolha.includes('passo')) {
        addMessage('assistant', `Meta atual: ${profile.metaPassos}/dia\nDigite nova meta (ex: 10000):`)
        setStep('meta-passos-valor')
      } else if (escolha.includes('abordagem')) {
        addMessage('assistant', 'Escolha:\nA) Com contagem de calorias\nB) Sem contagem (porções)')
        setStep('meta-abordagem-valor')
      } else {
        addMessage('assistant', 'Opção inválida. Digite: calorias, proteina, passos ou abordagem')
      }
      return
    }

    if (step === 'meta-calorias-valor') {
      const calorias = parseInt(userInput)
      if (isNaN(calorias) || calorias < 1000 || calorias > 4000) {
        addMessage('assistant', 'Digite um valor válido (1000-4000 kcal)')
        return
      }
      saveProfile({ ...profile, metaCalorias: calorias })
      addMessage('assistant', `✅ Meta atualizada para ${calorias} kcal/dia!\n\nDigite outro comando.`)
      setStep('comandos')
      return
    }

    if (step === 'meta-proteina-valor') {
      const proteina = parseInt(userInput)
      if (isNaN(proteina) || proteina < 50 || proteina > 300) {
        addMessage('assistant', 'Digite um valor válido (50-300g)')
        return
      }
      saveProfile({ ...profile, metaProteina: proteina })
      addMessage('assistant', `✅ Meta atualizada para ${proteina}g/dia!\n\nDigite outro comando.`)
      setStep('comandos')
      return
    }

    if (step === 'meta-passos-valor') {
      const passos = parseInt(userInput)
      if (isNaN(passos) || passos < 1000 || passos > 30000) {
        addMessage('assistant', 'Digite um valor válido (1000-30000 passos)')
        return
      }
      saveProfile({ ...profile, metaPassos: passos })
      addMessage('assistant', `✅ Meta atualizada para ${passos} passos/dia!\n\nDigite outro comando.`)
      setStep('comandos')
      return
    }

    if (step === 'meta-abordagem-valor') {
      const escolha = userInput.toUpperCase()
      if (escolha !== 'A' && escolha !== 'B') {
        addMessage('assistant', 'Digite A ou B')
        return
      }
      const abordagem = escolha === 'A' ? 'calorias' : 'porcoes'
      saveProfile({ ...profile, abordagem })
      addMessage('assistant', `✅ Abordagem atualizada para: ${abordagem === 'calorias' ? 'Contagem de calorias' : 'Método por porções'}!\n\nDigite outro comando.`)
      setStep('comandos')
      return
    }

    addMessage('assistant', 'Não entendi. Digite "ajuda" para ver os comandos.')
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      backgroundColor: '#0d1117',
      color: '#c9d1d9'
    }}>
      <header style={{
        padding: '20px',
        borderBottom: '1px solid #30363d',
        backgroundColor: '#161b22'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>🏃‍♂️ Agente de Emagrecimento</h1>
        <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#8b949e' }}>
          Suporte inteligente para perda de peso sustentável
        </p>
      </header>

      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            <div
              style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: '8px',
                backgroundColor: msg.role === 'user' ? '#238636' : '#21262d',
                border: `1px solid ${msg.role === 'user' ? '#2ea043' : '#30363d'}`,
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace',
                fontSize: '14px',
                lineHeight: '1.6'
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          padding: '20px',
          borderTop: '1px solid #30363d',
          backgroundColor: '#161b22',
          display: 'flex',
          gap: '10px'
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite sua resposta..."
          style={{
            flex: 1,
            padding: '12px 16px',
            backgroundColor: '#0d1117',
            border: '1px solid #30363d',
            borderRadius: '6px',
            color: '#c9d1d9',
            fontSize: '14px',
            fontFamily: 'monospace',
            outline: 'none'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#58a6ff'
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#30363d'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '12px 24px',
            backgroundColor: '#238636',
            border: '1px solid #2ea043',
            borderRadius: '6px',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'system-ui'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#2ea043'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#238636'
          }}
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
