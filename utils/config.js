/**
 * Configuration file for special permissions and settings
 */

module.exports = {
  // List of user IDs that have permission to use sensitive admin commands
  sensitiveCommandUsers: [
    "586115567560425473",
    "1259207469377519759",
    "1020310042366443560", // Owner's ID
    // Add more authorized user IDs here
  ],

  // Check if a user has permission to use sensitive commands
  hasSensitiveCommandPermission(userId) {
    return this.sensitiveCommandUsers.includes(userId);
  },

  // Add a user to the sensitive commands list
  addSensitiveCommandUser(userId) {
    if (!this.sensitiveCommandUsers.includes(userId)) {
      this.sensitiveCommandUsers.push(userId);
    }
    return this.sensitiveCommandUsers;
  },

  // Remove a user from the sensitive commands list
  removeSensitiveCommandUser(userId) {
    this.sensitiveCommandUsers = this.sensitiveCommandUsers.filter(
      (id) => id !== userId
    );
    return this.sensitiveCommandUsers;
  },
};
