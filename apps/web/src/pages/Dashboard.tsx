// src/pages/Dashboard.tsx
import { useState, useRef, useCallback } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { EventClickArg, DatesSetArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { lunchesApi } from '@/api/lunches'
import { pdayApi } from '@/api/pday'
import { Button } from '@/components/ui/button'
import { Download, Plus } from 'lucide-react'
import { LunchFormModal } from '@/components/calendar/LunchFormModal.tsx'
import { exportCalendarAsPDF } from '@/lib/exportCalendar'

export function Dashboard() {
  const [currentRange, setCurrentRange] = useState({
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end: dayjs().endOf('month').format('YYYY-MM-DD'),
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedLunchId, setSelectedLunchId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const calendarRef = useRef<FullCalendar | null>(null)

  const { data: lunches = [] } = useQuery({
    queryKey: ['lunches', currentRange],
    queryFn: () => lunchesApi.getAll(currentRange.start, currentRange.end),
  })

  const { data: blockedDates = [] } = useQuery({
    queryKey: ['pday', 'blocked', currentRange],
    queryFn: () => pdayApi.getBlockedDates(currentRange.start, currentRange.end),
  })

  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setCurrentRange({
      start: dayjs(arg.start).format('YYYY-MM-DD'),
      end: dayjs(arg.end).format('YYYY-MM-DD'),
    })
  }, [])

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

  // Eventos de almoço para o FullCalendar
  const lunchEvents = lunches.map(lunch => ({
    id: lunch.id,
    title: lunch.family.name,
    date: String(lunch.date).split('T')[0],
    backgroundColor: '#2563EB',
    borderColor: '#1D4ED8',
    textColor: '#fff',
    extendedProps: { lunchId: lunch.id },
  }))

  // Background events para P-Days bloqueados
  const blockedEvents = blockedDates.map(b => ({
    start: b.date,
    end: b.date,
    display: 'background',
    backgroundColor: b.isException && !b.blocked ? '#EFF6FF' : '#FEE2E2',
    classNames: ['pday-block'],
    extendedProps: { reason: b.reason },
  }))

  // Stats cards
  const stats = [
    { label: 'Almoços no mês', value: lunches.length, color: 'text-blue-600' },
    { label: 'Dias bloqueados', value: blockedDates.filter(b => b.blocked !== false).length, color: 'text-red-500' },
    {
      label: 'Dias livres', value: (() => {
        const daysInMonth = dayjs(currentRange.start).daysInMonth()
        const sundays = Array.from({ length: daysInMonth }, (_, i) =>
          dayjs(currentRange.start).date(i + 1).day()
        ).filter(d => d === 0).length
        return daysInMonth - sundays - blockedDates.length - lunches.length
      })(),
      color: 'text-amber-500'
    },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Topbar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Calendário de almoços</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {dayjs(currentRange.start).format('MMMM [de] YYYY')} · {lunches.length} almoços agendados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCalendarAsPDF('calendar-wrapper')}>
            <Download className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
          <Button size="sm" onClick={() => { setSelectedDate(null); setSelectedLunchId(null); setIsModalOpen(true) }}>
            <Plus className="w-4 h-4 mr-2" /> Novo almoço
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 pt-5 pb-0 grid grid-cols-3 gap-4 shrink-0">
        {stats.map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-slate-200 p-4">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-semibold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Calendário */}
      <div id="calendar-wrapper" className="flex-1 px-6 py-5 overflow-auto">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden h-full">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            locale="pt-br"
            events={[...lunchEvents, ...blockedEvents]}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            height="100%"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth'
            }}
            buttonText={{ today: 'Hoje', month: 'Mês' }}
            dayMaxEvents={3}
            eventDisplay="block"
          />
        </div>
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