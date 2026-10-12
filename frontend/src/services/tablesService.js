// Restaurant Dining Tables Storage & Sync Service

const STORAGE_KEY = 'hms_dining_tables';
const EVENT_NAME = 'hms_tables_updated';

export const DEFAULT_TABLES = [
  { id: 't-1', code: 'T-01', name: 'Table 01', capacity: 4, section: 'Main Dining', status: 'available' },
  { id: 't-2', code: 'T-02', name: 'Table 02', capacity: 2, section: 'Main Dining', status: 'available' },
  { id: 't-3', code: 'T-03', name: 'Table 03', capacity: 4, section: 'Main Dining', status: 'available' },
  { id: 't-4', code: 'T-04', name: 'Table 04', capacity: 6, section: 'Main Dining', status: 'occupied' },
  { id: 't-5', code: 'T-05', name: 'Table 05', capacity: 4, section: 'Family AC', status: 'available' },
  { id: 't-6', code: 'T-06', name: 'Table 06', capacity: 6, section: 'Family AC', status: 'available' },
  { id: 't-7', code: 'T-07', name: 'Table 07', capacity: 2, section: 'Outdoor Terrace', status: 'available' },
  { id: 't-8', code: 'T-08', name: 'Table 08', capacity: 8, section: 'VIP Lounge', status: 'available' },
];

/**
 * Get all tables from localStorage or default seed
 */
export function getTables() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TABLES));
      return DEFAULT_TABLES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_TABLES;
  } catch (err) {
    console.error('Failed to load dining tables:', err);
    return DEFAULT_TABLES;
  }
}

/**
 * Save tables list and notify listeners
 */
export function saveTables(tables) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tables));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: tables }));
  } catch (err) {
    console.error('Failed to save dining tables:', err);
  }
}

/**
 * Add a new table
 */
export function addTable(tableData) {
  const tables = getTables();
  const newTable = {
    id: `t-${Date.now()}`,
    code: tableData.code?.trim().toUpperCase() || `T-${String(tables.length + 1).padStart(2, '0')}`,
    name: tableData.name?.trim() || tableData.code?.trim() || `Table ${tables.length + 1}`,
    capacity: Number(tableData.capacity) || 4,
    section: tableData.section || 'Main Dining',
    status: tableData.status || 'available',
    created_at: new Date().toISOString(),
  };

  const updated = [...tables, newTable];
  saveTables(updated);
  return newTable;
}

/**
 * Update an existing table
 */
export function updateTable(id, updates) {
  const tables = getTables();
  const updated = tables.map(t => {
    if (t.id === id || t.code === id) {
      return { 
        ...t, 
        ...updates,
        code: updates.code ? updates.code.trim().toUpperCase() : t.code
      };
    }
    return t;
  });
  saveTables(updated);
  return updated.find(t => t.id === id || t.code === id);
}

/**
 * Delete a table
 */
export function deleteTable(id) {
  const tables = getTables();
  const filtered = tables.filter(t => t.id !== id && t.code !== id);
  saveTables(filtered);
  return filtered;
}

/**
 * Update table status (available, occupied, reserved)
 */
export function setTableStatus(codeOrId, status) {
  const tables = getTables();
  const updated = tables.map(t => {
    if (t.id === codeOrId || t.code.toUpperCase() === String(codeOrId).toUpperCase()) {
      return { ...t, status };
    }
    return t;
  });
  saveTables(updated);
}

/**
 * Subscribe to table changes across components and browser tabs
 */
export function onTablesChange(callback) {
  const handleLocal = (e) => {
    callback(e.detail || getTables());
  };
  const handleStorage = (e) => {
    if (e.key === STORAGE_KEY) {
      callback(getTables());
    }
  };

  window.addEventListener(EVENT_NAME, handleLocal);
  window.addEventListener('storage', handleStorage);

  return () => {
    window.removeEventListener(EVENT_NAME, handleLocal);
    window.removeEventListener('storage', handleStorage);
  };
}
