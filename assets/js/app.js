/**
 * app.js — Bootstrap del sistema de reservas USC
 * Arquitectura: MVC + Patrón Facade (ReservationFacade)
 *
 * Flujo de inicialización:
 * 1. Datos base (salones, reservas de muestra)
 * 2. Configuración de fechas y franjas
 * 3. Init de controllers
 * 4. Render inicial de todas las vistas
 * 5. Binding de eventos de la UI
 */

// ---------------------------------------------------------------------------
// Configuración global
// ---------------------------------------------------------------------------
const today   = new Date();
const maxDate = new Date();
maxDate.setDate(today.getDate() + 15);

const fmtDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TODAY_STR   = fmtDate(today);
const MAX_DATE_STR = fmtDate(maxDate);

const TIME_SLOTS = [
  '07:00 - 09:00',
  '09:00 - 11:00',
  '11:00 - 13:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
];

const BLOCKS = ['A', 'B', 'C', 'D'];

// ---------------------------------------------------------------------------
// Datos base
// ---------------------------------------------------------------------------
const ROOMS_DATA = [
  { id: 1, name: 'A-201', block: 'A', capacity: 35, active: true  },
  { id: 2, name: 'A-204', block: 'A', capacity: 40, active: true  },
  { id: 3, name: 'B-101', block: 'B', capacity: 28, active: true  },
  { id: 4, name: 'B-203', block: 'B', capacity: 32, active: true  },
  { id: 5, name: 'C-105', block: 'C', capacity: 25, active: true  },
  { id: 6, name: 'Lab-D1', block: 'D', capacity: 20, active: false },
];

const SAMPLE_RESERVATIONS = [
  { id: 1, student: 'Ange', code: '20261234', block: 'A', room: 'A-204', date: TODAY_STR,                                                                    time: '09:00 - 11:00' },
  { id: 2, student: 'Ange', code: '20261234', block: 'B', room: 'B-101', date: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)), time: '14:00 - 16:00' },
];

// ---------------------------------------------------------------------------
// Referencias al DOM
// ---------------------------------------------------------------------------
const els = {
  filterBlock:          document.getElementById('filterBlock'),
  filterDate:           document.getElementById('filterDate'),
  filterTime:           document.getElementById('filterTime'),
  reserveBlock:         document.getElementById('reserveBlock'),
  reserveRoom:          document.getElementById('reserveRoom'),
  reserveDate:          document.getElementById('reserveDate'),
  reserveTime:          document.getElementById('reserveTime'),
  studentName:          document.getElementById('studentName'),
  studentCode:          document.getElementById('studentCode'),
  availabilityGrid:     document.getElementById('availabilityGrid'),
  availabilityFeedback: document.getElementById('availabilityFeedback'),
  reservationFeedback:  document.getElementById('reservationFeedback'),
  cancelFeedback:       document.getElementById('cancelFeedback'),
  reservationList:      document.getElementById('reservationList'),
  roomsTable:           document.getElementById('roomsTable'),
  roomsFeedback:        document.getElementById('roomsFeedback'),
  reservationPreview:   document.getElementById('reservationPreview'),
  statReservations:     document.getElementById('statReservations'),
  statRooms:            document.getElementById('statRooms'),
};

// ---------------------------------------------------------------------------
// Helpers de UI
// ---------------------------------------------------------------------------
function fillSelect(selectEl, values, placeholder) {
  selectEl.innerHTML = '';
  if (placeholder) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    selectEl.appendChild(opt);
  }
  values.forEach(value => {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = value;
    selectEl.appendChild(opt);
  });
}

function showFeedback(el, type, message) {
  el.className = `feedback visible ${type}`;
  el.textContent = message;
}

function clearFeedback(el) {
  el.className = 'feedback';
  el.textContent = '';
}

// ---------------------------------------------------------------------------
// Actualización de stats del hero
// ---------------------------------------------------------------------------
function updateStats() {
  els.statReservations.textContent = ReservationController.count();
  els.statRooms.textContent        = RoomController.getAll().length;
}

// ---------------------------------------------------------------------------
// Vista previa de reserva
// ---------------------------------------------------------------------------
function getFormData() {
  return {
    student: els.studentName.value.trim(),
    code:    els.studentCode.value.trim(),
    block:   els.reserveBlock.value,
    room:    els.reserveRoom.value,
    date:    els.reserveDate.value,
    time:    els.reserveTime.value,
  };
}

function updatePreview() {
  const data = getFormData();
  if (!data.block || !data.room || !data.date || !data.time) {
    els.reservationPreview.classList.remove('visible');
    return;
  }
  els.reservationPreview.classList.add('visible');
  els.reservationPreview.innerHTML = `
    <strong>Vista previa de reserva</strong>
    <p>${data.student || 'Estudiante'} reservará el salón
    <strong>${data.room}</strong> del bloque <strong>${data.block}</strong>
    para el día <strong>${data.date}</strong>
    en el horario <strong>${data.time}</strong>.</p>`;
}

