import mongoose from "mongoose";

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
  profilePhoto: mongoose.Schema.Types.ObjectId,
  userType: String,
});

const User = mongoose.model("User", userSchema);
export default User;
