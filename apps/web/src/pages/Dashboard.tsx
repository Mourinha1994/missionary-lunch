// src/pages/Dashboard.tsx
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useQuery } from '@tanstack/react-query'
import { lunchesApi } from '@/api/lunches'
import { pdayApi } from '@/api/pday'
import { Button } from '@/components/ui/button'
import { Download, Plus, Zap, ChevronLeft, ChevronRight, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { LunchFormModal } from '@/components/calendar/LunchFormModal.tsx'
import { exportCalendarAsPDF, exportScaleAsPDF, getScaleBlob, getCalendarBlob, buildScaleText, shareOrPrint } from '@/lib/exportCalendar'
import { useAuthStore } from '@/store/authStore'
import { hasSeenTutorial, startTutorial } from '@/lib/onboarding'
import type { ScaleLunch } from '@/lib/exportCalendar'

dayjs.extend(isoWeek)

export function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const [currentRange, setCurrentRange] = useState({
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().endOf('month').format('YYYY-MM-DD'),
  })
  const [currentMonth, setCurrentMonth] = useState(dayjs().startOf('month').format('YYYY-MM-DD'))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedLunchId, setSelectedLunchId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [view, setView] = useState<'dayGridMonth' | 'listWeek'>('dayGridMonth')
  const calendarRef = useRef<FullCalendar | null>(null)

  const { data: lunches = [] } = useQuery({
    queryKey: ['lunches', currentRange],
    queryFn: () => lunchesApi.getAll(currentRange.start, currentRange.end),
  })

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['pday', 'blocked', currentRange],
    queryFn: () => pdayApi.getBlockedDates(currentRange.start, currentRange.end),
  })

  const { data: upcoming = [] } = useQuery({
    queryKey: ['lunches', 'upcoming'],
    queryFn: () =>
      lunchesApi.getAll(
        dayjs().format('YYYY-MM-DD'),
        dayjs().add(30, 'day').format('YYYY-MM-DD'),
      ),
  })

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setCurrentRange({
      start: dayjs(arg.start).format('YYYY-MM-DD'),
      end: dayjs(arg.end).format('YYYY-MM-DD'),
    })
    setCurrentMonth(dayjs(arg.view.currentStart).format('YYYY-MM-DD'))
    setView(arg.view.type as 'dayGridMonth' | 'listWeek')
  }, [])

  useEffect(() => {
    if (hasSeenTutorial()) return
    const timer = setTimeout(() => {
      startTutorial(user?.role ?? 'COORDINATOR')
    }, 700)
    return () => clearTimeout(timer)
  }, [user?.role])

  const handleDateClick = useCallback((arg: DateClickArg) => {
    const isBlocked = blockedDates.some(b => b.date === arg.dateStr)
    if (isBlocked) return
    setSelectedDate(arg.dateStr)
    setSelectedLunchId(null)
    setIsModalOpen(true)
  }, [blockedDates])

  const handleEventClick = useCallback((arg: EventClickArg) => {
    const lunchId = arg.event.extendedProps.lunchId
    if (lunchId) {
      setSelectedLunchId(lunchId)
      setSelectedDate(null)
      setIsModalOpen(true)
    }
  }, [])

  const lunchEvents = lunches.map(lunch => ({
    id: lunch.id,
    title: lunch.family.name,
    date: String(lunch.date).split('T')[0],
    backgroundColor: '#2553E0',
    borderColor: '#1E43C0',
    textColor: '#fff',
    extendedProps: { lunchId: lunch.id, familyId: lunch.familyId },
  }))

  // Badge de rotação: quantas vezes a família é agendada no mês exibido (1ª, 2ª, ...)
  const rotationMap = useMemo(() => {
    const map = new Map<string, number>()
    const counts = new Map<string, number>()
    const monthKey = dayjs(currentMonth).format('YYYY-MM')
    for (const lunch of [...lunches].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())) {
      if (dayjs(lunch.date).format('YYYY-MM') !== monthKey) continue
      const key = `${lunch.familyId}:${monthKey}`
      const count = (counts.get(key) ?? 0) + 1
      counts.set(key, count)
      map.set(lunch.id, count)
    }
    return map
  }, [lunches, currentMonth])

  const blockedEvents = blockedDates.map(b => ({
    start: b.date,
    end: b.date,
    display: 'background' as const,
    classNames: b.isException && !b.blocked ? ['pday-liberated'] : ['pday-block'],
    extendedProps: { reason: b.reason },
  }))

  const blockedSet = useMemo(
    () => new Set(blockedDates.filter(b => b.blocked !== false).map(b => b.date)),
    [blockedDates],
  )

  const handleDayCellClassNames = useCallback(
    (arg: { date: Date }) =>
      blockedSet.has(dayjs(arg.date).format('YYYY-MM-DD')) ? ['pday-block-cell'] : [],
    [blockedSet],
  )

  // Banner de semana de transferência quando existe uma exceção liberada no período
  const transferWeek = blockedDates.find((b) => b.isException && b.blocked === false) ?? null

  const upcomingScale: ScaleLunch[] = upcoming.map((l) => ({
    date: String(l.date).split('T')[0],
    familyName: l.family.name,
    familyContact: l.family.contact,
    missionaries: l.missionaries,
    notes: l.notes,
  }))

  const shareScale = async () => {
    const blob = getScaleBlob(upcomingScale)
    if (
      blob &&
      navigator.share &&
      navigator.canShare?.({ files: [new File([blob], 'escala-almocos.pdf', { type: 'application/pdf' })] })
    ) {
      try {
        await navigator.share({
          files: [new File([blob], 'escala-almocos.pdf', { type: 'application/pdf' })],
          title: 'Escala de Almoços',
        })
        return
      } catch {
        return // usuário cancelou o compartilhamento
      }
    }
    const text = buildScaleText(upcomingScale)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Escala copiada — cole no grupo do WhatsApp')
    } catch {
      toast.error('Não foi possível compartilhar a escala')
    }
  }

  const calendarScale: ScaleLunch[] = lunches.map((l) => ({
    date: String(l.date).split('T')[0],
    familyName: l.family.name,
    familyContact: l.family.contact,
    missionaries: l.missionaries,
    notes: l.notes,
  }))

  const handleExportCalendar = () => {
    const fileName = `almoco-missionarios-${dayjs(currentMonth).format('MM-YYYY')}.pdf`
    shareOrPrint(
      getCalendarBlob(calendarScale, blockedDates, currentMonth),
      fileName,
      'Calendário de Almoços',
      () => exportCalendarAsPDF(calendarScale, blockedDates, currentMonth),
    )
  }

  const handleExportScale = () => {
    shareOrPrint(
      getScaleBlob(upcomingScale),
      'escala-almocos.pdf',
      'Escala de Almoços',
      () => exportScaleAsPDF(upcomingScale),
    )
  }

  const monthStats = useMemo(() => {
    const monthKey = dayjs(currentMonth).format('YYYY-MM')
    const lunchesInMonth = lunches.filter(
      (l) => dayjs(l.date).format('YYYY-MM') === monthKey,
    ).length
    const blockedInMonth = blockedDates.filter(
      (b) => b.blocked !== false && dayjs(b.date).format('YYYY-MM') === monthKey,
    ).length
    const freeDays = Math.max(0, dayjs(currentMonth).daysInMonth() - blockedInMonth - lunchesInMonth)
    return { lunchesInMonth, blockedInMonth, freeDays }
  }, [lunches, blockedDates, currentMonth])

  return (
    <div className="flex flex-col h-full">
      {/* Header da página */}
      <div className="bg-surface border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div>
          <h1 className="text-[1.375rem] font-bold text-text-900">Calendário de almoços</h1>
          <p className="text-sm text-text-500 mt-0.5">
            {dayjs(currentRange.start).format('MMMM [de] YYYY')} · {lunches.length} almoços agendados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            data-tour="export-pdf"
            onClick={handleExportCalendar}
            aria-label="Exportar calendário em PDF"
          >
            <Download /> <span className="hidden sm:inline">Exportar PDF</span>
          </Button>
          <Button
            data-tour="new-lunch"
            onClick={() => { setSelectedDate(null); setSelectedLunchId(null); setIsModalOpen(true) }}
            aria-label="Novo almoço"
          >
            <Plus /> <span className="hidden sm:inline">Novo almoço</span>
          </Button>
        </div>
      </div>

      {/* Calendário + próximos almoços */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-4 px-4 sm:px-6 py-5">
        <div className="lg:hidden grid grid-cols-3 gap-2 shrink-0">
          <div className="bg-surface rounded-[12px] border border-border px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-400">Almoços</p>
            <p className="text-lg font-bold text-brand-600">{monthStats.lunchesInMonth}</p>
          </div>
          <div className="bg-surface rounded-[12px] border border-border px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-400">Bloqueados</p>
            <p className="text-lg font-bold text-danger-600">{monthStats.blockedInMonth}</p>
          </div>
          <div className="bg-surface rounded-[12px] border border-border px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-400">Dias livres</p>
            <p className="text-lg font-bold text-success-600">{monthStats.freeDays}</p>
          </div>
        </div>
        <div id="calendar-wrapper" className="flex-1 min-w-0" data-tour="calendar">
          <div className="bg-surface rounded-[16px] border border-border overflow-hidden h-full flex flex-col">
            {transferWeek && (
              <div className="flex items-center gap-2.5 px-3.5 py-2 bg-warning-50 border-b border-warning-100 text-warning-700 text-xs">
                <Zap className="w-3.5 h-3.5 shrink-0" />
                <b className="mr-auto">Semana de transferência: {dayjs(transferWeek.date).format('D [de] MMM')}</b>
                <Button variant="ghost" size="sm" className="bg-warning-600 text-white hover:bg-warning-700 font-semibold" onClick={() => navigate('/pday')}>
                  Ver mudanças
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between gap-3 px-[18px] py-3.5 border-b border-border shrink-0">
              <button
                className="w-8 h-8 rounded-lg grid place-items-center text-text-500 hover:bg-surface-2 hover:text-text-900 transition-colors shrink-0"
                aria-label="Mês anterior"
                onClick={() => calendarRef.current?.getApi().prev()}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="min-w-0 truncate text-[15px] font-semibold text-text-900 capitalize">
                {dayjs(currentMonth).format('MMMM [de] YYYY')}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  className="hidden sm:inline-flex h-8 px-3 rounded-lg text-xs font-medium text-text-500 hover:bg-surface-2 hover:text-text-900 transition-colors"
                  onClick={() => calendarRef.current?.getApi().today()}
                >
                  Hoje
                </button>
                <button
                  className="w-8 h-8 rounded-lg grid place-items-center text-text-500 hover:bg-surface-2 hover:text-text-900 transition-colors"
                  aria-label="Próximo mês"
                  onClick={() => calendarRef.current?.getApi().next()}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="inline-flex bg-surface-2 rounded-lg p-[3px] gap-0.5">
                  <button
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      view === 'dayGridMonth'
                        ? 'bg-surface text-text-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                        : 'text-text-500 hover:text-text-900'
                    }`}
                    onClick={() => calendarRef.current?.getApi().changeView('dayGridMonth')}
                  >
                    Mês
                  </button>
                  <button
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      view === 'listWeek'
                        ? 'bg-surface text-text-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)]'
                        : 'text-text-500 hover:text-text-900'
                    }`}
                    onClick={() => calendarRef.current?.getApi().changeView('listWeek')}
                  >
                    Semana
                  </button>
                </div>
              </div>
            </div>
            <div className="flex-1 min-h-0">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
                initialView="dayGridMonth"
                locale="pt-br"
                events={[...lunchEvents, ...blockedEvents]}
                datesSet={handleDatesSet}
                dateClick={handleDateClick}
                eventClick={handleEventClick}
                dayCellClassNames={handleDayCellClassNames}
                height="100%"
                dayMaxEvents={3}
                eventDisplay="block"
                headerToolbar={false}
                eventContent={(arg) => {
                  const occ = rotationMap.get(arg.event.id)
                  return (
                    <div className="flex items-center gap-1 px-1.5 py-0.5 overflow-hidden">
                      <span className="truncate text-[11px] leading-tight">{arg.event.title}</span>
                      {occ != null && (
                        <span className="shrink-0 rounded-full bg-white/20 px-1 text-[9px] font-semibold">
                          {occ}ª
                        </span>
                      )}
                    </div>
                  )
                }}
                dayCellContent={(args) => (
                  <>
                    {args.dayNumberText}
                    {!args.isOther && args.date.getDay() === 0 && (
                      <span className="weeknum" aria-hidden="true">{dayjs(args.date).isoWeek()}</span>
                    )}
                  </>
                )}
              />
            </div>
          </div>
        </div>

        <aside className="w-full lg:w-80 shrink-0 bg-surface rounded-[16px] border border-border flex flex-col overflow-hidden" data-tour="upcoming">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-2">
            <h2 className="text-[0.9375rem] font-semibold text-text-900">Próximos almoços</h2>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                title="Compartilhar escala no WhatsApp"
                onClick={shareScale}
                disabled={upcoming.length === 0}
              >
                <Share2 /> Compartilhar
              </Button>
              <Button
                variant="outline"
                size="sm"
                title="Exportar escala em PDF"
                onClick={handleExportScale}
                disabled={upcoming.length === 0}
              >
                <Download /> PDF
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-sm text-text-500">
                Nenhum almoço agendado nos próximos 30 dias.
              </p>
            ) : (
              upcoming.slice(0, 6).map((lunch) => (
                <div key={lunch.id} className="bg-surface rounded-[12px] border border-border p-3">
                  <p className="text-xs font-semibold text-brand-600">
                    {dayjs(lunch.date).format('ddd, D [de] MMM').toUpperCase()}
                  </p>
                  <p className="text-sm font-semibold text-text-900 mt-1">
                    {lunch.family.name}
                  </p>
                  <p className="text-xs text-text-400 mt-0.5 truncate">
                    {lunch.missionaries.map((m) => m.name).join(' · ')}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      <LunchFormModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialDate={selectedDate}
        lunchId={selectedLunchId}
      />
    </div>
  )
}
