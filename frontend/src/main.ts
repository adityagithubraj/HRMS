import './style.css'

type Employee = {
  id: string
  employee_id: string
  full_name: string
  email: string
  department: string
}

type AttendanceRecord = {
  id: string
  employee_id: string
  date: string
  status: 'Present' | 'Absent'
}

type AttendanceSummary = {
  employee_id: string
  full_name: string
  total_present: number
  total_absent: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'

const appEl = document.querySelector<HTMLDivElement>('#app')!

const state = {
  employees: [] as Employee[],
  attendance: [] as AttendanceRecord[],
  summaries: [] as AttendanceSummary[],
  loading: false,
  error: '' as string | null,
  activeTab: 'employees' as 'employees' | 'attendance',
  employeeModalOpen: false,
  attendanceModalOpen: false,
}

function setState(partial: Partial<typeof state>) {
  Object.assign(state, partial)
  render()
}

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  })

  if (!res.ok) {
    const text = await res.text()
    let message = 'Unexpected error'
    try {
      const data = JSON.parse(text) as { detail?: string }
      if (data.detail) message = data.detail
    } catch {
      message = text || message
    }
    throw new Error(message)
  }

  // For 204 No Content responses (e.g. delete), don't try to parse JSON.
  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}

async function loadEmployees() {
  setState({ loading: true, error: null })
  try {
    const data = await fetchJson<Employee[]>('/employees')
    setState({ employees: data })
  } catch (err) {
    setState({ error: (err as Error).message })
  } finally {
    setState({ loading: false })
  }
}

async function loadAttendance() {
  setState({ loading: true, error: null })
  try {
    const [records, summaries] = await Promise.all([
      fetchJson<AttendanceRecord[]>('/attendance'),
      fetchJson<AttendanceSummary[]>('/attendance/summary'),
    ])
    setState({ attendance: records, summaries })
  } catch (err) {
    setState({ error: (err as Error).message })
  } finally {
    setState({ loading: false })
  }
}

