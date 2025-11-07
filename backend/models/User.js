/**
 * Діана: У цьому файлі знаходиться трохи оновлена модель для юзера
 * Я трохи оновила схему для того щоб додати підтвердження пошти токеном та додала ролі
 * Трохи нище хуки та методи, перші два хешують пароль автоматично в момент реєстрації та оновлення (якщо ми міняємо пароль)
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  emailConfirmed: {
    type: Boolean,
    default: false,
  },
  emailConfirmationToken: String,
  avatar: {
    type: String,
    default: "uploads/default_avatar.svg",
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  calendars: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Calendar",
    },
  ],
  sharedWithMe: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Calendar",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.password) {
    const salt = await bcrypt.genSalt(10);
    update.password = await bcrypt.hash(this.password, salt);
    this.setUpdate(update);
  }
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByLogin = function (login) {
  return this.findOne({ login: login });
};

export default mongoose.model("User", userSchema);
