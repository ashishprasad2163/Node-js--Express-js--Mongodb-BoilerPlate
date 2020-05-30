import express, { response } from 'express';
import { User } from '../models';
import { signToken, userAuth, serializeUser } from '../functions/auth';
// import mailgun from 'mailgun-js';
import { forgotToken, resetAuth } from '../functions/resetAuth';
import { hash, compare } from 'bcryptjs';
// import { MAILGUN_APIKEY as apikey } from '../config';
// const DOMAIN = 'domain.mailgun.org';
// const mg = mailgun({ apiKey: apikey, domain: DOMAIN });
import { check, validationResult } from 'express-validator';
const router = express.Router();

/**
 * @TYPE POST
 * @DESC To Register a new user
 * @ACCESS Public
 * @END_PT /api/users/register
 */
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please enter a valid email').isEmail(),
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password must contain atleast six characters').isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const newUser = await User.create(req.body);
      const payload = {
        username: newUser.username,
        email: newUser.email,
        id: newUser.id,
      };
      //to generate a token ,sign it first
      let token = await signToken(payload);
      return res.status(201).json({ token, payload, success: true });
    } catch (err) {
      console.log(err.message);
      return res.status(403).json({ message: err.message, success: false });
    }
  }
);

/**
 * @TYPE GET
 * @DESC To Get the user's profile using the auth token
 * @ACCESS Private
 * @END_PT /api/users/auth
 */
router.get('/auth', userAuth, async (req, res) => {
  let authUser = serializeUser(req.user);
  return res.status(200).json(authUser);
});

/**
 * @TYPE POST
 * @DESC To Login a User via username and password
 * @ACCESS Public
 * @END_PT /api/users/auth
 */
router.post(
  '/auth',
  [
    check('username', 'Username is required').not().isEmpty(),
    check('password', 'Password must contain atleast six characters').isLength({
      min: 6,
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { username, password } = req.body;

    try {
      // Find the user from the database using the username
      const user = await User.findOne({ username });
      if (!user) {
        return res
          .status(404)
          .json({ message: 'Username not found', success: false });
      }

      // Compare the password using the User Prototype Schema Method
      if (!(await user.isMatch(password, user.password))) {
        return res
          .status(403)
          .json({ message: 'Incorrect password', success: false });
      }

      // Prepare the payload for the token
      const payload = {
        username: user.username,
        email: user.email,
        id: user.id,
      };

      //to generate a token ,sign it first
      let token = await signToken(payload);
      return res.status(201).json({ token, payload, success: true });
    } catch (err) {
      return res.status(201).json({ message: err.message, success: false });
    }
  }
);

/**
 * @TYPE PATCH
 * @DESC To add other info in user model (aadhar,bank) also adds entry in children
 * @ACCESS Private
 * @End_PT /api/users/details
 */
router.patch('/register/:id', userAuth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    let user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({
        message: 'User not found',
      });

    //logic area

    user = await User.findByIdAndUpdate(req.params.id, {
      $set: req.body,
    });
    let updatedUser = serializeUser(user);
    res.status(203).json({
      message: 'Profile updated successfully',
      success: true,
      updatedUser,
    });
  } catch (err) {
    console.error(err.message);
    res.status(403).json({
      message: 'Profile not updated',
      success: false,
      err: err.message,
    });
  }
});

/**
 * @TYPE PATCH
 * @DESC To add other info in user model (aadhar,bank) also adds entry in children
 * @ACCESS Private
 * @End_PT /api/users/details
 */
