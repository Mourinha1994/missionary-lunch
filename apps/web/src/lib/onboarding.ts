import { driver, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'
import type { Role } from '@/types'

export const TUTORIAL_STORAGE_KEY = 'ml-tutorial-seen'

export function hasSeenTutorial(): boolean {
  return localStorage.getItem(TUTORIAL_STORAGE_KEY) === '1'
}

export function markTutorialSeen(): void {
  localStorage.setItem(TUTORIAL_STORAGE_KEY, '1')
}

function buildSteps(role: Role): DriveStep[] {
  const steps: DriveStep[] = [
    {
      popover: {
        title: 'Bem-vindo(a) ao Missionary Lunch!',
        description:
          'Vamos fazer um tour rápido pelas funcionalidades para você começar com o pé direito. Pode pular a qualquer momento usando o botão de fechar (X).',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="calendar"]',
      popover: {
        title: 'Calendário de almoços',
        description:
          'Visão mensal dos almoços agendados. Dias em vermelho são bloqueados (P-Day). Clique em um dia livre para agendar, ou clique em um almoço existente para editar.',
        side: 'top',
        align: 'center',
      },
    },
    {
      element: '[data-tour="upcoming"]',
      popover: {
        title: 'Próximos almoços',
        description:
          'Lista dos próximos 30 dias com família anfitriã e missionários — ideal para repassar a escala rapidamente no WhatsApp.',
        side: 'left',
        align: 'center',
      },
    },
    {
      element: '[data-tour="export-pdf"]',
      popover: {
        title: 'Exportar PDF',
        description:
          'Baixa a escala do mês visível em PDF para compartilhar com as famílias e a liderança.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: '[data-tour="new-lunch"]',
      popover: {
        title: 'Novo almoço',
        description:
          'Cria um agendamento manualmente. É obrigatório escolher uma família ativa e pelo menos um missionário.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: '[data-tour="nav-missionaries"]',
      popover: {
        title: 'Missionários',
        description:
          'Cadastre os missionários com gênero (Élder/Irmã), período da missão, área e telefone. Ao sair um missionário, desative-o — ele deixa de aparecer nas opções de almoço.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-families"]',
      popover: {
        title: 'Famílias',
        description:
          'Cadastre as famílias anfitriãs com contato e endereço. Famílias inativas não podem receber novos almoços.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-lunches"]',
      popover: {
        title: 'Almoços',
        description:
          'Visão geral de todos os almoços. O sistema impede almoços duplicados na mesma data, em dias de P-Day ou com famílias e missionários inativos.',
        side: 'right',
        align: 'center',
      },
    },
    {
      element: '[data-tour="nav-pday"]',
      popover: {
        title: 'P-Day (Dia de Preparação)',
        description:
          'Configure o dia da semana sem almoços (padrão: segunda-feira) e crie exceções pontuais — por exemplo, numa semana de transferência, libere a segunda e bloqueie a quarta.',
        side: 'right',
        align: 'center',
      },
    },
  ]

  if (role === 'ADMIN') {
    steps.push({
      element: '[data-tour="nav-users"]',
      popover: {
        title: 'Usuários',
        description:
          'Exclusivo de administradores: crie contas de coordenadores, altere papéis e desative acessos.',
        side: 'right',
        align: 'center',
      },
    })
  }

  steps.push({
    popover: {
      title: 'Tudo pronto!',
      description:
        'Você pode refazer este tutorial quando quiser pelo botão de ajuda no menu lateral. Bom trabalho!',
      side: 'top',
      align: 'center',
    },
  })

  return steps
}

export function startTutorial(role: Role, onDone?: () => void): void {
  const driverObj = driver({
    steps: buildSteps(role),
    showProgress: true,
    progressText: 'Passo {{current}} de {{total}}',
    nextBtnText: 'Avançar',
    prevBtnText: 'Voltar',
    doneBtnText: 'Concluir',
    animate: true,
    overlayOpacity: 0.7,
    stagePadding: 6,
    disableActiveInteraction: true,
    skipMissingElement: true,
    popoverClass: 'ml-tour-popover',
    onDestroyed: () => {
      markTutorialSeen()
      onDone?.()
    },
  })

  driverObj.drive()
}
