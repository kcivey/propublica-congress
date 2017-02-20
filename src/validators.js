/**
 * Exports validation utility functions used throughout this library. They're primarily intended
 * for minimizing unnecessary API calls
 */

/**
 * Whether the argument is a valid offset to send to the ProPublica API
 * @param {String|Number} offset
 * @return {Boolean}
 */
function isValidOffset(offset) {
  return (offset % 20) === 0 && offset !== '';
}

/**
 * Whether the given type is in the given typeSet
 * @param  {String}  type
 * @param  {Set}     [typeSet={}] A Set of types to validate against
 * @return {Boolean}
 */
function isValidType(type, typeSet = new Set([])) {
  return !!type
    && !!type.length
    && typeSet.has(type);
}

const chamberTypes = new Set([
  'senate',
  'house'
]);

/**
 * Whether the given string is a valid chamber of congress
 * @param  {String}  chamber
 * @return {Boolean}
 */
function isValidChamber(chamber) {
  return isValidType(chamber, chamberTypes);
}

const CURRENT_SESSION = 115;

/**
 * Whether the given session of congress is valid
 * @param  {Number}  session
 * @param  {Number}  earliestSession Different endpoints support different
 *                                   lower limits
 * @return {Boolean}
 */
function isValidCongress(session, earliestSession) {
  if (parseInt(session) != session) return false;
  if (earliestSession && parseInt(earliestSession) != earliestSession) return false;
  return earliestSession
    ? session <= CURRENT_SESSION && session >= earliestSession
    : session <= CURRENT_SESSION;
}

/**
 * Whether the API key is valid (for trying to use)
 * @param  {String}  apiKey
 * @return {Boolean}
 */
function isValidApiKey(apiKey) {
  return !!apiKey && !!apiKey.length && apiKey.length > 0;
}

/**
 * Whether the given billId is appropriate for use with the API
 * @param {String} billId 
 * @returns {Boolean}
 */
function isValidBillId(billId) {
  return /hres\d+/.test(billId);
}

/**
 * Whether the given memberId looks valid and could be used with the API
 * 
 * @param {String} memberId 
 * @returns {Boolean}
 */
function isValidMemberId(memberId) {
  let match;
  return !!(memberId && memberId.match)
    && !!(match = memberId.match(/[A-Z]\d{6}/)) && !!match && match[0] === memberId;
}

module.exports = {
  isValidMemberId,
  isValidBillId,
  isValidCongress,
  isValidChamber,
  isValidType,
  isValidOffset,
  isValidApiKey
};
