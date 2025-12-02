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

const acceptedPaymentsSchema = new mongoose.Schema(
  {
    pix: { type: Boolean, default: false },
    wellhub: { type: Boolean, default: false },
    mastercard: { type: Boolean, default: false },
    visa: { type: Boolean, default: false },
  },
  { _id: false }
);

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
    type: [String],
    enum: ["professional", "patient"],
  },
  imageUrl: {
    type: String,
    default: null,
  },
  ratingsCount: { type: Number, default: 0 },
  ratingsAvg: { type: Number, default: 0 },
  acceptedPayments: { type: acceptedPaymentsSchema, default: () => ({}) },
});

const User = mongoose.model("User", userSchema);
export default User;
