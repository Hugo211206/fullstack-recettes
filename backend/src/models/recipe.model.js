const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, minlength: 1, maxlength: 120 },
    category: { type: String, required: true, enum: ['starter', 'main', 'dessert', 'drink'] },
    prepTime: { type: Number, required: true, min: 1, max: 1440 },
    ingredients: { type: String, default: '', maxlength: 2000 },
    instructions: { type: String, default: '', maxlength: 5000 },
    favorite: { type: Boolean, default: false },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

recipeSchema.set('toJSON', {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    const owner = ret.ownerId;
    if (owner instanceof mongoose.Types.ObjectId) {
      ret.ownerId = owner.toString();
    } else if (owner) {
      ret.ownerId = owner.id;
      ret.author = { id: owner.id, username: owner.username ?? null };
    } else {
      ret.ownerId = null;
      ret.author = null;
    }
    return ret;
  },
});

module.exports = mongoose.model('Recipe', recipeSchema);