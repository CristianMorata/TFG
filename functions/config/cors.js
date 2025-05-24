const cors = require("cors");

const corsHandler = cors({ origin: true });

module.exports = corsHandler;