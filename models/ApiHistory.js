const mongoose = require('mongoose');

const ApiHistorySchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true },
    method:     { type: String, required: true },
    url:        { type: String, required: true },
    headers:    { type: Object, default: null },
    request_body: { type: Object, default: null },
    status_code: { type: Number, required: true },
    response_time: { type: Number, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ApiHistory', ApiHistorySchema);
