/**
 * Recommendation Rules Database Service
 * 
 * Manages recommendation rules stored in SQLite database
 * Uses JSON columns for flexible condition and recommendation storage
 */

const Database = require('better-sqlite3');
const path = require('path');

// Database path (from dist/astrology/database or src/astrology/database)
const DB_PATH = path.join(__dirname, '..', '..', '..', 'data', 'astrology', 'recommendation-rules.db');

let db = null;

/**
 * Initialize database connection and create tables if needed
 */
function init() {
  if (!db) {
    db = new Database(DB_PATH);
    
    // Enable WAL mode for better performance
    db.pragma('journal_mode = WAL');
    
    // Create tables if they don't exist
    createTables();
  }
  return db;
}

/**
 * Create recommendation_rules table
 */
function createTables() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS recommendation_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_type TEXT NOT NULL CHECK(rule_type IN ('planet_based', 'dosha_based', 'yoga_based', 'house_based', 'combination', 'nakshatra_based', 'mahadasha_based')),
      category TEXT NOT NULL CHECK(category IN ('overall', 'wealth', 'health', 'mental_wellbeing', 'relationship', 'career', 'spiritual', 'study')),
      conditions TEXT NOT NULL, -- JSON string
      recommendations TEXT NOT NULL, -- JSON string
      priority INTEGER NOT NULL DEFAULT 50 CHECK(priority >= 1 AND priority <= 100),
      is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0, 1)),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  db.exec(createTableSQL);
  
  // Create indexes for efficient querying
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_category_active_priority 
    ON recommendation_rules(category, is_active, priority DESC)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_rule_type_active 
    ON recommendation_rules(rule_type, is_active)
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_active_priority 
    ON recommendation_rules(is_active, priority DESC)
  `);
}

/**
 * Get all active rules for a category, sorted by priority
 */
function getRulesByCategory(category) {
  init();
  
  const stmt = db.prepare(`
    SELECT * FROM recommendation_rules 
    WHERE category = ? AND is_active = 1 
    ORDER BY priority DESC
  `);
  
  const rules = stmt.all(category);
  
  // Parse JSON fields
  return rules.map(rule => ({
    ...rule,
    conditions: JSON.parse(rule.conditions),
    recommendations: JSON.parse(rule.recommendations),
    is_active: Boolean(rule.is_active)
  }));
}

/**
 * Get rule by ID
 */
function getRuleById(id) {
  init();
  
  const stmt = db.prepare('SELECT * FROM recommendation_rules WHERE id = ?');
  const rule = stmt.get(id);
  
  if (!rule) return null;
  
  return {
    ...rule,
    conditions: JSON.parse(rule.conditions),
    recommendations: JSON.parse(rule.recommendations),
    is_active: Boolean(rule.is_active)
  };
}

/**
 * Create a new rule
 */
function createRule(ruleData) {
  init();
  
  const stmt = db.prepare(`
    INSERT INTO recommendation_rules 
    (rule_type, category, conditions, recommendations, priority, is_active, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    ruleData.ruleType,
    ruleData.category,
    JSON.stringify(ruleData.conditions),
    JSON.stringify(ruleData.recommendations),
    ruleData.priority || 50,
    ruleData.isActive !== undefined ? (ruleData.isActive ? 1 : 0) : 1,
    ruleData.description || null
  );
  
  return getRuleById(result.lastInsertRowid);
}

/**
 * Update a rule
 */
function updateRule(id, ruleData) {
  init();
  
  const updates = [];
  const values = [];
  
  if (ruleData.ruleType !== undefined) {
    updates.push('rule_type = ?');
    values.push(ruleData.ruleType);
  }
  if (ruleData.category !== undefined) {
    updates.push('category = ?');
    values.push(ruleData.category);
  }
  if (ruleData.conditions !== undefined) {
    updates.push('conditions = ?');
    values.push(JSON.stringify(ruleData.conditions));
  }
  if (ruleData.recommendations !== undefined) {
    updates.push('recommendations = ?');
    values.push(JSON.stringify(ruleData.recommendations));
  }
  if (ruleData.priority !== undefined) {
    updates.push('priority = ?');
    values.push(ruleData.priority);
  }
  if (ruleData.isActive !== undefined) {
    updates.push('is_active = ?');
    values.push(ruleData.isActive ? 1 : 0);
  }
  if (ruleData.description !== undefined) {
    updates.push('description = ?');
    values.push(ruleData.description);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`
    UPDATE recommendation_rules 
    SET ${updates.join(', ')}
    WHERE id = ?
  `);
  
  stmt.run(...values);
  
  return getRuleById(id);
}

/**
 * Delete a rule (soft delete by setting is_active = 0)
 */
function deleteRule(id) {
  init();
  
  const stmt = db.prepare('UPDATE recommendation_rules SET is_active = 0 WHERE id = ?');
  stmt.run(id);
  
  return true;
}

/**
 * Get all rules (for admin purposes)
 */
function getAllRules() {
  init();
  
  const stmt = db.prepare('SELECT * FROM recommendation_rules ORDER BY category, priority DESC');
  const rules = stmt.all();
  
  return rules.map(rule => ({
    ...rule,
    conditions: JSON.parse(rule.conditions),
    recommendations: JSON.parse(rule.recommendations),
    is_active: Boolean(rule.is_active)
  }));
}

module.exports = {
  init,
  getRulesByCategory,
  getRuleById,
  createRule,
  updateRule,
  deleteRule,
  getAllRules
};
