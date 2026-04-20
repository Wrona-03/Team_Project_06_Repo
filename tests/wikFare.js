// Calculate what zone to charge for
function calculateZone(originZone, destinationZone) {
  if (destinationZone === null || destinationZone === undefined) {
    return originZone;
  }

  return Math.max(originZone, destinationZone);
}

// Extract fare + caps
function getFare(card, zone) {
  const single = card[`Zone ${zone} fare`];
  const weekly = card[`Zone ${zone} weekly`];
  const monthly = card[`Zone ${zone} monthly`];

  return {
    single,
    weekly,
    monthly,
    dailyCap: card["Daily Cap"],
    weeklyCap: card["Weekly Cap"],
  };
}

// Export for testing
module.exports = { calculateZone, getFare };