// ---------------------------------------------------------------------------
// Acciones principales
// ---------------------------------------------------------------------------
function renderAvailability() {
  const block = els.filterBlock.value || 'A';
  const date  = els.filterDate.value  || TODAY_STR;
  const time  = els.filterTime.value  || TIME_SLOTS[0];
  const count = AvailabilityController.renderGrid(
    els.availabilityGrid,
    RoomController.getAll(),
    ReservationController.reservations,
    block, date, time
  );
  showFeedback(els.availabilityFeedback, 'success',
    `Consulta completada: ${count} salones revisados en el bloque ${block}.`);
}

function createReservation() {
  clearFeedback(els.reservationFeedback);
  const result = ReservationController.create(
    getFormData(),
    RoomController.getAll(),
    TODAY_STR,
    MAX_DATE_STR,
    TIME_SLOTS
  );
  showFeedback(els.reservationFeedback, result.type, result.message);
  if (result.ok) {
    renderAvailability();
    renderReservationList();
    updateStats();
  }
}

function cancelReservation(id) {
  clearFeedback(els.cancelFeedback);
  const result = ReservationController.cancel(id, els.studentCode.value.trim());
  showFeedback(els.cancelFeedback, result.type, result.message);
  renderAvailability();
  renderReservationList();
  updateStats();
}

function renderReservationList() {
  ReservationController.renderList(
    els.reservationList,
    els.studentCode.value.trim(),
    cancelReservation
  );
}

// ---------------------------------------------------------------------------
// Setup inicial
// ---------------------------------------------------------------------------
function setupSelects() {
  fillSelect(els.filterBlock, BLOCKS);
  fillSelect(els.reserveBlock, BLOCKS);
  fillSelect(els.filterTime, TIME_SLOTS);
  fillSelect(els.reserveTime, TIME_SLOTS);

  els.filterBlock.value = 'A';
  els.reserveBlock.value = 'A';

  [els.filterDate, els.reserveDate].forEach(input => {
    input.min   = TODAY_STR;
    input.max   = MAX_DATE_STR;
    input.value = TODAY_STR;
  });

  RoomController.syncSelect(els.reserveRoom, 'A');
  els.reserveRoom.value = 'A-201';
  els.reserveTime.value = '07:00 - 09:00';
  updatePreview();
}

// ---------------------------------------------------------------------------
// Binding de eventos
// ---------------------------------------------------------------------------
function bindEvents() {
  document.getElementById('checkAvailability').addEventListener('click', renderAvailability);
  document.getElementById('createReservation').addEventListener('click', createReservation);

  document.getElementById('toggleRoom').addEventListener('click', () => {
    const room = RoomController.toggleByName('A-201');
    RoomController.renderTable(els.roomsTable);
    renderAvailability();
    RoomController.syncSelect(els.reserveRoom, els.reserveBlock.value);
    showFeedback(els.roomsFeedback,
      room.active ? 'success' : 'warning',
      `El salón A-201 ahora está ${room.active ? 'activo' : 'inactivo'}.`
    );
    updateStats();
  });

  document.getElementById('fillDemo').addEventListener('click', () => {
    els.reserveBlock.value = 'C';
    RoomController.syncSelect(els.reserveRoom, 'C');
    els.reserveRoom.value = 'C-105';
    els.reserveDate.value = fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2));
    els.reserveTime.value = '11:00 - 13:00';
    updatePreview();
    showFeedback(els.reservationFeedback, 'success', 'Ejemplo cargado. Ahora puedes confirmar la reserva.');
  });

  document.getElementById('quickReserve').addEventListener('click', () => {
    document.getElementById('reserva').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('fillDemo').click();
  });

  document.getElementById('goToRooms').addEventListener('click', () => {
    document.getElementById('disponibilidad').scrollIntoView({ behavior: 'smooth' });
  });

  // Nav lateral
  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Actualización en tiempo real de la vista previa
  [els.reserveBlock, els.reserveRoom, els.reserveDate, els.reserveTime,
   els.studentName, els.studentCode].forEach(el => {
    el.addEventListener('input',  updatePreview);
    el.addEventListener('change', updatePreview);
  });

  els.reserveBlock.addEventListener('change', () => {
    RoomController.syncSelect(els.reserveRoom, els.reserveBlock.value);
    updatePreview();
  });

  // Toggle de tema
  document.querySelector('[data-theme-toggle]').addEventListener('click', () => {
    const root  = document.documentElement;
    const theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', theme);
  });
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  RoomController.init(ROOMS_DATA);
  ReservationController.init(SAMPLE_RESERVATIONS);

  setupSelects();
  renderAvailability();
  renderReservationList();
  RoomController.renderTable(els.roomsTable);
  updateStats();
  bindEvents();

  lucide.createIcons();
});
