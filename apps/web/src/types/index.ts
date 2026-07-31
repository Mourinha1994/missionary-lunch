export type Gender = 'MALE' | 'FEMALE'
export type Role = 'ADMIN' | 'COORDINATOR'

export interface Missionary {
    id: string
    name: string
    gender: Gender
    startDate: string
    endDate: string
    area: string
    phone?: string
    active: boolean
    createdAt: string
}

export interface Family {
    id: string
    name: string
    contact: string
    phone: string
    email?: string
    address?: string
    active: boolean
    createdAt: string
}

export interface Lunch {
    id: string
    date: string
    notes?: string
    familyId: string
    family: Family
    missionaryIds: string[]
    missionaries: Missionary[]
    createdAt: string
}

export interface PdayConfig {
    id: string
    dayOfWeek: number
    dayName: string
    startDate: string
    reason: string
    createdAt: string
}

export interface PdayException {
    id: string
    date: string
    blocked: boolean
    reason?: string
    createdAt: string
}

export interface BlockedDate {
    date: string
    reason: string
    isException: boolean
    /** Quando ausente, trate como dia bloqueado (comportamento da API legada). */
    blocked?: boolean
}

export interface User {
    id: string
    name: string
    email: string
    role: Role
}