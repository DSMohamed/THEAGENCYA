const { QuickDB } = require("quick.db");
const db = new QuickDB();

// Economy database operations
class EconomyManager {
  constructor() {
    this.currency = {
      name: "Coins",
      symbol: "💰",
    };

    // Initialize database tables
    this.usersTable = db.table("economy_users");
    this.shopsTable = db.table("economy_shops");
    this.itemsTable = db.table("economy_items");
    this.configTable = db.table("economy_config");
    this.warningsTable = db.table("warnings");
    this.welcomeTable = db.table("welcome_config"); // Added welcome config table

    // Initialize admin roles if they don't exist
    this.initializeConfig();
  }

  // Initialize configuration
  async initializeConfig() {
    const adminRoles = await this.configTable.get("adminRoles");
    if (!adminRoles) {
      await this.configTable.set("adminRoles", []);
    }

    // Initialize display role if it doesn't exist
    const displayRoleId = await this.configTable.get("displayRoleId");
    if (!displayRoleId) {
      await this.configTable.set("displayRoleId", ""); // Use empty string instead of null
    }
  }

  // Welcome system methods
  /**
   * Set welcome configuration for a guild
   * @param {string} guildId - The guild ID
   * @param {string} channelId - The channel ID to send welcome messages to
   * @param {string} title - The welcome message title
   * @param {string} subtitle - The welcome message subtitle
   * @param {string} welcomeMessage - The welcome message content
   * @param {string} logoUrl - URL for the server logo (optional)
   * @returns {Promise<object>} The welcome configuration object
   */
  async setWelcomeConfig(
    guildId,
    channelId,
    title,
    subtitle,
    welcomeMessage,
    logoUrl
  ) {
    const config = {
      channelId,
      title,
      subtitle,
      welcomeMessage,
      logoUrl: logoUrl || null,
      enabled: true,
      timestamp: Date.now(),
    };

    await this.welcomeTable.set(guildId, config);
    return config;
  }

  /**
   * Get welcome configuration for a guild
   * @param {string} guildId - The guild ID
   * @returns {Promise<object|null>} The welcome configuration or null if not configured
   */
  async getWelcomeConfig(guildId) {
    return await this.welcomeTable.get(guildId);
  }

  /**
   * Update welcome message status (enable/disable)
   * @param {string} guildId - The guild ID
   * @param {boolean} status - Whether welcome messages should be enabled
   * @returns {Promise<boolean>} Success status
   */
  async updateWelcomeStatus(guildId, status) {
    const config = await this.getWelcomeConfig(guildId);
    if (!config) return false;

    config.enabled = status;
    await this.welcomeTable.set(guildId, config);
    return true;
  }

  // Warning system methods
  /**
   * Add a warning to a user
   * @param {string} guildId - The guild ID
   * @param {string} userId - The user ID to warn
   * @param {string} moderatorId - The moderator ID who issued the warning
   * @param {string} reason - The reason for the warning
   * @returns {Promise<object>} The warning object with id, timestamp, etc.
   */
  async addWarning(guildId, userId, moderatorId, reason) {
    const key = `${guildId}.${userId}`;
    let userWarnings = (await this.warningsTable.get(key)) || [];

    const warning = {
      id: this.generateWarningId(userWarnings),
      userId,
      moderatorId,
      reason,
      timestamp: Date.now(),
    };

    userWarnings.push(warning);
    await this.warningsTable.set(key, userWarnings);

    return warning;
  }

  /**
   * Get all warnings for a user
   * @param {string} guildId - The guild ID
   * @param {string} userId - The user ID to get warnings for
   * @returns {Promise<Array>} Array of warning objects
   */
  async getWarnings(guildId, userId) {
    const key = `${guildId}.${userId}`;
    return (await this.warningsTable.get(key)) || [];
  }

