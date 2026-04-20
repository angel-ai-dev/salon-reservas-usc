/**
 * Model: Reservation
 * Representa una reserva registrada en el sistema.
 */
class Reservation {
  constructor({ id, student, code, block, room, date, time }) {
    this.id = id;
    this.student = student;
    this.code = code;
    this.block = block;
    this.room = room;
    this.date = date;
    this.time = time;
  }

  belongsTo(studentCode) {
    return this.code === studentCode;
  }

  matchesSlot(room, date, time) {
    return this.room === room && this.date === date && this.time === time;
  }

  matchesStudentSlot(code, date, time) {
    return this.code === code && this.date === date && this.time === time;
  }

  toDisplayObject() {
    return {
      id: this.id,
      room: this.room,
      block: this.block,
      date: this.date,
      time: this.time,
      student: this.student,
    };
  }
}
