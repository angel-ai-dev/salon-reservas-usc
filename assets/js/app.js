/**
 * app.js — Bootstrap del sistema de reservas USC
 * Arquitectura: MVC + Patrón Facade (ReservationFacade)
 */

const today   = new Date();
const maxDate = new Date();
maxDate.setDate(today.getDate() + 15);

const fmtDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const TODAY_STR    = fmtDate(today);
const MAX_DATE_STR = fmtDate(maxDate);

const TIME_SLOTS = [
  '07:00 - 09:00',
  '09:00 - 11:00',
  '11:00 - 13:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
];

const BLOCKS = ['1', '2', '3', '4'];

// ---------------------------------------------------------------------------
// Datos base
// ---------------------------------------------------------------------------
const ROOMS_DATA = [
  { id: 1, name: '1-201', block: '1', capacity: 35, active: true  },
  { id: 2, name: '1-204', block: '1', capacity: 40, active: true  },
  { id: 3, name: '2-101', block: '2', capacity: 28, active: true  },
  { id: 4, name: '2-203', block: '2', capacity: 32, active: true  },
  { id: 5, name: '3-105', block: '3', capacity: 25, active: true  },
  { id: 6, name: 'Lab-4', block: '4', capacity: 20, active: false },
];

const SAMPLE_RESERVATIONS = [
  { id: 1, student: 'Angel', code: '20261234', block: '1', room: '1-204', date: TODAY_STR,                                                                    time: '09:00 - 11:00' },
  { id: 2, student: 'Angel', code: '20261234', block: '2', room: '2-101', date: fmtDate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)), time: '14:00 - 16:00' },
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

function updateStats() {
  els.statReservations.textContent = ReservationController.count();
  els.statRooms.textContent        = RoomController.getAll().length;
}

// ---------------------------------------------------------------------------
// Vista previa
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
  const block = els.filterBlock.value || '1';
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

  els.filterBlock.value  = '1';
  els.reserveBlock.value = '1';

  [els.filterDate, els.reserveDate].forEach(input => {
    input.min   = TODAY_STR;
    input.max   = MAX_DATE_STR;
    input.value = TODAY_STR;
  });

  RoomController.syncSelect(els.reserveRoom, '1');
  els.reserveRoom.value = '1-201';
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
    const room = RoomController.toggleByName('1-201');
    RoomController.renderTable(els.roomsTable);
    renderAvailability();
    RoomController.syncSelect(els.reserveRoom, els.reserveBlock.value);
    showFeedback(els.roomsFeedback,
      room.active ? 'success' : 'warning',
      `El salón 1-201 ahora está ${room.active ? 'activo' : 'inactivo'}.`
    );
    updateStats();
  });

  document.getElementById('fillDemo').addEventListener('click', () => {
    els.reserveBlock.value = '3';
    RoomController.syncSelect(els.reserveRoom, '3');
    els.reserveRoom.value = '3-105';
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

  document.querySelectorAll('.nav button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.nav button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.target).scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  [els.reserveBlock, els.reserveRoom, els.reserveDate, els.reserveTime,
   els.studentName, els.studentCode].forEach(el => {
    el.addEventListener('input',  updatePreview);
    el.addEventListener('change', updatePreview);
  });

  els.reserveBlock.addEventListener('change', () => {
    RoomController.syncSelect(els.reserveRoom, els.reserveBlock.value);
    updatePreview();
  });

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
