import type { AuthResponse, AuthTokens, LoginInput, RegisterInput, ResetPasswordInput } from '@mindbridge/shared';
import { env } from '../../config/env.js';
import { randomToken, sha256 } from '../../common/crypto.js';
import { AppError, badRequest, conflict, unauthorized } from '../../common/errors.js';
import { logger } from '../../common/logger.js';
import { mailer } from '../../common/mailer.js';
import { toProfile } from '../../common/serializers.js';
import { signAccessToken } from '../../common/tokens.js';
import { ConsentModel, CURRENT_POLICY_VERSION } from '../privacy/consent.model.js';
import { UserModel } from '../students/user.model.js';
import { burnPasswordCheck, hashPassword, verifyPassword } from './password.js';
import { RefreshTokenModel } from './refresh-token.model.js';

const RESET_TTL_MS = 30 * 60_000;

async function issueTokens(userId: string, family = randomToken(16)): Promise<AuthTokens> {
  const refreshToken = randomToken();
  await RefreshTokenModel.create({
    user: userId,
    tokenHash: sha256(refreshToken),
    family,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
  });
  return { accessToken: signAccessToken({ sub: userId }), refreshToken, expiresIn: env.ACCESS_TOKEN_TTL_SECONDS };
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  if (await UserModel.exists({ email: input.email })) throw conflict('An account with this email already exists');
  const user = await UserModel.create({
    email: input.email,
    passwordHash: await hashPassword(input.password),
    displayName: input.displayName,
    lastActiveAt: new Date(),
  });
  await ConsentModel.create({
    student: user._id,
    type: 'TERMS_AND_PRIVACY',
    granted: true,
    policyVersion: CURRENT_POLICY_VERSION,
    history: [{ granted: true, policyVersion: CURRENT_POLICY_VERSION }],
  });
  return { user: toProfile(user), tokens: await issueTokens(user.id) };
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const user = await UserModel.findOne({ email: input.email }).select('+passwordHash').populate('university', 'name');
  if (!user) {
    await burnPasswordCheck(input.password);
    throw unauthorized('Email or password is incorrect');
  }
  if (!(await verifyPassword(user.passwordHash, input.password))) throw unauthorized('Email or password is incorrect');
  if (user.status !== 'ACTIVE') throw new AppError(403, 'ACCOUNT_DEACTIVATED', 'This account has been deactivated');
  user.lastActiveAt = new Date();
  await user.save();
  return { user: toProfile(user), tokens: await issueTokens(user.id) };
}

/**
 * Refresh-token rotation with reuse detection: presenting a token that was
 * already rotated revokes the whole token family (likely theft).
 */
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const record = await RefreshTokenModel.findOne({ tokenHash: sha256(refreshToken) });
  if (!record || record.expiresAt < new Date()) throw unauthorized('Session expired. Please sign in again.');
  if (record.revokedAt) {
    await RefreshTokenModel.updateMany({ family: record.family, revokedAt: null }, { revokedAt: new Date() });
    logger.warn({ userId: record.user.toString() }, 'Refresh token reuse detected; family revoked');
    throw unauthorized('Session expired. Please sign in again.');
  }
  const user = await UserModel.findById(record.user);
  if (!user || user.status !== 'ACTIVE') throw unauthorized('Session expired. Please sign in again.');

  const tokens = await issueTokens(user.id, record.family);
  record.revokedAt = new Date();
  record.replacedBy = sha256(tokens.refreshToken);
  await record.save();
  return tokens;
}

export async function logout(refreshToken: string): Promise<void> {
  await RefreshTokenModel.updateOne({ tokenHash: sha256(refreshToken), revokedAt: null }, { revokedAt: new Date() });
}

/** Always resolves the same way whether or not the email exists. */
export async function forgotPassword(email: string): Promise<void> {
  const user = await UserModel.findOne({ email });
  if (!user || user.status !== 'ACTIVE') return;
  const token = randomToken(32);
  await UserModel.updateOne(
    { _id: user._id },
    { passwordReset: { tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) } },
  );
  const link = `${env.PASSWORD_RESET_URL}?token=${encodeURIComponent(token)}`;
  await mailer.send(
    user.email,
    'Reset your MindBridge AI password',
    `Hi ${user.displayName},\n\nUse this link within 30 minutes to choose a new password:\n${link}\n\nIf you didn't ask for this, you can ignore this email.\n\n— MindBridge AI`,
  );
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  const user = await UserModel.findOne({
    'passwordReset.tokenHash': sha256(input.token),
    'passwordReset.expiresAt': { $gt: new Date() },
  });
  if (!user) throw badRequest('This reset link is invalid or has expired');
  await UserModel.updateOne(
    { _id: user._id },
    { passwordHash: await hashPassword(input.password), $unset: { passwordReset: 1 } },
  );
  await RefreshTokenModel.updateMany({ user: user._id, revokedAt: null }, { revokedAt: new Date() });
}
