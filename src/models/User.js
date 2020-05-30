import { Schema, model } from 'mongoose';
import { hash, compare } from 'bcryptjs';
import randomize from 'randomatic';

const UserSchema = Schema(
  {
    name: {
      type: String,
      required: true,
    },
    username: {
      index: true,
      type: String,
      required: true,
      validate: {
        validator: (username) => User.dontExist({ username }),
        message: ({ value }) => `Username ${value} has already been taken.`,
      },
    },
    email: {
      type: String,
      required: true,
      validate: {
        validator: (email) => User.dontExist({ email }),
        message: ({ value }) => `Email ${value} has already been taken.`,
      },
    },
    password: {
      index: true,
      type: String,
      required: true,
    },
    resetLink: {
      data: String,
      default: '',
    },
    aadhar: {
      type: Number,
      required: false,
      default: function () {
        return null;
      },
    },
    phone: {
      type: Number,
      required: false,
      default: function () {
        return null;
      },
    },
    phone2: {
      type: Number,
      required: false,
      default: function () {
        return null;
      },
    },
    category: {
      type: String,
      required: false,
      default: function () {
        return `Not updated`;
      },
    },
    orgName: {
      type: String,
      required: false,
      default: function () {
        return `Not updated`;
      },
    },
    address: {
      type: String,
      required: false,
      default: function () {
        return `Not updated`;
      },
    },
    accountName: {
      type: String,
      required: false,
      default: function () {
        return `Not updated`;
      },
    },
    accountNumber: {
      type: Number,
      required: false,
      default: function () {
        return null;
      },
    },
    ifsc: {
      type: String,
      required: false,
      default: function () {
        return `Not updated`;
      },
    },
    referId: {
      type: String,
      default: function () {
        return randomize('0', 6, { exclude: '0' });
      },
    },
    children: {
      type: [],
      required: false,
      index: true,
    },
    onboardCode: {
      type: String,
      required: false,
      default: function () {
        return null;
      },
    },
    affiliateId: {
      type: String,
      default: function () {
        return `XAF ${randomize('0', 5, { exclude: '0' })}`;
      },
    },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await hash(this.password, 12);
  }
});

UserSchema.statics.dontExist = async function (options) {
  return (await this.where(options).countDocuments()) === 0;
};

UserSchema.methods.isMatch = async function (password) {
  return await compare(password, this.password);
};

const User = model('users', UserSchema);

export default User;
