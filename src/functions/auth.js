import jwt from 'jsonwebtoken';
import passport from 'passport';
import { APP_SECRET } from '../config';
// import { APP_NEW_SECRET } from '../config';

export const signToken = async (payload) => {
  let token = jwt.sign(payload, APP_SECRET, { expiresIn: '80h' });
  return `Bearer ${token}`;
};

// //generate short expiry token for password resets
// export const forgotToken = async (payload) => {
//   let token = jwt.sign(payload, APP_SECRET, { expiresIn: '1200s' });
//   return `Bearer ${token}`;
// };

export const userAuth = passport.authenticate('jwt', { session: false });

// export const resetAuth = passport.authenticate('jwt', { session: false });

export const serializeUser = ({
  ifsc,
  name,
  email,
  phone,
  phone2,
  aadhar,
  address,
  referId,
  orgName,
  username,
  children,
  category,
  accountName,
  affiliateId,
  onboardCode,
  accountNumber,
}) => {
  return {
    ifsc,
    name,
    email,
    phone,
    phone2,
    aadhar,
    address,
    referId,
    orgName,
    username,
    children,
    category,
    accountName,
    affiliateId,
    onboardCode,
    accountNumber,
  };
};
