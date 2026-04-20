/**
 * Controller: ReservationController
 * Gestiona el estado de reservas y delega la lógica al Facade.
 */
const ReservationController = {
  reservations: [],

  /**
   * Inicializa con reservas de muestra.
   */
  init(initialData) {
    this.reservations = initialData.map(data => new Reservation(data));
  },

  /**
   * Solicita crear una reserva a través del Facade.
   */
  create(data, rooms, todayStr, maxDateStr, timeSlots) {
    return ReservationFacade.create(
      data,
      this.reservations,
      rooms,
      todayStr,
      maxDateStr,
      timeSlots
    );
  },

  /**
   * Solicita cancelar una reserva a través del Facade.
   */
  cancel(id, studentCode) {
    return ReservationFacade.cancel(id, studentCode, this.reservations);
  },

  /**
   * Devuelve las reservas activas de un estudiante.
   */
  getByCode(code) {
    return this.reservations.filter(r => r.belongsTo(code));
  },

  /**
   * Total de reservas activas en el sistema.
   */
  count() {
    return this.reservations.length;
  },

  /**
   * Renderiza la lista de reservas del estudiante actual.
   */
  renderList(containerEl, studentCode, onCancel) {
    const mine = this.getByCode(studentCode);
    if (!mine.length) {
      containerEl.innerHTML = `
        <div class="room-card">
          <strong>No tienes reservas activas.</strong>
          <p style="font-size: var(--text-sm); color: var(--color-text-muted);">
            Cuando crees una reserva aparecerá aquí.
          </p>
        </div>`;
      return;
    }
    containerEl.innerHTML = mine.map(r => `
      <article class="reservation-item">
        <div>
          <h4>${r.room} · ${r.time}</h4>
          <p>${r.date} · Bloque ${r.block} · Reservado por ${r.student}</p>
        </div>
        <button class="btn-danger" data-cancel-id="${r.id}">
          <i data-lucide="trash-2"></i>Cancelar
        </button>
      </article>`).join('');

    lucide.createIcons();
    containerEl.querySelectorAll('[data-cancel-id]').forEach(btn => {
      btn.addEventListener('click', () => onCancel(Number(btn.dataset.cancelId)));
    });
  },
};
