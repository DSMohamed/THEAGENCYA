const db = require('./firebase');

// Economy database operations
class EconomyManager {
  constructor() {
    this.currency = {
      name: "Coins",
      symbol: "💰",
    };
  }

  // --- Welcome system methods ---
  async setWelcomeConfig(guildId, channelId, title, subtitle, welcomeMessage, logoUrl) {
    const config = {
      channelId,
      title,
      subtitle,
      welcomeMessage,
      logoUrl: logoUrl || null,
      enabled: true,
      timestamp: Date.now(),
    };
    await db.collection('welcome').doc(guildId).set(config);
    return config;
  }

  async getWelcomeConfig(guildId) {
    const doc = await db.collection('welcome').doc(guildId).get();
    return doc.exists ? doc.data() : null;
  }

  async updateWelcomeStatus(guildId, status) {
    const config = await this.getWelcomeConfig(guildId);
    if (!config) return false;
    config.enabled = status;
    await db.collection('welcome').doc(guildId).set(config);
    return true;
  }

  // --- Warning system methods ---
  async addWarning(guildId, userId, moderatorId, reason) {
    const warningsRef = db.collection('warnings').doc(`${guildId}_${userId}`);
    const doc = await warningsRef.get();
    let userWarnings = doc.exists ? doc.data().warnings || [] : [];
    const warning = {
      id: this.generateWarningId(userWarnings),
      userId,
      moderatorId,
      reason,
      timestamp: Date.now(),
    };
    userWarnings.push(warning);
    await warningsRef.set({ warnings: userWarnings });
    return warning;
  }

  async getWarnings(guildId, userId) {
    const doc = await db.collection('warnings').doc(`${guildId}_${userId}`).get();
    return doc.exists ? doc.data().warnings || [] : [];
  }

  async removeWarning(guildId, userId, warningId) {
    const warningsRef = db.collection('warnings').doc(`${guildId}_${userId}`);
    const doc = await warningsRef.get();
    let userWarnings = doc.exists ? doc.data().warnings || [] : [];
    const initialLength = userWarnings.length;
    userWarnings = userWarnings.filter((warning) => warning.id !== warningId);
    if (userWarnings.length !== initialLength) {
      await warningsRef.set({ warnings: userWarnings });
      return true;
    }
    return false;
  }

  async clearWarnings(guildId, userId) {
    const warningsRef = db.collection('warnings').doc(`${guildId}_${userId}`);
    const doc = await warningsRef.get();
    const userWarnings = doc.exists ? doc.data().warnings || [] : [];
    const count = userWarnings.length;
    await warningsRef.delete();
    return count;
  }

  generateWarningId(existingWarnings) {
    if (!existingWarnings || existingWarnings.length === 0) return 1;
    const maxId = Math.max(...existingWarnings.map((w) => w.id));
    return maxId + 1;
  }

  // --- Admin role management ---
  async getAdminRoles() {
    const doc = await db.collection('config').doc('admin').get();
    return doc.exists ? doc.data().adminRoles || [] : [];
  }

  async getDisplayRoleId() {
    const doc = await db.collection('config').doc('admin').get();
    return doc.exists ? doc.data().displayRoleId || '' : '';
  }

  async setDisplayRoleId(roleId) {
    const doc = await db.collection('config').doc('admin').get();
    const data = doc.exists ? doc.data() : {};
    data.displayRoleId = roleId;
    await db.collection('config').doc('admin').set(data, { merge: true });
    return roleId;
  }

  async addAdminRole(roleId) {
    const doc = await db.collection('config').doc('admin').get();
    const data = doc.exists ? doc.data() : {};
    let adminRoles = data.adminRoles || [];
    if (!adminRoles.includes(roleId)) {
      adminRoles.push(roleId);
      data.adminRoles = adminRoles;
      await db.collection('config').doc('admin').set(data, { merge: true });
    }
    return adminRoles;
  }

  async removeAdminRole(roleId) {
    const doc = await db.collection('config').doc('admin').get();
    const data = doc.exists ? doc.data() : {};
    let adminRoles = data.adminRoles || [];
    adminRoles = adminRoles.filter((id) => id !== roleId);
    data.adminRoles = adminRoles;
    await db.collection('config').doc('admin').set(data, { merge: true });
    return adminRoles;
  }

  async hasAdminPermission(member) {
    if (member.id === "586115567560425473") return true;
    if (member.id === member.guild.ownerId) return true;
    const adminRoles = await this.getAdminRoles();
    if (adminRoles.length === 0) return false;
    return member.roles.cache.some((role) => adminRoles.includes(role.id));
  }