  /**
   * Remove a specific warning by ID
   * @param {string} guildId - The guild ID
   * @param {string} userId - The user ID
   * @param {string|number} warningId - The warning ID to remove
   * @returns {Promise<boolean>} True if warning was removed, false if not found
   */
  async removeWarning(guildId, userId, warningId) {
    const key = `${guildId}.${userId}`;
    let userWarnings = (await this.warningsTable.get(key)) || [];

    const initialLength = userWarnings.length;
    userWarnings = userWarnings.filter((warning) => warning.id !== warningId);

    if (userWarnings.length !== initialLength) {
      await this.warningsTable.set(key, userWarnings);
      return true;
    }

    return false;
  }

  /**
   * Clear all warnings for a user
   * @param {string} guildId - The guild ID
   * @param {string} userId - The user ID to clear warnings for
   * @returns {Promise<number>} Number of warnings cleared
   */
  async clearWarnings(guildId, userId) {
    const key = `${guildId}.${userId}`;
    const userWarnings = (await this.warningsTable.get(key)) || [];
    const count = userWarnings.length;

    await this.warningsTable.delete(key);
    return count;
  }

  /**
   * Generate a unique warning ID
   * @param {Array} existingWarnings - Array of existing warnings
   * @returns {number} A unique warning ID
   */
  generateWarningId(existingWarnings) {
    if (!existingWarnings || existingWarnings.length === 0) return 1;

    const maxId = Math.max(...existingWarnings.map((w) => w.id));
    return maxId + 1;
  }

  // Admin role management
  async getAdminRoles() {
    return (await this.configTable.get("adminRoles")) || [];
  }

  // Display role management (controls who can see admin commands)
  async getDisplayRoleId() {
    return await this.configTable.get("displayRoleId");
  }

  async setDisplayRoleId(roleId) {
    await this.configTable.set("displayRoleId", roleId);
    return roleId;
  }

  async addAdminRole(roleId) {
    const adminRoles = await this.getAdminRoles();
    if (!adminRoles.includes(roleId)) {
      adminRoles.push(roleId);
      await this.configTable.set("adminRoles", adminRoles);
    }
    return adminRoles;
  }

  async removeAdminRole(roleId) {
    const adminRoles = await this.getAdminRoles();
    const updatedRoles = adminRoles.filter((id) => id !== roleId);
    await this.configTable.set("adminRoles", updatedRoles);
    return updatedRoles;
  }

  // Check if user has admin permissions
  async hasAdminPermission(member) {
    // Always allow specific user ID (permanent admin access)
    if (member.id === "586115567560425473") {
      return true;
    }

    // Always allow server owner
    if (member.id === member.guild.ownerId) {
      return true;
    }

    const adminRoles = await this.getAdminRoles();

    // If no admin roles set, only server owner can use admin commands
    if (adminRoles.length === 0) {
      return false;
    }

    // Check if user has any of the admin roles
    return member.roles.cache.some((role) => adminRoles.includes(role.id));
  }

  // User balance operations
  async getBalance(userId, username = null) {
    // Store username if provided
    if (username) {
      await this.storeUsername(userId, username);
    }

    const balance = await this.usersTable.get(`${userId}.balance`);
    return balance || 0;
  }

  async setBalance(userId, amount, username = null) {
    // Store username if provided
    if (username) {
      await this.storeUsername(userId, username);
    }

    await this.usersTable.set(`${userId}.balance`, amount);
    return amount;
  }

  /**
   * Store a user's username in the database
   * @param {string} userId - The Discord user ID
   * @param {string} username - The username to store
   * @returns {Promise<void>}
   */
  async storeUsername(userId, username) {
    await this.usersTable.set(`${userId}.username`, username);
  }

  /**
   * Get a user's stored username from the database
   * @param {string} userId - The Discord user ID
   * @returns {Promise<string|null>} The stored username or null if not found
   */
  async getUsername(userId) {
    return await this.usersTable.get(`${userId}.username`);
  }

  async addBalance(userId, amount, username = null) {
    // Store username if provided
    if (username) {
      await this.storeUsername(userId, username);
    }

    const currentBalance = await this.getBalance(userId);
    const newBalance = currentBalance + amount;
    await this.setBalance(userId, newBalance);
    return newBalance;
  }

