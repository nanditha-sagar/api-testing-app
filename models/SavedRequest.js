const mongoose = require('mongoose');

const SavedRequestSchema = new mongoose.Schema(
  {
    user_email: { type: String, required: true },
    name:       { type: String, required: true },
    method:     { type: String, required: true },
    url:        { type: String, required: true },
    headers:    { type: Object, default: null },
    request_body: { type: Object, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model('SavedRequest', SavedRequestSchema);
