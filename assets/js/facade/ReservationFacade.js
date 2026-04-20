/**
 * Facade: ReservationFacade
 * 
 * Patrón de diseño Facade — centraliza y coordina toda la lógica
 * interna del proceso de reserva: validación de horario, verificación
 * de disponibilidad, límite de reservas activas, registro y cancelación.
 *
 * Desde la interfaz solo se invoca `create()` o `cancel()` —
 * el Facade orquesta todos los subsistemas internamente.
 */
const ReservationFacade = {
  /**
   * Valida todas las reglas de negocio antes de crear una reserva.
   * @param {Object} data - Datos del formulario de reserva.
   * @param {Reservation[]} reservations - Lista actual de reservas.
   * @param {Room[]} rooms - Catálogo de salones.
   * @param {string} todayStr - Fecha mínima permitida (YYYY-MM-DD).
   * @param {string} maxDateStr - Fecha máxima permitida (YYYY-MM-DD).
   * @param {string[]} timeSlots - Franjas horarias permitidas.
   * @returns {{ ok: boolean, type?: string, message?: string }}
   */
  _validate(data, reservations, rooms, todayStr, maxDateStr, timeSlots) {
    // 1. Campos completos
    if (!data.student || !data.code || !data.block || !data.room || !data.date || !data.time) {
      return { ok: false, type: 'warning', message: 'Completa todos los campos para crear la reserva.' };
    }

    // 2. Rango de fecha (máx 15 días)
    const selectedDate = new Date(data.date + 'T00:00:00');
    const minDate = new Date(todayStr + 'T00:00:00');
    const limitDate = new Date(maxDateStr + 'T00:00:00');
    if (selectedDate < minDate || selectedDate > limitDate) {
      return { ok: false, type: 'warning', message: 'La fecha debe estar dentro del rango permitido de 15 días.' };
    }

    // 3. Horario permitido
    if (!timeSlots.includes(data.time)) {
      return { ok: false, type: 'warning', message: 'El horario seleccionado no está permitido.' };
    }

    // 4. Salón activo
    const room = rooms.find(r => r.name === data.room);
    if (!room || !room.isActive()) {
      return { ok: false, type: 'error', message: 'El salón no está disponible porque está inactivo.' };
    }

    // 5. Disponibilidad del salón (no duplicidad)
    const duplicate = reservations.some(r => r.matchesSlot(data.room, data.date, data.time));
    if (duplicate) {
      return { ok: false, type: 'error', message: 'El salón ya está ocupado en ese horario.' };
    }

    // 6. Límite de reservas activas por estudiante (máx 3)
    const activeByStudent = reservations.filter(r => r.code === data.code).length;
    if (activeByStudent >= 3) {
      return { ok: false, type: 'warning', message: 'No puedes reservar porque ya tienes 3 reservas activas.' };
    }

    // 7. Estudiante no puede tener dos reservas en la misma franja
    const sameSlot = reservations.some(r => r.matchesStudentSlot(data.code, data.date, data.time));
    if (sameSlot) {
      return { ok: false, type: 'warning', message: 'Ya tienes una reserva en esa misma franja horaria.' };
    }

    return { ok: true };
  },

  /**
   * Crea una reserva tras pasar todas las validaciones.
   * @param {Object} data
   * @param {Reservation[]} reservations
   * @param {Room[]} rooms
   * @param {string} todayStr
   * @param {string} maxDateStr
   * @param {string[]} timeSlots
   * @returns {{ ok: boolean, type: string, message: string, reservation?: Reservation }}
   */
  create(data, reservations, rooms, todayStr, maxDateStr, timeSlots) {
    const validation = this._validate(data, reservations, rooms, todayStr, maxDateStr, timeSlots);
    if (!validation.ok) return validation;

    const newReservation = new Reservation({ id: Date.now(), ...data });
    reservations.unshift(newReservation);

    return {
      ok: true,
      type: 'success',
      message: `Reserva realizada con éxito: ${data.room} — ${data.time}.`,
      reservation: newReservation,
    };
  },

  /**
   * Cancela una reserva validando que pertenezca al estudiante.
   * @param {number} id
   * @param {string} studentCode
   * @param {Reservation[]} reservations
   * @returns {{ ok: boolean, type: string, message: string }}
   */
  cancel(id, studentCode, reservations) {
    const index = reservations.findIndex(r => r.id === id);
    if (index === -1) return { ok: false, type: 'error', message: 'La reserva ya no existe.' };
    if (!reservations[index].belongsTo(studentCode)) {
      return { ok: false, type: 'error', message: 'Solo puedes cancelar tus propias reservas.' };
    }
    const removed = reservations.splice(index, 1)[0];
    return {
      ok: true,
      type: 'success',
      message: `Reserva cancelada: ${removed.room} — ${removed.time}.`,
    };
  },
};