  async removeBalance(userId, amount, username = null) {
    // Store username if provided
    if (username) {
      await this.storeUsername(userId, username);
    }

    const currentBalance = await this.getBalance(userId);
    const newBalance = Math.max(0, currentBalance - amount);
    await this.setBalance(userId, newBalance);
    return newBalance;
  }

  async transferBalance(
    senderId,
    receiverId,
    amount,
    senderUsername = null,
    receiverUsername = null
  ) {
    // Store usernames if provided
    if (senderUsername) {
      await this.storeUsername(senderId, senderUsername);
    }

    if (receiverUsername) {
      await this.storeUsername(receiverId, receiverUsername);
    }

    const senderBalance = await this.getBalance(senderId);

    if (senderBalance < amount) {
      return false;
    }

    await this.removeBalance(senderId, amount);
    await this.addBalance(receiverId, amount);
    return true;
  }

  // Work and rewards
  async getLastDaily(userId) {
    return (await this.usersTable.get(`${userId}.lastDaily`)) || 0;
  }

  async setLastDaily(userId, timestamp, username = null) {
    // Store username if provided
    if (username) {
      await this.storeUsername(userId, username);
    }

    await this.usersTable.set(`${userId}.lastDaily`, timestamp);
    return timestamp;
  }

  async getLastWork(userId) {
    return (await this.usersTable.get(`${userId}.lastWork`)) || 0;
  }

  async setLastWork(userId, timestamp, username = null) {
    // Store username if provided
    if (username) {
      await this.storeUsername(userId, username);
    }

    await this.usersTable.set(`${userId}.lastWork`, timestamp);
    return timestamp;
  }

  // Shop and inventory
  async getInventory(userId) {
    return (await this.usersTable.get(`${userId}.inventory`)) || [];
  }

  async addItemToInventory(userId, itemId, username = null) {
    // Store username if provided
    if (username) {
      await this.storeUsername(userId, username);
    }

    const inventory = await this.getInventory(userId);
    inventory.push(itemId);
    await this.usersTable.set(`${userId}.inventory`, inventory);
    return inventory;
  }

  async getShopItems() {
    return (await this.shopsTable.get("items")) || [];
  }

  async addShopItem(name, price, description) {
    const items = await this.getShopItems();
    const itemId = Date.now().toString();

    const newItem = {
      id: itemId,
      name,
      price,
      description,
    };

    items.push(newItem);
    await this.shopsTable.set("items", items);
    return newItem;
  }

  /**
   * Remove an item from the shop by ID
   * @param {string} itemId - The ID of the item to remove
   * @returns {Promise<{removed: boolean, item: object|null}>} Result object with removed status and item info
   */
  async removeShopItem(itemId) {
    const items = await this.getShopItems();
    const itemIndex = items.findIndex((item) => item.id === itemId);

    if (itemIndex === -1) {
      return { removed: false, item: null };
    }

    // Store item before removing
    const removedItem = items[itemIndex];

    // Remove item from array
    items.splice(itemIndex, 1);

    // Update database
    await this.shopsTable.set("items", items);

    return { removed: true, item: removedItem };
  }

  /**
   * Remove all items from the shop
   * @returns {Promise<number>} Number of items removed
   */
  async removeAllShopItems() {
    const items = await this.getShopItems();
    const count = items.length;

    // Clear all items
    await this.shopsTable.set("items", []);

    return count;
  }

  // Leaderboard
  async getLeaderboard(limit = 10) {
    const users = await this.usersTable.all();

    // Get users with their balances, sorted highest to lowest
    const topUsers = users
      .filter((user) => user.value && user.value.balance !== undefined)
      .sort((a, b) => b.value.balance - a.value.balance)
      .slice(0, limit);

    // Map to the format needed for the API
    const leaderboard = topUsers.map((user) => {
      // Extract the actual Discord user ID from the database key
      const userId = user.id;

      // Try to get a stored username if we have it, or create a fallback
      let username = user.value.username || `User#${userId.slice(-4)}`;

      return {
        userId: userId,
        username: username,
        balance: user.value.balance,
      };
    });

    return leaderboard;
  }
}

module.exports = new EconomyManager();
