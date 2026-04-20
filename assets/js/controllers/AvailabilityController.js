/**
 * Controller: AvailabilityController
 * Calcula y renderiza la disponibilidad de salones por bloque, fecha y franja.
 */
const AvailabilityController = {
  /**
   * Determina el estado de un salón en una fecha/franja determinada.
   * @param {Room} room
   * @param {Reservation[]} reservations
   * @param {string} date
   * @param {string} time
   * @returns {{ label: string, type: string }}
   */
  getRoomStatus(room, reservations, date, time) {
    if (!room.isActive()) return { label: 'Inactivo', type: 'warning' };
    const occupied = reservations.some(r => r.matchesSlot(room.name, date, time));
    return occupied
      ? { label: 'Ocupado', type: 'error' }
      : { label: 'Disponible', type: 'success' };
  },

  /**
   * Renderiza las tarjetas de disponibilidad en el grid del DOM.
   * @param {HTMLElement} gridEl
   * @param {Room[]} rooms
   * @param {Reservation[]} reservations
   * @param {string} block
   * @param {string} date
   * @param {string} time
   */
  renderGrid(gridEl, rooms, reservations, block, date, time) {
    const filtered = rooms.filter(r => r.block === block);
    gridEl.innerHTML = filtered.map(room => {
      const status = this.getRoomStatus(room, reservations, date, time);
      return `
        <article class="room-card">
          <header>
            <div>
              <strong>${room.name}</strong>
              <p style="font-size: var(--text-sm); color: var(--color-text-muted);">
                Bloque ${room.block} · ${room.capacity} puestos
              </p>
            </div>
            <span class="pill ${status.type}">${status.label}</span>
          </header>
          <p style="font-size: var(--text-sm); color: var(--color-text-muted);">
            Consulta para ${date} en la franja ${time}.
          </p>
        </article>`;
    }).join('');
    return filtered.length;
  },
};
