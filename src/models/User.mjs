import mongoose from "mongoose";
import addressSchema from "./Address.mjs";

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
  },
  name: String,
  birthdayDate: Date,
  addresses: [addressSchema],
  cepResidencial: String,
  nomeClinica: String,
  CNPJCPFProfissional: String,
  cepClinica: String,
  enderecoClinica: String,
  complementoClinica: String,
  professionalSpecialties: [String],
  otherProfessionalSpecialties: [String],
  professionalServicePreferences: [String],
  userSpecialties: [String],
  userServicePreferences: [String],
  userAcessibilityPreferences: [String],
  profileImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "fs.files",
  },
  userType: String,
});

const User = mongoose.model("User", userSchema);
export default User;
