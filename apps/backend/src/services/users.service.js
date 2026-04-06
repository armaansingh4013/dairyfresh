import { ObjectId, User } from "../models/index.js";

function toObjectId(value) {
  if (!value || !ObjectId.isValid(value)) return null;
  return new ObjectId(value);
}

function getDefaultAddress(user) {
  return user.addresses.find((address) => address.isDefault) || user.addresses[0] || null;
}

function embeddedAddressToResponse(user, address) {
  if (!user || !address) return null;

  return {
    id: address._id.toString(),
    userId: user._id.toString(),
    title: address.title,
    houseNumber: address.houseNumber,
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode,
    lat: address.lat,
    lng: address.lng,
    isDefault: address.isDefault
  };
}

async function findAddressOwnerById(addressId) {
  const objectId = toObjectId(addressId);
  if (!objectId) return null;

  const user = await User.findOne({ "addresses._id": objectId });
  if (!user) return null;

  const address = user.addresses.id(objectId);
  if (!address) return null;

  return { user, address };
}

export async function updateUserProfile(userId, payload) {
  const user = await User.findById(userId);
  if (!user) return null;

  Object.assign(user, payload);
  await user.save();
  return user;
}

export async function listAddresses(userId) {
  const user = await User.findById(userId);
  if (!user) return [];

  return user.addresses
    .slice()
    .sort((left, right) => Number(right.isDefault) - Number(left.isDefault))
    .map((address) => embeddedAddressToResponse(user, address));
}

export async function createAddress(userId, payload) {
  const user = await User.findById(userId);
  if (!user) return null;

  if (payload.isDefault) {
    user.addresses.forEach((address) => {
      address.isDefault = false;
    });
  }

  user.addresses.push({
    title: payload.title,
    houseNumber: payload.houseNumber,
    line1: payload.line1,
    line2: payload.line2 || "",
    landmark: payload.landmark || "",
    city: payload.city,
    state: payload.state,
    postalCode: payload.postalCode,
    lat: payload.lat ?? null,
    lng: payload.lng ?? null,
    isDefault: Boolean(payload.isDefault)
  });

  if (!getDefaultAddress(user) && user.addresses.length === 1) {
    user.addresses[0].isDefault = true;
  }

  await user.save();
  return embeddedAddressToResponse(user, user.addresses[user.addresses.length - 1]);
}

export async function updateAddress(addressId, payload) {
  const match = await findAddressOwnerById(addressId);
  if (!match) return null;

  const { user, address } = match;

  if (payload.isDefault) {
    user.addresses.forEach((item) => {
      item.isDefault = false;
    });
  }

  Object.assign(address, payload);
  await user.save();
  return embeddedAddressToResponse(user, address);
}

export async function deleteAddress(addressId) {
  const match = await findAddressOwnerById(addressId);
  if (!match) return;

  match.address.deleteOne();
  await match.user.save();
}