router.patch('/referal/:id', userAuth, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    let user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({
        message: 'User not found',
      });

    //logic area
    user = await User.findByIdAndUpdate(req.params.id, {
      $set: req.body,
    });

    // check if child user already added in parent array
    let checker = await User.find({
      children: req.params.id,
    });
    //console.log('array:', checker);

    if (checker.length === 0) {
      // find the parent user by referCode and add to its children
      const filter = { referId: req.body.onboardCode };
      const update = { $push: { children: [req.params.id] } };
      let parentUser = await User.findOneAndUpdate(filter, update);
      if (!parentUser)
        return res.status(404).json({
          message: 'Refer code not valid',
          success: 'false',
        });
      let updatedUser = serializeUser(user);
      res.status(203).json({
        message: 'Profile updated successfly',
        success: true,
        updatedUser,
      });
    } else {
      return res.status(202).json({
        message: 'already added in child array',
        success: true,
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(403).json({
      message: 'Profile not updated',
      success: false,
      err: err.message,
    });
  }
});

/**
 * @TYPE PUT
 * @DESC forgot password api ( when forgot paswword clicked, it sends a password reset link to email owner )
 * @ACCESS Private
 * @END_PT /api/users/forgotpassword
 */

// router.put('/forgotpassword', async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });

//     if (!user) {
//       return res
//         .status(404)
//         .json({ message: 'User not found', success: false });
//     }

//     //prepare payload for token
//     const payload = {
//       id: user.id,
//       email: user.email,
//     };
//     let token = await forgotToken(payload);
//     // const data = {
//     //   from: 'noreply@xperttutor.com',
//     //   to: email,
//     //   subject: 'Password reset link',
//     //   html: `<h2>You have recieved a password reset link.</h2>
//     //   <p>Click here to reset your password.This link will automatically expire in 20 minutes.</p>
//     //   <p>Please do not share this link or forward this to anyone.</p>
//     //   <a href="http://127.0.0.1:5500/?secret=${token}">Click here</a>
//     //   <p>In case you have not requested for any password reset, immediately contact on this number: 9999999999.</p>
//     //   <p>Still have issue loging in ? Contact to our support @ help@xperttutor.com or call us at 1800-000-0000</p>
//     //   `,
//     // };
//     await user.updateOne({ resetLink: token });

//     //send email
//     let body = await mg.messages().send(data);
//     return res.json({ message: 'Email has been sent', body });
//   } catch (err) {
//     return res.status(201).json({ message: err.message, success: false });
//   }
// });

/**
 * @TYPE PUT
 * @DESC reset password api ( when link clicked,user can post new password )
 * @ACCESS Private
 * @END_PT /api/users/resetpassword
 */

// router.put(
//   '/resetpassword',
//   resetAuth,
//   // [
//   //   check(
//   //     'newPassword',
//   //     'Password must contain atleast six characters'
//   //   ).isLength({
//   //     min: 6,
//   //   }),
//   // ],
//   async (req, res) => {
//     const { resetLink, newPassword } = req.body;
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     try {
//       if (!resetLink) {
//         return res
//           .status(401)
//           .json({ message: 'Invalid link', success: false });
//       }

//       //find user who has resetlink
//       const user = await User.findOneAndUpdate(resetLink, {
//         password: await hash(newPassword, 12),
//         resetLink: '',
//       });
//       return res.status(203).json({
//         message: 'Password changed',
//         success: true,
//       });
//       if (!user) {
//         return res.status(404).json({
//           message: 'Something went wrong user not found',
//           success: false,
//         });
//       }
//     } catch (err) {
//       return res.status(201).json({ message: err.message, success: false });
//       console.error('error in authjs', err.message);
//     }
//   }
// );

// /**
//  * @TYPE PUT
//  * @DESC change password api ( user can change to new password )
//  * @ACCESS Private
//  * @END_PT /api/users/changepassword
//  */

// router.put(
//   '/changepassword/:id',
//   [
//     check(
//       'newPassword',
//       'Password must contain atleast six characters'
//     ).isLength({
//       min: 6,
//     }),
//   ],
//   userAuth,
//   async (req, res) => {
//     const { newPassword } = req.body;
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ errors: errors.array() });
//     }

//     try {
//       //find user who has resetlink
//       const user = await User.findByIdAndUpdate(req.params.id, {
//         password: await hash(newPassword, 12),
//       });
//       res.status(203).json({
//         message: 'Password changed',
//         success: true,
//       });
//       if (!user) {
//         return res.status(404).json({
//           message: 'Something went wrong user not found',
//           success: false,
//         });
//       }
//     } catch (err) {
//       return res.status(201).json({ message: err.message, success: false });
//     }
//   }
// );
export default router;
