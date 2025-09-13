function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString();
}

function truncateText(text, maxLength = 100) {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}

function validateHistoryNumber(input) {
  const num = parseInt(input);
  return !isNaN(num) && num >= 5 && num <= 50;
}

function sanitizeInput(input) {
  return input.trim().replace(/[<>&"']/g, "");
}

module.exports = {
  formatTimestamp,
  truncateText,
  validateHistoryNumber,
  sanitizeInput,
};
