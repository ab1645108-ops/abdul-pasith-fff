import crypto from "crypto";
import { Router, Request, Response, NextFunction } from "express";
import { UserRole } from "../src/types";
import { logAudit } from "./audit";

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  status: "active" | "inactive" | "suspended";
  created_at: string;
  updated_at: string;
  last_login: string | null;
  badgeNumber?: string;
  agency?: string;
  organization?: string;
  phone?: string;
}

// -------------------------------------------------------------
// Cryptographic Password Hashing & Verification (PBKDF2-SHA512)
// -------------------------------------------------------------
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const iterations = 100000;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
  return `pbkdf2:${iterations}:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
    const iterations = parseInt(parts[1], 10);
    const salt = parts[2];
    const originalHash = parts[3];
    const testHash = crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
    return crypto.timingSafeEqual(Buffer.from(testHash, "hex"), Buffer.from(originalHash, "hex"));
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// JWT Token Generator & Verifier (HMAC-SHA256)
// -------------------------------------------------------------
function getSecret(): string {
  return process.env.JWT_SECRET || process.env.SESSION_SECRET || "findsafe_secure_session_secret_key_2026";
}

export function generateToken(payload: { userId: string; email: string; role: UserRole }): string {
  const secret = getSecret();
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + 86400 * 3; // 3-day validity
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): { userId: string; email: string; role: UserRole; exp: number } | null {
  try {
    const secret = getSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", secret).update(`${header}.${body}`).digest("base64url");
    if (signature !== expectedSignature) return null;
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    return decoded;
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// User In-Memory Database with Default Seed Accounts
// -------------------------------------------------------------
const USERS_DB: Map<string, UserEntity> = new Map();

function seedUsers() {
  const initialUsers: UserEntity[] = [
    {
      id: "usr_admin_1",
      name: "Admin",
      email: "admin@findsafe.ai",
      password_hash: hashPassword("Admin@1234"),
      role: "ADMIN",
      status: "active",
      badgeNumber: "ADM-010",
      agency: "Operations & Dispatch Command",
      created_at: "2026-09-01T08:00:00Z",
      updated_at: "2026-09-20T12:00:00Z",
      last_login: "2026-09-25T19:30:00Z",
      phone: "+1 (530) 555-0199",
    },
    {
      id: "usr_investigator_1",
      name: "Investigator",
      email: "investigator@findsafe.ai",
      password_hash: hashPassword("Investigator@1234"),
      role: "INVESTIGATOR",
      status: "active",
      badgeNumber: "INV-4108",
      agency: "Special Investigations Unit",
      created_at: "2026-09-05T09:30:00Z",
      updated_at: "2026-09-21T10:15:00Z",
      last_login: "2026-09-25T20:10:00Z",
      phone: "+1 (916) 555-0142",
    },
    {
      id: "usr_citizen_1",
      name: "Public User",
      email: "citizen@findsafe.ai",
      password_hash: hashPassword("Citizen@1234"),
      role: "CITIZEN",
      status: "active",
      organization: "Community Reporting Desk",
      created_at: "2026-09-10T14:20:00Z",
      updated_at: "2026-09-22T11:00:00Z",
      last_login: "2026-09-25T18:45:00Z",
      phone: "+1 (916) 555-0188",
    },
  ];

  for (const user of initialUsers) {
    USERS_DB.set(user.id, user);
  }
}

seedUsers();

export function sanitizeUser(user: UserEntity): Omit<UserEntity, "password_hash"> {
  const { password_hash, ...safe } = user;
  return safe;
}

export function findUserByEmail(email: string): UserEntity | undefined {
  const normalized = email.trim().toLowerCase();
  for (const user of USERS_DB.values()) {
    if (user.email.toLowerCase() === normalized) {
      return user;
    }
  }
  if (normalized === "m.hayes@rosevillepd.gov") return USERS_DB.get("usr_investigator_1");
  if (normalized === "s.jenkins@placersheriff.gov") return USERS_DB.get("usr_admin_1");
  if (normalized === "alex.rivera@community.org") return USERS_DB.get("usr_citizen_1");
  return undefined;
}

export function findUserById(id: string): UserEntity | undefined {
  return USERS_DB.get(id);
}

// -------------------------------------------------------------
// Authentication & Role-Based Middleware
// -------------------------------------------------------------
export function extractAuthUser(req: Request): UserEntity | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    if (decoded && decoded.userId) {
      const user = USERS_DB.get(decoded.userId);
      if (user) return user;
    }
  }

  // Fallback to legacy headers for seamless backward-compatibility
  const legacyUserId = req.headers["x-user-id"] as string;
  if (legacyUserId && USERS_DB.has(legacyUserId)) {
    return USERS_DB.get(legacyUserId)!;
  }

  return null;
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const user = extractAuthUser(req);
  if (!user) {
    return res.status(401).json({
      error: "Unauthorized: Valid authentication session is required.",
      code: "UNAUTHORIZED",
    });
  }

  if (user.status !== "active") {
    return res.status(403).json({
      error: `Your account is ${user.status}. Please contact an administrator.`,
      code: "ACCOUNT_INACTIVE",
    });
  }

  (req as any).user = sanitizeUser(user);
  (req as any).rawUser = user;
  next();
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = extractAuthUser(req);

    if (!user) {
      logAudit(
        { id: "usr_guest", name: "Unauthenticated Request", role: "CITIZEN" },
        "UNAUTHORIZED_ACCESS",
        req.baseUrl + req.path,
        undefined,
        "FORBIDDEN",
        `Access to ${req.method} ${req.originalUrl} rejected: missing or invalid session token.`,
        req
      );

      return res.status(401).json({
        error: "Unauthorized: Please log in to access this resource.",
        code: "UNAUTHORIZED",
      });
    }

    if (user.status !== "active") {
      logAudit(
        { id: user.id, name: user.name, role: user.role },
        "UNAUTHORIZED_ACCESS",
        req.baseUrl + req.path,
        user.id,
        "FORBIDDEN",
        `Access blocked: User account status is ${user.status}.`,
        req
      );

      return res.status(403).json({
        error: `Your account is ${user.status}. Please contact an administrator.`,
        code: "ACCOUNT_INACTIVE",
      });
    }

    // Role check: treat PUBLIC_USER and CITIZEN as interchangeable citizen roles
    const normalizedUserRole = user.role === "PUBLIC_USER" ? "CITIZEN" : user.role;
    const isAuthorized = allowedRoles.some((r) => {
      const normalizedReqRole = r === "PUBLIC_USER" ? "CITIZEN" : r;
      return normalizedReqRole === normalizedUserRole;
    });

    if (!isAuthorized) {
      logAudit(
        { id: user.id, name: user.name, role: user.role },
        "UNAUTHORIZED_ACCESS",
        req.baseUrl + req.path,
        user.id,
        "FORBIDDEN",
        `Access to ${req.method} ${req.originalUrl} blocked: Requires [${allowedRoles.join(", ")}], but user holds role [${user.role}].`,
        req
      );

      return res.status(403).json({
        error: "Forbidden: You do not have permission to access this page or perform this action.",
        code: "FORBIDDEN",
        requiredRoles: allowedRoles,
        currentRole: user.role,
      });
    }

    (req as any).user = sanitizeUser(user);
    (req as any).rawUser = user;
    next();
  };
}

// -------------------------------------------------------------
// Authentication & User Management Express Router
// -------------------------------------------------------------
export function setupAuthRouter(): Router {
  const router = Router();

  // -----------------------------------------------------------
  // 1. User Registration Flow
  // -----------------------------------------------------------
  router.post("/auth/register", (req: Request, res: Response) => {
    try {
      const { name, email, password, confirmPassword } = req.body;

      // Input Validation
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email, and password are required." });
      }

      const trimmedName = name.trim();
      const trimmedEmail = email.trim().toLowerCase();

      if (trimmedName.length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters long." });
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address." });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters long." });
      }

      if (confirmPassword && password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match." });
      }

      // Check if email already exists
      if (findUserByEmail(trimmedEmail)) {
        return res.status(409).json({ error: "An account with this email address already exists." });
      }

      // Hash password and assign default CITIZEN role
      const password_hash = hashPassword(password);
      const now = new Date().toISOString();
      const newUser: UserEntity = {
        id: `usr_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        name: trimmedName,
        email: trimmedEmail,
        password_hash,
        role: "CITIZEN",
        status: "active",
        created_at: now,
        updated_at: now,
        last_login: null,
      };

      USERS_DB.set(newUser.id, newUser);

      logAudit(
        { id: newUser.id, name: newUser.name, role: newUser.role },
        "USER_REGISTERED",
        "User",
        newUser.id,
        "SUCCESS",
        `New citizen account registered: ${newUser.name} (${newUser.email}). Default role CITIZEN assigned.`,
        req
      );

      res.status(201).json({
        success: true,
        message: "Registration successful. Please log in with your credentials.",
        user: sanitizeUser(newUser),
      });
    } catch (err: any) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Failed to complete registration." });
    }
  });

  // -----------------------------------------------------------
  // 2. User Login Flow
  // -----------------------------------------------------------
  router.post("/auth/login", (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }

      const user = findUserByEmail(email);

      // Secure generic failure message if user doesn't exist
      if (!user) {
        logAudit(
          { id: "unknown", name: email, role: "CITIZEN" },
          "LOGIN_FAILED",
          "Session",
          undefined,
          "FAILED",
          `Failed login attempt: Email ${email} not found.`,
          req
        );
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Verify password hash
      const isValid = verifyPassword(password, user.password_hash);
      if (!isValid) {
        logAudit(
          { id: user.id, name: user.name, role: user.role },
          "LOGIN_FAILED",
          "Session",
          user.id,
          "FAILED",
          `Failed login attempt for ${user.email}: Incorrect password.`,
          req
        );
        return res.status(401).json({ error: "Invalid email or password." });
      }

      // Check account status
      if (user.status !== "active") {
        logAudit(
          { id: user.id, name: user.name, role: user.role },
          "LOGIN_FAILED",
          "Session",
          user.id,
          "FORBIDDEN",
          `Login rejected for ${user.email}: Account status is ${user.status}.`,
          req
        );
        return res.status(403).json({
          error: `Your account is ${user.status}. Please contact an administrator.`,
        });
      }

      // Update last_login
      const now = new Date().toISOString();
      user.last_login = now;
      user.updated_at = now;

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logAudit(
        { id: user.id, name: user.name, role: user.role },
        "LOGIN_SUCCESS",
        "Session",
        user.id,
        "SUCCESS",
        `User logged in successfully: ${user.name} (${user.role}).`,
        req
      );

      res.json({
        success: true,
        token,
        user: sanitizeUser(user),
      });
    } catch (err: any) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Authentication service error." });
    }
  });

  // -----------------------------------------------------------
  // 3. User Logout Flow
  // -----------------------------------------------------------
  router.post("/auth/logout", (req: Request, res: Response) => {
    const user = extractAuthUser(req);
    if (user) {
      logAudit(
        { id: user.id, name: user.name, role: user.role },
        "LOGOUT",
        "Session",
        user.id,
        "SUCCESS",
        `User logged out: ${user.name}.`,
        req
      );
    }
    res.json({ success: true, message: "Logged out successfully." });
  });

  // -----------------------------------------------------------
  // 4. Current User Session Check (/auth/me)
  // -----------------------------------------------------------
  router.get("/auth/me", authenticate, (req: Request, res: Response) => {
    const user = (req as any).user;
    res.json({ user });
  });

  // -----------------------------------------------------------
  // 5. Update Own Profile (/auth/profile)
  // -----------------------------------------------------------
  router.put("/auth/profile", authenticate, (req: Request, res: Response) => {
    try {
      const activeUser = (req as any).rawUser as UserEntity;
      const { name, phone, organization, agency, currentPassword, newPassword } = req.body;

      if (name && name.trim().length >= 2) {
        activeUser.name = name.trim();
      }

      if (phone !== undefined) activeUser.phone = phone.trim();
      if (organization !== undefined) activeUser.organization = organization.trim();
      if (agency !== undefined && activeUser.role !== "CITIZEN") {
        activeUser.agency = agency.trim();
      }

      // Password change if requested
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ error: "Current password is required to set a new password." });
        }
        if (!verifyPassword(currentPassword, activeUser.password_hash)) {
          return res.status(400).json({ error: "Current password is incorrect." });
        }
        if (newPassword.length < 8) {
          return res.status(400).json({ error: "New password must be at least 8 characters long." });
        }
        activeUser.password_hash = hashPassword(newPassword);
      }

      activeUser.updated_at = new Date().toISOString();

      logAudit(
        { id: activeUser.id, name: activeUser.name, role: activeUser.role },
        "PROFILE_UPDATED",
        "User",
        activeUser.id,
        "SUCCESS",
        `User profile updated for ${activeUser.name}.`,
        req
      );

      res.json({
        success: true,
        message: "Profile updated successfully.",
        user: sanitizeUser(activeUser),
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update profile." });
    }
  });

  // ===========================================================
  // ADMIN USER MANAGEMENT ENDPOINTS
  // ===========================================================

  // 6. List all users with search, role, and status filtering
  router.get("/admin/users", requireRole(["ADMIN"]), (req: Request, res: Response) => {
    try {
      const { search, role, status } = req.query;
      let users = Array.from(USERS_DB.values()).map(sanitizeUser);

      if (search && typeof search === "string") {
        const query = search.toLowerCase();
        users = users.filter(
          (u) =>
            u.name.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            (u.badgeNumber && u.badgeNumber.toLowerCase().includes(query)) ||
            (u.agency && u.agency.toLowerCase().includes(query))
        );
      }

      if (role && typeof role === "string" && role !== "ALL") {
        users = users.filter((u) => u.role === role);
      }

      if (status && typeof status === "string" && status !== "ALL") {
        users = users.filter((u) => u.status === status);
      }

      // Sort by newest first
      users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      res.json({ users, total: users.length });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to retrieve user list." });
    }
  });

  // 7. Update User Role
  router.put("/admin/users/:id/role", requireRole(["ADMIN"]), (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const actor = (req as any).user;

      const target = USERS_DB.get(id);
      if (!target) {
        return res.status(404).json({ error: "User not found." });
      }

      const validRoles: UserRole[] = ["CITIZEN", "PUBLIC_USER", "INVESTIGATOR", "ADMIN"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: `Invalid role specified: ${role}` });
      }

      // Protect against demoting the last active administrator
      if (target.id === actor.id && role !== "ADMIN") {
        return res.status(400).json({ error: "You cannot demote your own administrator account." });
      }

      const prevRole = target.role;
      target.role = role === "PUBLIC_USER" ? "CITIZEN" : role;
      target.updated_at = new Date().toISOString();

      logAudit(
        actor,
        "ROLE_CHANGED",
        "User",
        target.id,
        "SUCCESS",
        `Changed role for user ${target.name} (${target.email}) from ${prevRole} to ${target.role}.`,
        req
      );

      res.json({
        success: true,
        message: `Role successfully updated to ${target.role}.`,
        user: sanitizeUser(target),
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update role." });
    }
  });

  // 8. Update User Status (Activate, Deactivate, Suspend)
  router.put("/admin/users/:id/status", requireRole(["ADMIN"]), (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const actor = (req as any).user;

      const target = USERS_DB.get(id);
      if (!target) {
        return res.status(404).json({ error: "User not found." });
      }

      if (!["active", "inactive", "suspended"].includes(status)) {
        return res.status(400).json({ error: "Status must be active, inactive, or suspended." });
      }

      // Prevent administrator from deactivating themselves
      if (target.id === actor.id && status !== "active") {
        return res.status(400).json({ error: "You cannot deactivate or suspend your own administrator account." });
      }

      const prevStatus = target.status;
      target.status = status;
      target.updated_at = new Date().toISOString();

      const action = status === "active" ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED";

      logAudit(
        actor,
        action,
        "User",
        target.id,
        "SUCCESS",
        `Admin ${actor.name} changed account status for ${target.name} from ${prevStatus} to ${status}.`,
        req
      );

      res.json({
        success: true,
        message: `Account status updated to ${status}.`,
        user: sanitizeUser(target),
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update account status." });
    }
  });

  // 9. Admin edit user details
  router.put("/admin/users/:id", requireRole(["ADMIN"]), (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { name, email, badgeNumber, agency, organization, phone } = req.body;
      const actor = (req as any).user;

      const target = USERS_DB.get(id);
      if (!target) {
        return res.status(404).json({ error: "User not found." });
      }

      if (name) target.name = name.trim();
      if (email) target.email = email.trim().toLowerCase();
      if (badgeNumber !== undefined) target.badgeNumber = badgeNumber.trim();
      if (agency !== undefined) target.agency = agency.trim();
      if (organization !== undefined) target.organization = organization.trim();
      if (phone !== undefined) target.phone = phone.trim();

      target.updated_at = new Date().toISOString();

      logAudit(
        actor,
        "USER_PROFILE_ADMIN_EDITED",
        "User",
        target.id,
        "SUCCESS",
        `Admin ${actor.name} edited details for user ${target.name} (${target.id}).`,
        req
      );

      res.json({
        success: true,
        message: "User details updated successfully.",
        user: sanitizeUser(target),
      });
    } catch (err: any) {
      res.status(500).json({ error: "Failed to update user." });
    }
  });

  return router;
}
