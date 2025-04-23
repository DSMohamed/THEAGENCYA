// Temporary script to clear all shop items
const economy = require('./utils/economy');

// Function to clear shop
async function clearShop() {
  try {
    // Get current items to show what's being removed
    const items = await economy.getShopItems();
    console.log(`Found ${items.length} items in the shop`);
    
    if (items.length === 0) {
      console.log('Shop is already empty.');
      return;
    }
    
    // List items being removed
    items.forEach(item => {
      console.log(`- ${item.name} (ID: ${item.id})`);
    });
    
    // Remove all items
    const count = await economy.removeAllShopItems();
    console.log(`Successfully removed ${count} items from the shop.`);
  } catch (error) {
    console.error('Error clearing shop:', error);
  }
}

// Execute the function
clearShop().then(() => {
  console.log('Shop clearing operation complete.');
  process.exit(0);
}).catch(err => {
  console.error('Failed to clear shop:', err);
  process.exit(1);
});