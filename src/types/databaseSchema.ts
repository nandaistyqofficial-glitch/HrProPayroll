/**
 * Database Schema & Architecture Definition
 * Sistem Presensi (Attendance) & Penggajian (Payroll) Terintegrasi
 */

export interface ShiftDefinition {
  id: string;
  shiftCode: string;
  shiftName: string;
  startTime: string; // "09:00:00"
  endTime: string;   // "18:00:00"
  gracePeriodMinutes: number; // e.g. 15 mins (09:15 is late threshold)
  standardWorkHours: number;  // e.g. 8.0, 3.0, 4.0 hours
  breakDurationMinutes: number; // e.g. 60 or 0 mins
  description?: string;
  isCustom?: boolean;
}

export interface AttendanceDatabaseRecord {
  id: string;
  employeeId: string;
  employeeNik: string;
  employeeName: string;
  company: string;
  department: string;
  date?: string; // YYYY-MM-DD
  attendanceDate?: string; // YYYY-MM-DD
  shiftId: string;
  shiftName?: string;
  checkInTime: string; // ISO string
  checkOutTime?: string | null;
  status: 'present' | 'late' | 'absent' | 'completed' | 'on_leave';
  lateMinutes: number;
  overtimeMinutes: number;
  totalWorkMinutes: number;
  netWorkHours: number;
  breakDurationMinutes: number;
  location?: string;
  ipAddress?: string;
  isManualEdit?: boolean;
  isLockedForPayroll: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const INITIAL_SHIFTS: ShiftDefinition[] = [
  {
    id: 'shift-9-6',
    shiftCode: 'FULL-0918',
    shiftName: 'Shift Pejabat Penuh (09:00 - 18:00)',
    startTime: '09:00:00',
    endTime: '18:00:00',
    gracePeriodMinutes: 15, // 09:15 ke atas = lewat
    standardWorkHours: 8.0,
    breakDurationMinutes: 60,
    description: 'Waktu standard korporat 8 jam bekerja + 1 jam rehat (09:00 - 18:00)',
  },
  {
    id: 'shift-9-12',
    shiftCode: 'HALF-0912',
    shiftName: 'Shift Pagi / Separuh Hari (09:00 - 12:00)',
    startTime: '09:00:00',
    endTime: '12:00:00',
    gracePeriodMinutes: 10, // 09:10 ke atas = lewat
    standardWorkHours: 3.0,
    breakDurationMinutes: 0,
    description: 'Waktu kerja 3 jam pagi (09:00 - 12:00) untuk staf editorial & sambilan',
  },
  {
    id: 'shift-12-16',
    shiftCode: 'PART-1216',
    shiftName: 'Shift Tengahari / Siang (12:00 - 16:00)',
    startTime: '12:00:00',
    endTime: '16:00:00',
    gracePeriodMinutes: 10, // 12:10 ke atas = lewat
    standardWorkHours: 4.0,
    breakDurationMinutes: 0,
    description: 'Waktu kerja 4 jam petang (12:00 - 16:00) untuk staf stor & logistik',
  },
  {
    id: 'shift-830-1730',
    shiftCode: 'OFFICE-0830',
    shiftName: 'Shift Standard UNION (08:30 - 17:30)',
    startTime: '08:30:00',
    endTime: '17:30:00',
    gracePeriodMinutes: 15, // 08:45 ke atas = lewat
    standardWorkHours: 8.0,
    breakDurationMinutes: 60,
    description: 'Waktu standard penerbitan 8.0 jam bekerja + 1 jam rehat (08:30 - 17:30)',
  },
  {
    id: 'shift-flexi',
    shiftCode: 'REMOTE-FLEXI',
    shiftName: 'Shift Fleksi / Remote Antarabangsa',
    startTime: '09:00:00',
    endTime: '18:00:00',
    gracePeriodMinutes: 30, // 09:30 ke atas = lewat
    standardWorkHours: 8.0,
    breakDurationMinutes: 60,
    description: 'Waktu anjal untuk pekerja remote antarabangsa & teknologi maklumat',
  },
];

export const DEFAULT_OFFICE_SHIFT: ShiftDefinition = INITIAL_SHIFTS[0];

/**
 * SQL DDL Schema string for PostgreSQL / Cloud SQL / MySQL
 */
export const POSTGRESQL_DDL_SCHEMA = `-- =========================================================================
-- SKEMA DATABASE PRESENSI & PENGGAJIAN TERINTEGRASI (POSTGRESQL / CLOUD SQL)
-- Arsitektur: Multi-Tenant Corporate (Pustaka Union & Solusi Serumpun)
-- Kepatuhan Statutori: Akta Kerja 1955 (Kitaran Gaji 26hb - 25hb)
-- =========================================================================

-- 1. TABEL PENGGUNA (AUTH & AKSEBILITI)
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Employee', 'HRD', 'Director', 'Supervisor')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'resigned')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. TABEL SHIFT & WAKTU KERJA
CREATE TABLE shifts (
    id VARCHAR(36) PRIMARY KEY,
    shift_code VARCHAR(50) NOT NULL UNIQUE,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,              -- '08:30:00'
    end_time TIME NOT NULL,                -- '17:30:00'
    grace_period_minutes INT DEFAULT 15,   -- Toleransi keterlambatan
    standard_work_hours NUMERIC(4,2) DEFAULT 8.00,
    break_duration_minutes INT DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. TABEL KARYAWAN (PROFIL & STRUKTUR GAJI)
CREATE TABLE employees (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
    nik VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    ic_passport VARCHAR(50) NOT NULL,
    company_name VARCHAR(100) NOT NULL CHECK (company_name IN ('Pustaka Union', 'Solusi Serumpun Senusantara SDN. BHD')),
    department VARCHAR(100) NOT NULL,
    job_title VARCHAR(100) NOT NULL,
    employment_type VARCHAR(50) NOT NULL CHECK (employment_type IN ('Tetap', 'Kontrak', 'Percubaan', 'Sambilan')),
    shift_id VARCHAR(36) REFERENCES shifts(id),
    base_salary NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    currency_code VARCHAR(10) NOT NULL DEFAULT 'MYR',
    hourly_rate NUMERIC(10,2) GENERATED ALWAYS AS (base_salary / 26.0 / 8.0) STORED,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    kwsp_number VARCHAR(50),
    perkeso_number VARCHAR(50),
    tax_number VARCHAR(50),
    status_aktif BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. TABEL PRESENSI (ATTENDANCES) - INTI ALUR INTEGRASI
CREATE TABLE attendances (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    shift_id VARCHAR(36) REFERENCES shifts(id),
    
    -- Timestamp Absensi Sadar (Bukan Auto-Login)
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    
    -- Metrik Selaras Penggajian (Payroll Alignment)
    status VARCHAR(30) NOT NULL DEFAULT 'absent' 
        CHECK (status IN ('absent', 'present', 'late', 'half_day', 'on_leave')),
    late_minutes INT NOT NULL DEFAULT 0,
    overtime_minutes INT NOT NULL DEFAULT 0,
    total_work_minutes INT NOT NULL DEFAULT 0,
    net_work_hours NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    break_duration_minutes INT DEFAULT 60,
    
    -- Geolokasi & Keselamatan
    location VARCHAR(255),
    ip_address VARCHAR(45),
    
    -- Kawalan Integriti Penggajian
    is_locked_for_payroll BOOLEAN NOT NULL DEFAULT FALSE,
    locked_by VARCHAR(36) REFERENCES users(id),
    locked_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- CONSTRAINT: Karyawan HANYA boleh ada 1 rekod per hari
    CONSTRAINT uq_employee_attendance_date UNIQUE (employee_id, attendance_date)
);

-- Indeks untuk kelajuan kueri penggajian kitaran 26-25
CREATE INDEX idx_attendances_emp_date ON attendances(employee_id, attendance_date);
CREATE INDEX idx_attendances_date ON attendances(attendance_date);
CREATE INDEX idx_attendances_payroll_cycle ON attendances(attendance_date, is_locked_for_payroll);

-- 5. TABEL PENGGAJIAN BULANAN (PAYROLL RECORD & FORMULA STATUTORI)
CREATE TABLE payroll_runs (
    id VARCHAR(36) PRIMARY KEY,
    employee_id VARCHAR(36) NOT NULL REFERENCES employees(id),
    period_month INT NOT NULL,              -- 1 - 12
    period_year INT NOT NULL,               -- e.g. 2026
    cycle_start_date DATE NOT NULL,         -- 26hb bulan lepas
    cycle_end_date DATE NOT NULL,           -- 25hb bulan semasa
    
    -- Ringkasan Kehadiran
    present_days INT NOT NULL DEFAULT 0,
    total_late_minutes INT NOT NULL DEFAULT 0,
    total_overtime_minutes INT NOT NULL DEFAULT 0,
    total_work_hours NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    
    -- Kiraan Kewangan Selaras Absensi
    base_salary NUMERIC(12,2) NOT NULL,
    late_deduction NUMERIC(10,2) NOT NULL DEFAULT 0.00,   -- (late_minutes / 60) * hourly_rate
    overtime_pay NUMERIC(10,2) NOT NULL DEFAULT 0.00,     -- (overtime_minutes / 60) * 1.5 * hourly_rate
    gross_salary NUMERIC(12,2) NOT NULL,
    
    -- Potongan Statutori Malaysia (Akta KWSP, SOCSO, EIS & PCB)
    kwsp_employee NUMERIC(10,2) NOT NULL DEFAULT 0.00,   -- 11%
    kwsp_employer NUMERIC(10,2) NOT NULL DEFAULT 0.00,   -- 12% / 13%
    socso_employee NUMERIC(10,2) NOT NULL DEFAULT 0.00,  -- 0.5%
    socso_employer NUMERIC(10,2) NOT NULL DEFAULT 0.00,  -- 1.75%
    eis_employee NUMERIC(10,2) NOT NULL DEFAULT 0.00,    -- 0.2%
    eis_employer NUMERIC(10,2) NOT NULL DEFAULT 0.00,    -- 0.2%
    pcb_tax NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    
    net_salary NUMERIC(12,2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,
    processed_by VARCHAR(36) REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
`;
