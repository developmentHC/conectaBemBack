import User from "../models/User.mjs";

class UserService {
  async createUser(data) {
    const user = await User.create(data);

    return user;
  }

  async updateUser(id, data) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    return await user.update(data);
  }
}

export default new UserService();
