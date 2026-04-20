/**
 * Model: Room
 * Representa un salón académico del catálogo.
 */
class Room {
  constructor({ id, name, block, capacity, active = true }) {
    this.id = id;
    this.name = name;
    this.block = block;
    this.capacity = capacity;
    this.active = active;
  }

  toggleStatus() {
    this.active = !this.active;
  }

  isActive() {
    return this.active;
  }

  toTableRow() {
    return {
      name: this.name,
      block: `Bloque ${this.block}`,
      capacity: this.capacity,
      status: this.active ? 'Activo' : 'Inactivo',
    };
  }
}
