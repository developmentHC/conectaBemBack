import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  _id: {
    type: mongoose.Schema.Types.ObjectId,
    default: () => new mongoose.Types.ObjectId(),
    required: true,
  },
  cep: {
    type: String,
    required: true,
  },
  endereco: String,
  bairro: String,
  cidade: String,
  estado: String,
  complemento: String,
  principal: {
    type: Boolean,
    default: true,
  },
});

export default addressSchema;
