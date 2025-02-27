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
  professionalSpecialities: [String],
  otherProfessionalSpecialities: [String],
  professionalServicePreferences: [String],
  userSpecialities: [String],
  userServicePreferences: [String],
  userAcessibilityPreferences: [String],
  profilePhoto: String,
  userType: String,
});

const User = mongoose.model("User", userSchema);
export default User;
