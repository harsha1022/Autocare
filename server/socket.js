/**
 * Shared Socket.IO instance module.
 * Breaks the circular dependency between index.js and route files.
 *
 * Usage in routes:
 *   const { getIO } = require('../socket');
 *   const io = getIO();
 *   if (io) io.emit('event', data);
 */

let _io = null;

const setIO = (ioInstance) => {
    _io = ioInstance;
};

const getIO = () => _io;

module.exports = { setIO, getIO };