  // --- User balance operations ---
  async getBalance(userId, username = null) {
    if (username) await this.storeUsername(userId, username);
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists && doc.data().balance !== undefined ? doc.data().balance : 0;
  }

  async setBalance(userId, amount, username = null) {
    if (username) await this.storeUsername(userId, username);
    await db.collection('users').doc(userId).set({ balance: amount }, { merge: true });
    return amount;
  }

  async storeUsername(userId, username) {
    await db.collection('users').doc(userId).set({ username }, { merge: true });
  }

  async getUsername(userId) {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists ? doc.data().username : null;
  }

  async addBalance(userId, amount, username = null) {
    if (username) await this.storeUsername(userId, username);
    const currentBalance = await this.getBalance(userId);
    const newBalance = currentBalance + amount;
    await this.setBalance(userId, newBalance);
    return newBalance;
  }

  async removeBalance(userId, amount, username = null) {
    if (username) await this.storeUsername(userId, username);
    const currentBalance = await this.getBalance(userId);
    const newBalance = Math.max(0, currentBalance - amount);
    await this.setBalance(userId, newBalance);
    return newBalance;
  }

  async transferBalance(senderId, receiverId, amount, senderUsername = null, receiverUsername = null) {
    if (senderUsername) await this.storeUsername(senderId, senderUsername);
    if (receiverUsername) await this.storeUsername(receiverId, receiverUsername);
    const senderBalance = await this.getBalance(senderId);
    if (senderBalance < amount) return false;
    await this.removeBalance(senderId, amount);
    await this.addBalance(receiverId, amount);
    return true;
  }

  // --- Work and rewards ---
  async getLastDaily(userId) {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists && doc.data().lastDaily !== undefined ? doc.data().lastDaily : 0;
  }

  async setLastDaily(userId, timestamp, username = null) {
    if (username) await this.storeUsername(userId, username);
    await db.collection('users').doc(userId).set({ lastDaily: timestamp }, { merge: true });
    return timestamp;
  }

  async getLastWork(userId) {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists && doc.data().lastWork !== undefined ? doc.data().lastWork : 0;
  }

  async setLastWork(userId, timestamp, username = null) {
    if (username) await this.storeUsername(userId, username);
    await db.collection('users').doc(userId).set({ lastWork: timestamp }, { merge: true });
    return timestamp;
  }

  // --- Shop and inventory ---
  async getInventory(userId) {
    const doc = await db.collection('users').doc(userId).get();
    return doc.exists && doc.data().inventory ? doc.data().inventory : [];
  }

  async addItemToInventory(userId, itemId, username = null) {
    if (username) await this.storeUsername(userId, username);
    const inventory = await this.getInventory(userId);
    inventory.push(itemId);
    await db.collection('users').doc(userId).set({ inventory }, { merge: true });
    return inventory;
  }

  async getShopItems() {
    const doc = await db.collection('shop').doc('items').get();
    return doc.exists && doc.data().items ? doc.data().items : [];
  }

  async addShopItem(name, price, description) {
    const doc = await db.collection('shop').doc('items').get();
    let items = doc.exists && doc.data().items ? doc.data().items : [];
    const itemId = Date.now().toString();
    const newItem = { id: itemId, name, price, description };
    items.push(newItem);
    await db.collection('shop').doc('items').set({ items });
    return newItem;
  }

  async removeShopItem(itemId) {
    const doc = await db.collection('shop').doc('items').get();
    let items = doc.exists && doc.data().items ? doc.data().items : [];
    const itemIndex = items.findIndex((item) => item.id === itemId);
    if (itemIndex === -1) return { removed: false, item: null };
    const removedItem = items[itemIndex];
    items.splice(itemIndex, 1);
    await db.collection('shop').doc('items').set({ items });
    return { removed: true, item: removedItem };
  }

  async removeAllShopItems() {
    const doc = await db.collection('shop').doc('items').get();
    let items = doc.exists && doc.data().items ? doc.data().items : [];
    const count = items.length;
    await db.collection('shop').doc('items').set({ items: [] });
    return count;
  }

  // --- Leaderboard ---
  async getLeaderboard(limit = 10) {
    const usersSnap = await db.collection('users').get();
    const users = [];
    usersSnap.forEach(doc => {
      const data = doc.data();
      if (data.balance !== undefined) {
        users.push({
          userId: doc.id,
          username: data.username || `User#${doc.id.slice(-4)}`,
          balance: data.balance,
        });
      }
    });
    users.sort((a, b) => b.balance - a.balance);
    return users.slice(0, limit);
  }
}

module.exports = new EconomyManager();
