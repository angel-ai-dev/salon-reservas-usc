/**
 * Controller: RoomController
 * Gestiona el catálogo de salones y sincroniza la vista.
 */
const RoomController = {
  rooms: [],

  /**
   * Inicializa el catálogo con datos base.
   */
  init(roomsData) {
    this.rooms = roomsData.map(data => new Room(data));
  },

  /**
   * Devuelve todos los salones.
   */
  getAll() {
    return this.rooms;
  },

  /**
   * Filtra salones por bloque.
   */
  getByBlock(block) {
    return this.rooms.filter(r => r.block === block);
  },

  /**
   * Alterna el estado activo/inactivo de un salón por nombre.
   * @returns {Room|null}
   */
  toggleByName(name) {
    const room = this.rooms.find(r => r.name === name);
    if (!room) return null;
    room.toggleStatus();
    return room;
  },

  /**
   * Renderiza la tabla de salones en el DOM.
   */
  renderTable(tbodyEl) {
    tbodyEl.innerHTML = this.rooms.map(room => {
      const row = room.toTableRow();
      return `
        <tr>
          <td><strong>${row.name}</strong></td>
          <td>${row.block}</td>
          <td>${row.capacity}</td>
          <td>
            <span class="pill ${room.active ? 'success' : 'warning'}">
              ${row.status}
            </span>
          </td>
        </tr>`;
    }).join('');
  },

  /**
   * Sincroniza el select de salones según el bloque elegido.
   */
  syncSelect(selectEl, block, placeholder = 'Selecciona un salón') {
    const filtered = this.getByBlock(block);
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    filtered.forEach(room => {
      const opt = document.createElement('option');
      opt.value = room.name;
      opt.textContent = room.name;
      selectEl.appendChild(opt);
    });
  },
};
