const JSON_HEADERS = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "no-store"
};

const MAX_PLUSHIE_NAME_LENGTH = 80;
const MAX_STORY_LENGTH = 1000;
const COMMON_EMAIL_DOMAIN_TYPOS = new Set([
  "qq.co",
  "gmail.co",
  "hotmail.co",
  "outlook.co",
  "icloud.co",
  "163.co",
  "126.co"
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

function readEnv(env, key) {
  const value = env?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function fieldName(env, key, fallback) {
  return readEnv(env, key) || fallback;
}

function requireEnv(env) {
  const missing = ["FEISHU_APP_ID", "FEISHU_APP_SECRET", "FEISHU_APP_TOKEN", "FEISHU_TABLE_ID"].filter(
    (key) => !readEnv(env, key)
  );

  return missing;
}

function normalizePayload(data) {
  return {
    email: String(data?.email ?? "").trim().toLowerCase(),
    plushieName: String(data?.plushieName ?? "").trim(),
    plushieStory: String(data?.plushieStory ?? "").trim(),
    language: String(data?.language ?? "").trim(),
    source: String(data?.source ?? "landing_page").trim(),
    pageUrl: String(data?.pageUrl ?? "").trim(),
    referrer: String(data?.referrer ?? "").trim(),
    utmSource: String(data?.utmSource ?? "").trim(),
    utmMedium: String(data?.utmMedium ?? "").trim(),
    utmCampaign: String(data?.utmCampaign ?? "").trim()
  };
}

function validatePayload(payload) {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emailDomain = payload.email.split("@")[1] ?? "";

  if (!emailPattern.test(payload.email) || COMMON_EMAIL_DOMAIN_TYPOS.has(emailDomain)) {
    return "invalid_email";
  }

  if (!payload.plushieName) {
    return "missing_plushie_name";
  }

  if (payload.plushieName.length > MAX_PLUSHIE_NAME_LENGTH) {
    return "plushie_name_too_long";
  }

  if (payload.plushieStory.length > MAX_STORY_LENGTH) {
    return "story_too_long";
  }

  return "";
}

function getCountry(context) {
  return (
    context?.geo?.countryCodeAlpha2 ||
    context?.request?.eo?.geo?.countryCodeAlpha2 ||
    context?.request?.headers?.get("EO-Client-IPCountry") ||
    context?.request?.headers?.get("CF-IPCountry") ||
    ""
  );
}

async function getTenantAccessToken(env) {
  const response = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({
      app_id: readEnv(env, "FEISHU_APP_ID"),
      app_secret: readEnv(env, "FEISHU_APP_SECRET")
    })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.code !== 0 || !result.tenant_access_token) {
    throw new FeishuError("feishu_auth_failed", result.code ?? response.status, result.msg ?? result.message ?? "");
  }

  return result.tenant_access_token;
}

class FeishuError extends Error {
  constructor(reason, code, message) {
    super(reason);
    this.reason = reason;
    this.code = code;
    this.feishuMessage = message;
  }
}

async function resolveBitableAppToken(env, token) {
  const configuredToken = readEnv(env, "FEISHU_APP_TOKEN");
  const response = await fetch(
    `https://open.feishu.cn/open-apis/wiki/v2/spaces/get_node?token=${encodeURIComponent(configuredToken)}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.code !== 0) {
    return configuredToken;
  }

  const node = result.data?.node;

  if (node?.obj_type === "bitable" && node?.obj_token) {
    return node.obj_token;
  }

  return configuredToken;
}

async function createBitableRecord(env, token, appTokenValue, fields) {
  const appToken = encodeURIComponent(appTokenValue);
  const tableId = encodeURIComponent(readEnv(env, "FEISHU_TABLE_ID"));
  const response = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8"
    },
    body: JSON.stringify({ fields })
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok || result.code !== 0) {
    throw new FeishuError("feishu_record_failed", result.code ?? response.status, result.msg ?? result.message ?? "");
  }

  return result.data?.record;
}

async function handlePost(context) {
  const { request, env } = context;
  const missingEnv = requireEnv(env);

  if (missingEnv.length > 0) {
    return json({ ok: false, error: "missing_env", missing: missingEnv }, 500);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const payload = normalizePayload(data);
  const validationError = validatePayload(payload);

  if (validationError) {
    return json({ ok: false, error: validationError }, 400);
  }

  const fields = {
    [fieldName(env, "FEISHU_FIELD_EMAIL", "Email")]: payload.email,
    [fieldName(env, "FEISHU_FIELD_PLUSHIE_NAME", "Plushie Name")]: payload.plushieName,
    [fieldName(env, "FEISHU_FIELD_STORY", "Story")]: payload.plushieStory,
    [fieldName(env, "FEISHU_FIELD_LANGUAGE", "Language")]: payload.language,
    [fieldName(env, "FEISHU_FIELD_SOURCE", "Source")]: payload.source || "landing_page",
    [fieldName(env, "FEISHU_FIELD_PAGE_URL", "Page URL")]: payload.pageUrl,
    [fieldName(env, "FEISHU_FIELD_REFERRER", "Referrer")]: payload.referrer,
    [fieldName(env, "FEISHU_FIELD_UTM_SOURCE", "UTM Source")]: payload.utmSource,
    [fieldName(env, "FEISHU_FIELD_UTM_MEDIUM", "UTM Medium")]: payload.utmMedium,
    [fieldName(env, "FEISHU_FIELD_UTM_CAMPAIGN", "UTM Campaign")]: payload.utmCampaign,
    [fieldName(env, "FEISHU_FIELD_COUNTRY", "Country")]: getCountry(context),
    [fieldName(env, "FEISHU_FIELD_USER_AGENT", "User Agent")]: request.headers.get("User-Agent") || "",
    [fieldName(env, "FEISHU_FIELD_SUBMITTED_AT", "Submitted At")]: new Date().toISOString()
  };

  try {
    const token = await getTenantAccessToken(env);
    const appToken = await resolveBitableAppToken(env, token);
    const record = await createBitableRecord(env, token, appToken, fields);

    return json({ ok: true, recordId: record?.record_id ?? null });
  } catch (error) {
    console.error(error);
    if (error instanceof FeishuError) {
      return json(
        {
          ok: false,
          error: error.reason,
          code: error.code,
          message: error.feishuMessage
        },
        502
      );
    }

    return json({ ok: false, error: "feishu_write_failed" }, 502);
  }
}

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: JSON_HEADERS
    });
  }

  if (context.request.method === "POST") {
    return handlePost(context);
  }

  return json({ ok: false, error: "method_not_allowed" }, 405);
}
