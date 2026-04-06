import { User } from "../models/index.js";

export async function findUserByPhone(phone) {
  return User.findOne({ phone });
}

export async function upsertUserByPhone({ phone, name, email }) {
  let user = await User.findOne({ phone });

  if (user) {
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();
    return user;
  }

  return User.create({
    phone,
    ...(name ? { name } : {}),
    ...(email ? { email } : {})
  });
}

export async function getUserById(userId) {
  return User.findById(userId);
}


