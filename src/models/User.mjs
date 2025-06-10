import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  cep: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  neighborhood: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

const clinicSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  cep: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  neighborhood: {
    type: String,
    required: true,
  },
  number: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  addition: String,
});

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
  },
  hashedOTP: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["pending", "completed"],
  },
  name: String,
  birthdayDate: Date,
  CNPJCPFProfissional: String,
  address: [addressSchema],
  clinic: clinicSchema,
  professionalSpecialties: [String],
  otherProfessionalSpecialties: [String],
  professionalServicePreferences: [String],
  userType: {
    type: String,
    enum: ["professional", "patient"],
  },
  profileImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "fs.files",
  },
});

const User = mongoose.model("User", userSchema);
export default User;
