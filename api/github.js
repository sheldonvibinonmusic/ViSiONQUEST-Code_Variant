/**
 * Project Graveyard — Private GitHub OAuth Serverless Endpoint
 * Vercel Serverless Function (Node.js runtime)
 *
 * Provides honest status checks, OAuth authorization redirects, code exchange,
 * authenticated user profile retrieval, and private repository discovery.
 *
 * If GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET are not configured in the host environment,
 * returns an informative status payload rather than failing or returning 500.
 */

const crypto = require("crypto");

module.exports = async function handler(req, res) {
  // CORS & Security Headers
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");

  const clientId = process.env.GITHUB_CLIENT_ID || "";
  const clientSecret = process.env.GITHUB_CLIENT_SECRET || "";
  const appBaseUrl = process.env.APP_BASE_URL || (req.headers["x-forwarded-proto"] ? `${req.headers["x-forwarded-proto"]}://${req.headers.host}` : `http://${req.headers.host || "localhost:3000"}`);
  const encryptionKey = process.env.SESSION_ENCRYPTION_KEY || "";

  const isConfigured = Boolean(clientId && clientSecret);

  // Helper: parse cookies
  function parseCookies(cookieHeader) {
    const list = {};
    if (!cookieHeader) return list;
    cookieHeader.split(";").forEach(cookie => {
      const parts = cookie.split("=");
      const key = parts.shift().trim();
      const value = decodeURIComponent(parts.join("="));
      if (key) list[key] = value;
    });
    return list;
  }

  // Simple token encryption / decryption if session encryption key is provided
  function encryptToken(token) {
    if (!encryptionKey || encryptionKey.length < 16) return Buffer.from(token).toString("base64");
    try {
      const iv = crypto.randomBytes(16);
      const key = crypto.createHash("sha256").update(encryptionKey).digest();
      const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
      let enc = cipher.update(token, "utf8", "hex");
      enc += cipher.final("hex");
      const tag = cipher.getAuthTag().toString("hex");
      return `${iv.toString("hex")}:${tag}:${enc}`;
    } catch (_) {
      return Buffer.from(token).toString("base64");
    }
  }

  function decryptToken(cipherText) {
    if (!cipherText) return null;
    if (!encryptionKey || encryptionKey.length < 16) {
      try {
        return Buffer.from(cipherText, "base64").toString("utf8");
      } catch (_) {
        return null;
      }
    }
    try {
      const parts = cipherText.split(":");
      if (parts.length !== 3) {
        return Buffer.from(cipherText, "base64").toString("utf8");
      }
      const [ivHex, tagHex, encrypted] = parts;
      const iv = Buffer.from(ivHex, "hex");
      const tag = Buffer.from(tagHex, "hex");
      const key = crypto.createHash("sha256").update(encryptionKey).digest();
      const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
      decipher.setAuthTag(tag);
      let dec = decipher.update(encrypted, "hex", "utf8");
      dec += decipher.final("utf8");
      return dec;
    } catch (_) {
      try {
        return Buffer.from(cipherText, "base64").toString("utf8");
      } catch (__) {
        return null;
      }
    }
  }

  const query = req.query || {};
  const action = query.action || (req.method === "POST" && req.body && req.body.action) || "status";
  const cookies = parseCookies(req.headers.cookie);
  const token = decryptToken(cookies.pg_gh_token);

  // Status check (Always available)
  if (action === "status") {
    res.status(200).json({
      configured: isConfigured,
      authenticated: Boolean(token),
      message: isConfigured
        ? (token ? "Connected to GitHub OAuth session." : "GitHub OAuth configured and ready for connection.")
        : "Private GitHub OAuth is unconfigured in this deployment. Set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in Vercel to enable private repository access. Public repository import is fully active."
    });
    return;
  }

  // If not configured, block actions that require credentials
  if (!isConfigured) {
    res.status(200).json({
      configured: false,
      authenticated: false,
      error: "unconfigured",
      message: "Private GitHub OAuth is not configured on this host. Use public repository imports or configure GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET."
    });
    return;
  }

  // 1. Login redirect
  if (action === "login") {
    const state = crypto.randomBytes(16).toString("hex");
    const redirectUri = `${appBaseUrl.replace(/\/$/, "")}/api/github?action=callback`;
    const authorizeUrl = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,read:user,user:email&state=${state}`;

    res.setHeader("Set-Cookie", `pg_gh_state=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    if (query.format === "json") {
      res.status(200).json({ url: authorizeUrl });
    } else {
      res.redirect(302, authorizeUrl);
    }
    return;
  }

  // 2. OAuth Callback
  if (action === "callback") {
    const { code, state } = query;
    const storedState = cookies.pg_gh_state;

    if (!code || !state || (storedState && state !== storedState)) {
      res.status(400).send("GitHub authentication state mismatch or missing authorization code. Please retry.");
      return;
    }

    try {
      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code
        })
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error || !tokenData.access_token) {
        res.status(400).send(`GitHub authorization failed: ${tokenData.error_description || tokenData.error}`);
        return;
      }

      const encrypted = encryptToken(tokenData.access_token);
      res.setHeader("Set-Cookie", [
        `pg_gh_token=${encodeURIComponent(encrypted)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
        `pg_gh_state=; Path=/; HttpOnly; Max-Age=0`
      ]);

      res.redirect(302, `${appBaseUrl.replace(/\/$/, "")}/?gh_auth=success`);
    } catch (err) {
      res.status(500).send(`OAuth token exchange error: ${err.message}`);
    }
    return;
  }

  // 3. User profile
  if (action === "user") {
    if (!token) {
      res.status(401).json({ authenticated: false, error: "No active GitHub OAuth session" });
      return;
    }

    try {
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": "Project-Graveyard-Archive",
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (!userRes.ok) {
        res.status(userRes.status).json({ error: "Failed to fetch user profile from GitHub" });
        return;
      }

      const u = await userRes.json();
      res.status(200).json({
        authenticated: true,
        user: {
          login: u.login,
          id: u.id,
          name: u.name || u.login,
          avatar_url: u.avatar_url,
          html_url: u.html_url,
          public_repos: u.public_repos,
          total_private_repos: u.total_private_repos
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // 4. Repositories
  if (action === "repos") {
    if (!token) {
      res.status(401).json({ authenticated: false, error: "No active GitHub OAuth session" });
      return;
    }

    try {
      const reposRes = await fetch("https://api.github.com/user/repos?sort=updated&per_page=50", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "User-Agent": "Project-Graveyard-Archive",
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (!reposRes.ok) {
        res.status(reposRes.status).json({ error: "Failed to fetch repositories from GitHub" });
        return;
      }

      const repos = await reposRes.json();
      const sanitized = (Array.isArray(repos) ? repos : []).map(r => ({
        id: r.id,
        name: r.name,
        full_name: r.full_name,
        private: r.private,
        html_url: r.html_url,
        description: r.description,
        language: r.language,
        default_branch: r.default_branch,
        updated_at: r.updated_at
      }));

      res.status(200).json({ authenticated: true, repos: sanitized });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    return;
  }

  // 5. Disconnect
  if (action === "disconnect") {
    res.setHeader("Set-Cookie", `pg_gh_token=; Path=/; HttpOnly; Max-Age=0`);
    res.status(200).json({ success: true, message: "Disconnected from GitHub OAuth." });
    return;
  }

  res.status(400).json({ error: "Unknown action" });
};