async function handleAddEmployee(e: SubmitEvent) {
  e.preventDefault()
  const form = e.target as HTMLFormElement
  const formData = new FormData(form)
  const payload = {
    employee_id: String(formData.get('employee_id') ?? '').trim(),
    full_name: String(formData.get('full_name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    department: String(formData.get('department') ?? '').trim(),
  }

  if (!payload.employee_id || !payload.full_name || !payload.email || !payload.department) {
    setState({ error: 'All fields are required' })
    return
  }

  setState({ loading: true, error: null })
  try {
    await fetchJson<Employee>('/employees', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    form.reset()
    await loadEmployees()
    setState({ employeeModalOpen: false })
  } catch (err) {
    setState({ error: (err as Error).message })
  } finally {
    setState({ loading: false })
  }
}

async function handleDeleteEmployee(employeeId: string) {
  if (!confirm('Are you sure you want to delete this employee?')) {
    return
  }
  setState({ loading: true, error: null })
  try {
    await fetchJson<void>(`/employees/${encodeURIComponent(employeeId)}`, {
      method: 'DELETE',
    })
    await Promise.all([loadEmployees(), loadAttendance()])
  } catch (err) {
    setState({ error: (err as Error).message })
  } finally {
    setState({ loading: false })
  }
}

async function handleMarkAttendance(e: SubmitEvent) {
  e.preventDefault()
  const form = e.target as HTMLFormElement
  const formData = new FormData(form)
  const payload = {
    employee_id: String(formData.get('employee_id') ?? '').trim(),
    date: String(formData.get('date') ?? '').trim(),
    status: String(formData.get('status') ?? '').trim(),
  }

  if (payload.date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const selected = new Date(payload.date)
    selected.setHours(0, 0, 0, 0)
    if (selected.getTime() > today.getTime()) {
      setState({ error: 'Attendance date cannot be in the future' })
      return
    }
  }

  if (!payload.employee_id || !payload.date || !payload.status) {
    setState({ error: 'All fields are required' })
    return
  }

  setState({ loading: true, error: null })
  try {
    await fetchJson<AttendanceRecord>('/attendance', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    form.reset()
    await loadAttendance()
    setState({ attendanceModalOpen: false })
  } catch (err) {
    setState({ error: (err as Error).message })
  } finally {
    setState({ loading: false })
  }
}

function renderEmployeesSection() {
  const hasEmployees = state.employees.length > 0

  const rows = hasEmployees
    ? state.employees
        .map(
          (emp, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${emp.employee_id}</td>
        <td>${emp.full_name}</td>
        <td>${emp.email}</td>
        <td>${emp.department}</td>
        <td class="actions">
          <button class="btn btn-danger" data-action="delete-employee" data-employee-id="${emp.employee_id}">Delete</button>
        </td>
      </tr>
    `,
        )
        .join('')
    : ''

  const leftBlockContent = hasEmployees
    ? `
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Employee ID</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Department</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `
    : `
        <div class="empty-state">
          <p>No employees yet. Use the button above to add your first employee.</p>
        </div>
      `

  const modal = state.employeeModalOpen
    ? `
      <div class="modal-backdrop" data-modal="employee">
        <div class="modal">
          <div class="modal-header">
            <h3>Add Employee</h3>
            <button type="button" class="btn btn-ghost" data-action="close-employee-modal">Close</button>
          </div>
          <div class="modal-body">
            <form id="employee-form" class="form-grid">
              <label>
                <span>Employee ID</span>
                <input name="employee_id" type="text" required placeholder="E.g. EMP001" />
              </label>
              <label>
                <span>Full Name</span>
                <input name="full_name" type="text" required placeholder="Employee full name" />
              </label>
              <label>
                <span>Email</span>
                <input name="email" type="email" required placeholder="employee@company.com" />
              </label>
              <label>
                <span>Department</span>
                <input name="department" type="text" required placeholder="E.g. Engineering" />
              </label>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                  <span class="btn-icon">+</span>
                  <span class="btn-label-strong">Save employee</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
    : ''

  return `
    <div class="panel">
      <div class="panel-header">
        <h2>Employees</h2>
        <p class="panel-subtitle">Manage your employee master data.</p>
      </div>
      <div class="panel-body">
        <div class="panel-block">
          <div class="section-header-row">
            <h3>Employee list</h3>
            <button type="button" class="btn btn-primary" data-action="open-employee-modal">
              <span class="btn-icon">+</span>
              <span class="btn-label-strong">Add employee</span>
            </button>
          </div>
          ${leftBlockContent}
        </div>
      </div>
      ${modal}
    </div>
  `
}

function renderAttendanceSection() {
  const nameByEmployeeId = (id: string) =>
    state.employees.find((e) => e.employee_id === id)?.full_name ?? '-'

  const attendanceRows =
    state.attendance.length === 0
      ? `
        <tr>
          <td colspan="6" class="empty-cell">No attendance records yet.</td>
        </tr>
      `
      : state.attendance
          .map(
            (rec, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${rec.employee_id}</td>
          <td>${nameByEmployeeId(rec.employee_id)}</td>
          <td>${new Date(rec.date).toLocaleDateString()}</td>
          <td>
            <span class="badge badge-${rec.status === 'Present' ? 'success' : 'danger'}">
              ${rec.status}
            </span>
          </td>
        </tr>
      `,
          )
          .join('')

  const summaryRows =
    state.summaries.length === 0
      ? `
        <tr>
          <td colspan="4" class="empty-cell">No summary available yet.</td>
        </tr>
      `
      : state.summaries
          .map(
            (row, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${row.full_name}</td>
          <td>${row.total_present}</td>
          <td>${row.total_absent}</td>
        </tr>
      `,
          )
          .join('')

  const employeeOptions =
    state.employees.length === 0
      ? '<option value="">No employees available</option>'
      : `<option value="">Select employee</option>` +
        state.employees
          .map(
            (emp) => `
      <option value="${emp.employee_id}">
        ${emp.employee_id} - ${emp.full_name}
      </option>
    `,
          )
          .join('')

  const modal = state.attendanceModalOpen
    ? `
      <div class="modal-backdrop" data-modal="attendance">
        <div class="modal">
          <div class="modal-header">
            <h3>Mark Attendance</h3>
            <button type="button" class="btn btn-ghost" data-action="close-attendance-modal">Close</button>
          </div>
          <div class="modal-body">
            <form id="attendance-form" class="form-grid">
              <label>
                <span>Employee</span>
                <select name="employee_id" required>
                  ${employeeOptions}
                </select>
              </label>
              <label>
                <span>Date</span>
                <input name="date" type="date" required data-role="attendance-date" />
              </label>
              <label>
                <span>Status</span>
                <select name="status" required>
                  <option value="">Select status</option>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                </select>
              </label>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">Save Attendance</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `
    : ''

  return `
    <div class="panel">
      <div class="panel-header">
        <h2>Attendance</h2>
        <p class="panel-subtitle">Mark daily attendance and view summaries.</p>
      </div>
      <div class="panel-body">
        <div class="panel-block">
          <div class="attendance-header-row">
            <h3>Today & Recent Records</h3>
            <button type="button" class="btn btn-primary" data-action="open-attendance-modal">
              <span class="btn-icon">+</span>
              <span class="btn-label-strong">Mark attendance</span>
            </button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee ID</th>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${attendanceRows}
            </tbody>
          </table>
          <h3 style="margin-top: 2rem;">Summary by Employee</h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Present Days</th>
                <th>Absent Days</th>
              </tr>
            </thead>
            <tbody>
              ${summaryRows}
            </tbody>
          </table>
        </div>
      </div>
      ${modal}
    </div>
  `
}

function render() {
  const sidebarItems = [
    { id: 'employees', label: 'Employees' },
    { id: 'attendance', label: 'Attendance' },
  ] as const

  const sidebar = sidebarItems
    .map(
      (item) => `
    <button
      class="nav-item ${state.activeTab === item.id ? 'nav-item-active' : ''}"
      data-tab="${item.id}"
    >
      ${item.label}
    </button>
  `,
    )
    .join('')

  const activeSection =
    state.activeTab === 'employees' ? renderEmployeesSection() : renderAttendanceSection()

  appEl.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1>HRMS Lite</h1>
          <p class="sidebar-subtitle">Internal HR console</p>
        </div>
        <nav class="nav">${sidebar}</nav>
      </aside>
      <main class="main">
        <header class="topbar">
          <div>
            <h2 class="topbar-title">${
              state.activeTab === 'employees' ? 'Employee Management' : 'Attendance Management'
            }</h2>
            <p class="topbar-subtitle">
              ${
                state.activeTab === 'employees'
                  ? 'Maintain employee master data and departments.'
                  : 'Track presence and basic attendance statistics.'
              }
            </p>
          </div>
          <div class="topbar-meta">
            <span class="meta-pill">Total employees: ${state.employees.length}</span>
            <span class="meta-pill">Attendance records: ${state.attendance.length}</span>
          </div>
        </header>
        <section class="content">
          ${
            state.error
              ? `<div class="alert alert-error">
                  <span>${state.error}</span>
                </div>`
              : ''
          }
          ${
            state.loading
              ? `<div class="loading-overlay">
                  <div class="spinner"></div>
                  <p>Loading...</p>
                </div>`
              : ''
          }
          ${activeSection}
        </section>
      </main>
    </div>
  `

  // Wire up events after rendering
  const employeeForm = document.querySelector<HTMLFormElement>('#employee-form')
  if (employeeForm) {
    employeeForm.onsubmit = handleAddEmployee
  }

  const attendanceForm = document.querySelector<HTMLFormElement>('#attendance-form')
  if (attendanceForm) {
    attendanceForm.onsubmit = handleMarkAttendance
  }

  const openEmployeeBtn = document.querySelector<HTMLButtonElement>('[data-action="open-employee-modal"]')
  if (openEmployeeBtn) {
    openEmployeeBtn.onclick = () => setState({ employeeModalOpen: true, error: null })
  }

  const closeEmployeeBtn = document.querySelector<HTMLButtonElement>('[data-action="close-employee-modal"]')
  if (closeEmployeeBtn) {
    closeEmployeeBtn.onclick = () => setState({ employeeModalOpen: false })
  }

  const openAttendanceBtn = document.querySelector<HTMLButtonElement>('[data-action="open-attendance-modal"]')
  if (openAttendanceBtn) {
    openAttendanceBtn.onclick = () => setState({ attendanceModalOpen: true, error: null })
  }

  const closeAttendanceBtn = document.querySelector<HTMLButtonElement>('[data-action="close-attendance-modal"]')
  if (closeAttendanceBtn) {
    closeAttendanceBtn.onclick = () => setState({ attendanceModalOpen: false })
  }

  const attendanceDateInput = document.querySelector<HTMLInputElement>('[data-role="attendance-date"]')
  if (attendanceDateInput) {
    const openPicker = () => {
      attendanceDateInput.focus()
      // `showPicker` is supported in modern Chromium-based browsers.
      // Guarded call so it doesn't break on unsupported browsers.
      ;(attendanceDateInput as any).showPicker?.()
    }
    attendanceDateInput.onclick = openPicker
    attendanceDateInput.onfocus = openPicker
  }

  document.querySelectorAll<HTMLButtonElement>('.nav-item').forEach((btn) => {
    btn.onclick = () => {
      const tab = btn.getAttribute('data-tab') as 'employees' | 'attendance'
      if (tab !== state.activeTab) {
        setState({ activeTab: tab, error: null })
        if (tab === 'attendance') {
          void loadAttendance()
        }
      }
    }
  })

  document
    .querySelectorAll<HTMLButtonElement>('[data-action="delete-employee"]')
    .forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute('data-employee-id')
        if (id) {
          void handleDeleteEmployee(id)
        }
      }
    })
}

// Initial load
void (async () => {
  await loadEmployees()
  await loadAttendance()
  render()
})()
