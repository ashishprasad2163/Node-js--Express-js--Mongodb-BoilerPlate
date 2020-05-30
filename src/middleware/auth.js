import passport from 'passport';
import { User } from '../models';
import { APP_SECRET as key } from '../config';
import { Strategy, ExtractJwt } from 'passport-jwt';

const opts = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: key,
};

passport.use(
  new Strategy(opts, async (payload, done) => {
    try {
      let user = await User.findById(payload.id);
      if (user) {
        return done(null, user);
      }
      return done(null, false);
    } catch (err) {
      return done(null, false);
    }
  })
);
