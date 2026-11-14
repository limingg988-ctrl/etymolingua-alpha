var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// node_modules/jose/dist/browser/runtime/webcrypto.js
var webcrypto_default = crypto;
var isCryptoKey = /* @__PURE__ */ __name((key) => key instanceof CryptoKey, "isCryptoKey");

// node_modules/jose/dist/browser/lib/buffer_utils.js
var encoder = new TextEncoder();
var decoder = new TextDecoder();
var MAX_INT32 = 2 ** 32;
function concat(...buffers) {
  const size = buffers.reduce((acc, { length }) => acc + length, 0);
  const buf = new Uint8Array(size);
  let i = 0;
  for (const buffer of buffers) {
    buf.set(buffer, i);
    i += buffer.length;
  }
  return buf;
}
__name(concat, "concat");

// node_modules/jose/dist/browser/runtime/base64url.js
var decodeBase64 = /* @__PURE__ */ __name((encoded) => {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}, "decodeBase64");
var decode = /* @__PURE__ */ __name((input) => {
  let encoded = input;
  if (encoded instanceof Uint8Array) {
    encoded = decoder.decode(encoded);
  }
  encoded = encoded.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
  try {
    return decodeBase64(encoded);
  } catch {
    throw new TypeError("The input to be decoded is not correctly encoded.");
  }
}, "decode");

// node_modules/jose/dist/browser/util/errors.js
var JOSEError = class extends Error {
  static {
    __name(this, "JOSEError");
  }
  constructor(message2, options) {
    super(message2, options);
    this.code = "ERR_JOSE_GENERIC";
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
};
JOSEError.code = "ERR_JOSE_GENERIC";
var JWTClaimValidationFailed = class extends JOSEError {
  static {
    __name(this, "JWTClaimValidationFailed");
  }
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
JWTClaimValidationFailed.code = "ERR_JWT_CLAIM_VALIDATION_FAILED";
var JWTExpired = class extends JOSEError {
  static {
    __name(this, "JWTExpired");
  }
  constructor(message2, payload, claim = "unspecified", reason = "unspecified") {
    super(message2, { cause: { claim, reason, payload } });
    this.code = "ERR_JWT_EXPIRED";
    this.claim = claim;
    this.reason = reason;
    this.payload = payload;
  }
};
JWTExpired.code = "ERR_JWT_EXPIRED";
var JOSEAlgNotAllowed = class extends JOSEError {
  static {
    __name(this, "JOSEAlgNotAllowed");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JOSE_ALG_NOT_ALLOWED";
  }
};
JOSEAlgNotAllowed.code = "ERR_JOSE_ALG_NOT_ALLOWED";
var JOSENotSupported = class extends JOSEError {
  static {
    __name(this, "JOSENotSupported");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JOSE_NOT_SUPPORTED";
  }
};
JOSENotSupported.code = "ERR_JOSE_NOT_SUPPORTED";
var JWEDecryptionFailed = class extends JOSEError {
  static {
    __name(this, "JWEDecryptionFailed");
  }
  constructor(message2 = "decryption operation failed", options) {
    super(message2, options);
    this.code = "ERR_JWE_DECRYPTION_FAILED";
  }
};
JWEDecryptionFailed.code = "ERR_JWE_DECRYPTION_FAILED";
var JWEInvalid = class extends JOSEError {
  static {
    __name(this, "JWEInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWE_INVALID";
  }
};
JWEInvalid.code = "ERR_JWE_INVALID";
var JWSInvalid = class extends JOSEError {
  static {
    __name(this, "JWSInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWS_INVALID";
  }
};
JWSInvalid.code = "ERR_JWS_INVALID";
var JWTInvalid = class extends JOSEError {
  static {
    __name(this, "JWTInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWT_INVALID";
  }
};
JWTInvalid.code = "ERR_JWT_INVALID";
var JWKInvalid = class extends JOSEError {
  static {
    __name(this, "JWKInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWK_INVALID";
  }
};
JWKInvalid.code = "ERR_JWK_INVALID";
var JWKSInvalid = class extends JOSEError {
  static {
    __name(this, "JWKSInvalid");
  }
  constructor() {
    super(...arguments);
    this.code = "ERR_JWKS_INVALID";
  }
};
JWKSInvalid.code = "ERR_JWKS_INVALID";
var JWKSNoMatchingKey = class extends JOSEError {
  static {
    __name(this, "JWKSNoMatchingKey");
  }
  constructor(message2 = "no applicable key found in the JSON Web Key Set", options) {
    super(message2, options);
    this.code = "ERR_JWKS_NO_MATCHING_KEY";
  }
};
JWKSNoMatchingKey.code = "ERR_JWKS_NO_MATCHING_KEY";
var JWKSMultipleMatchingKeys = class extends JOSEError {
  static {
    __name(this, "JWKSMultipleMatchingKeys");
  }
  constructor(message2 = "multiple matching keys found in the JSON Web Key Set", options) {
    super(message2, options);
    this.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
  }
};
JWKSMultipleMatchingKeys.code = "ERR_JWKS_MULTIPLE_MATCHING_KEYS";
var JWKSTimeout = class extends JOSEError {
  static {
    __name(this, "JWKSTimeout");
  }
  constructor(message2 = "request timed out", options) {
    super(message2, options);
    this.code = "ERR_JWKS_TIMEOUT";
  }
};
JWKSTimeout.code = "ERR_JWKS_TIMEOUT";
var JWSSignatureVerificationFailed = class extends JOSEError {
  static {
    __name(this, "JWSSignatureVerificationFailed");
  }
  constructor(message2 = "signature verification failed", options) {
    super(message2, options);
    this.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";
  }
};
JWSSignatureVerificationFailed.code = "ERR_JWS_SIGNATURE_VERIFICATION_FAILED";

// node_modules/jose/dist/browser/lib/crypto_key.js
function unusable(name, prop = "algorithm.name") {
  return new TypeError(`CryptoKey does not support this operation, its ${prop} must be ${name}`);
}
__name(unusable, "unusable");
function isAlgorithm(algorithm, name) {
  return algorithm.name === name;
}
__name(isAlgorithm, "isAlgorithm");
function getHashLength(hash) {
  return parseInt(hash.name.slice(4), 10);
}
__name(getHashLength, "getHashLength");
function getNamedCurve(alg) {
  switch (alg) {
    case "ES256":
      return "P-256";
    case "ES384":
      return "P-384";
    case "ES512":
      return "P-521";
    default:
      throw new Error("unreachable");
  }
}
__name(getNamedCurve, "getNamedCurve");
function checkUsage(key, usages) {
  if (usages.length && !usages.some((expected) => key.usages.includes(expected))) {
    let msg = "CryptoKey does not support this operation, its usages must include ";
    if (usages.length > 2) {
      const last = usages.pop();
      msg += `one of ${usages.join(", ")}, or ${last}.`;
    } else if (usages.length === 2) {
      msg += `one of ${usages[0]} or ${usages[1]}.`;
    } else {
      msg += `${usages[0]}.`;
    }
    throw new TypeError(msg);
  }
}
__name(checkUsage, "checkUsage");
function checkSigCryptoKey(key, alg, ...usages) {
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512": {
      if (!isAlgorithm(key.algorithm, "HMAC"))
        throw unusable("HMAC");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "RS256":
    case "RS384":
    case "RS512": {
      if (!isAlgorithm(key.algorithm, "RSASSA-PKCS1-v1_5"))
        throw unusable("RSASSA-PKCS1-v1_5");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "PS256":
    case "PS384":
    case "PS512": {
      if (!isAlgorithm(key.algorithm, "RSA-PSS"))
        throw unusable("RSA-PSS");
      const expected = parseInt(alg.slice(2), 10);
      const actual = getHashLength(key.algorithm.hash);
      if (actual !== expected)
        throw unusable(`SHA-${expected}`, "algorithm.hash");
      break;
    }
    case "EdDSA": {
      if (key.algorithm.name !== "Ed25519" && key.algorithm.name !== "Ed448") {
        throw unusable("Ed25519 or Ed448");
      }
      break;
    }
    case "Ed25519": {
      if (!isAlgorithm(key.algorithm, "Ed25519"))
        throw unusable("Ed25519");
      break;
    }
    case "ES256":
    case "ES384":
    case "ES512": {
      if (!isAlgorithm(key.algorithm, "ECDSA"))
        throw unusable("ECDSA");
      const expected = getNamedCurve(alg);
      const actual = key.algorithm.namedCurve;
      if (actual !== expected)
        throw unusable(expected, "algorithm.namedCurve");
      break;
    }
    default:
      throw new TypeError("CryptoKey does not support this operation");
  }
  checkUsage(key, usages);
}
__name(checkSigCryptoKey, "checkSigCryptoKey");

// node_modules/jose/dist/browser/lib/invalid_key_input.js
function message(msg, actual, ...types2) {
  types2 = types2.filter(Boolean);
  if (types2.length > 2) {
    const last = types2.pop();
    msg += `one of type ${types2.join(", ")}, or ${last}.`;
  } else if (types2.length === 2) {
    msg += `one of type ${types2[0]} or ${types2[1]}.`;
  } else {
    msg += `of type ${types2[0]}.`;
  }
  if (actual == null) {
    msg += ` Received ${actual}`;
  } else if (typeof actual === "function" && actual.name) {
    msg += ` Received function ${actual.name}`;
  } else if (typeof actual === "object" && actual != null) {
    if (actual.constructor?.name) {
      msg += ` Received an instance of ${actual.constructor.name}`;
    }
  }
  return msg;
}
__name(message, "message");
var invalid_key_input_default = /* @__PURE__ */ __name((actual, ...types2) => {
  return message("Key must be ", actual, ...types2);
}, "default");
function withAlg(alg, actual, ...types2) {
  return message(`Key for the ${alg} algorithm must be `, actual, ...types2);
}
__name(withAlg, "withAlg");

// node_modules/jose/dist/browser/runtime/is_key_like.js
var is_key_like_default = /* @__PURE__ */ __name((key) => {
  if (isCryptoKey(key)) {
    return true;
  }
  return key?.[Symbol.toStringTag] === "KeyObject";
}, "default");
var types = ["CryptoKey"];

// node_modules/jose/dist/browser/lib/is_disjoint.js
var isDisjoint = /* @__PURE__ */ __name((...headers) => {
  const sources = headers.filter(Boolean);
  if (sources.length === 0 || sources.length === 1) {
    return true;
  }
  let acc;
  for (const header of sources) {
    const parameters = Object.keys(header);
    if (!acc || acc.size === 0) {
      acc = new Set(parameters);
      continue;
    }
    for (const parameter of parameters) {
      if (acc.has(parameter)) {
        return false;
      }
      acc.add(parameter);
    }
  }
  return true;
}, "isDisjoint");
var is_disjoint_default = isDisjoint;

// node_modules/jose/dist/browser/lib/is_object.js
function isObjectLike(value) {
  return typeof value === "object" && value !== null;
}
__name(isObjectLike, "isObjectLike");
function isObject(input) {
  if (!isObjectLike(input) || Object.prototype.toString.call(input) !== "[object Object]") {
    return false;
  }
  if (Object.getPrototypeOf(input) === null) {
    return true;
  }
  let proto = input;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }
  return Object.getPrototypeOf(input) === proto;
}
__name(isObject, "isObject");

// node_modules/jose/dist/browser/runtime/check_key_length.js
var check_key_length_default = /* @__PURE__ */ __name((alg, key) => {
  if (alg.startsWith("RS") || alg.startsWith("PS")) {
    const { modulusLength } = key.algorithm;
    if (typeof modulusLength !== "number" || modulusLength < 2048) {
      throw new TypeError(`${alg} requires key modulusLength to be 2048 bits or larger`);
    }
  }
}, "default");

// node_modules/jose/dist/browser/lib/is_jwk.js
function isJWK(key) {
  return isObject(key) && typeof key.kty === "string";
}
__name(isJWK, "isJWK");
function isPrivateJWK(key) {
  return key.kty !== "oct" && typeof key.d === "string";
}
__name(isPrivateJWK, "isPrivateJWK");
function isPublicJWK(key) {
  return key.kty !== "oct" && typeof key.d === "undefined";
}
__name(isPublicJWK, "isPublicJWK");
function isSecretJWK(key) {
  return isJWK(key) && key.kty === "oct" && typeof key.k === "string";
}
__name(isSecretJWK, "isSecretJWK");

// node_modules/jose/dist/browser/runtime/jwk_to_key.js
function subtleMapping(jwk) {
  let algorithm;
  let keyUsages;
  switch (jwk.kty) {
    case "RSA": {
      switch (jwk.alg) {
        case "PS256":
        case "PS384":
        case "PS512":
          algorithm = { name: "RSA-PSS", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RS256":
        case "RS384":
        case "RS512":
          algorithm = { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${jwk.alg.slice(-3)}` };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "RSA-OAEP":
        case "RSA-OAEP-256":
        case "RSA-OAEP-384":
        case "RSA-OAEP-512":
          algorithm = {
            name: "RSA-OAEP",
            hash: `SHA-${parseInt(jwk.alg.slice(-3), 10) || 1}`
          };
          keyUsages = jwk.d ? ["decrypt", "unwrapKey"] : ["encrypt", "wrapKey"];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "EC": {
      switch (jwk.alg) {
        case "ES256":
          algorithm = { name: "ECDSA", namedCurve: "P-256" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES384":
          algorithm = { name: "ECDSA", namedCurve: "P-384" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ES512":
          algorithm = { name: "ECDSA", namedCurve: "P-521" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: "ECDH", namedCurve: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    case "OKP": {
      switch (jwk.alg) {
        case "Ed25519":
          algorithm = { name: "Ed25519" };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "EdDSA":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["sign"] : ["verify"];
          break;
        case "ECDH-ES":
        case "ECDH-ES+A128KW":
        case "ECDH-ES+A192KW":
        case "ECDH-ES+A256KW":
          algorithm = { name: jwk.crv };
          keyUsages = jwk.d ? ["deriveBits"] : [];
          break;
        default:
          throw new JOSENotSupported('Invalid or unsupported JWK "alg" (Algorithm) Parameter value');
      }
      break;
    }
    default:
      throw new JOSENotSupported('Invalid or unsupported JWK "kty" (Key Type) Parameter value');
  }
  return { algorithm, keyUsages };
}
__name(subtleMapping, "subtleMapping");
var parse = /* @__PURE__ */ __name(async (jwk) => {
  if (!jwk.alg) {
    throw new TypeError('"alg" argument is required when "jwk.alg" is not present');
  }
  const { algorithm, keyUsages } = subtleMapping(jwk);
  const rest = [
    algorithm,
    jwk.ext ?? false,
    jwk.key_ops ?? keyUsages
  ];
  const keyData = { ...jwk };
  delete keyData.alg;
  delete keyData.use;
  return webcrypto_default.subtle.importKey("jwk", keyData, ...rest);
}, "parse");
var jwk_to_key_default = parse;

// node_modules/jose/dist/browser/runtime/normalize_key.js
var exportKeyValue = /* @__PURE__ */ __name((k) => decode(k), "exportKeyValue");
var privCache;
var pubCache;
var isKeyObject = /* @__PURE__ */ __name((key) => {
  return key?.[Symbol.toStringTag] === "KeyObject";
}, "isKeyObject");
var importAndCache = /* @__PURE__ */ __name(async (cache, key, jwk, alg, freeze = false) => {
  let cached = cache.get(key);
  if (cached?.[alg]) {
    return cached[alg];
  }
  const cryptoKey = await jwk_to_key_default({ ...jwk, alg });
  if (freeze)
    Object.freeze(key);
  if (!cached) {
    cache.set(key, { [alg]: cryptoKey });
  } else {
    cached[alg] = cryptoKey;
  }
  return cryptoKey;
}, "importAndCache");
var normalizePublicKey = /* @__PURE__ */ __name((key, alg) => {
  if (isKeyObject(key)) {
    let jwk = key.export({ format: "jwk" });
    delete jwk.d;
    delete jwk.dp;
    delete jwk.dq;
    delete jwk.p;
    delete jwk.q;
    delete jwk.qi;
    if (jwk.k) {
      return exportKeyValue(jwk.k);
    }
    pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
    return importAndCache(pubCache, key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k)
      return decode(key.k);
    pubCache || (pubCache = /* @__PURE__ */ new WeakMap());
    const cryptoKey = importAndCache(pubCache, key, key, alg, true);
    return cryptoKey;
  }
  return key;
}, "normalizePublicKey");
var normalizePrivateKey = /* @__PURE__ */ __name((key, alg) => {
  if (isKeyObject(key)) {
    let jwk = key.export({ format: "jwk" });
    if (jwk.k) {
      return exportKeyValue(jwk.k);
    }
    privCache || (privCache = /* @__PURE__ */ new WeakMap());
    return importAndCache(privCache, key, jwk, alg);
  }
  if (isJWK(key)) {
    if (key.k)
      return decode(key.k);
    privCache || (privCache = /* @__PURE__ */ new WeakMap());
    const cryptoKey = importAndCache(privCache, key, key, alg, true);
    return cryptoKey;
  }
  return key;
}, "normalizePrivateKey");
var normalize_key_default = { normalizePublicKey, normalizePrivateKey };

// node_modules/jose/dist/browser/key/import.js
async function importJWK(jwk, alg) {
  if (!isObject(jwk)) {
    throw new TypeError("JWK must be an object");
  }
  alg || (alg = jwk.alg);
  switch (jwk.kty) {
    case "oct":
      if (typeof jwk.k !== "string" || !jwk.k) {
        throw new TypeError('missing "k" (Key Value) Parameter value');
      }
      return decode(jwk.k);
    case "RSA":
      if ("oth" in jwk && jwk.oth !== void 0) {
        throw new JOSENotSupported('RSA JWK "oth" (Other Primes Info) Parameter value is not supported');
      }
    case "EC":
    case "OKP":
      return jwk_to_key_default({ ...jwk, alg });
    default:
      throw new JOSENotSupported('Unsupported "kty" (Key Type) Parameter value');
  }
}
__name(importJWK, "importJWK");

// node_modules/jose/dist/browser/lib/check_key_type.js
var tag = /* @__PURE__ */ __name((key) => key?.[Symbol.toStringTag], "tag");
var jwkMatchesOp = /* @__PURE__ */ __name((alg, key, usage) => {
  if (key.use !== void 0 && key.use !== "sig") {
    throw new TypeError("Invalid key for this operation, when present its use must be sig");
  }
  if (key.key_ops !== void 0 && key.key_ops.includes?.(usage) !== true) {
    throw new TypeError(`Invalid key for this operation, when present its key_ops must include ${usage}`);
  }
  if (key.alg !== void 0 && key.alg !== alg) {
    throw new TypeError(`Invalid key for this operation, when present its alg must be ${alg}`);
  }
  return true;
}, "jwkMatchesOp");
var symmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage, allowJwk) => {
  if (key instanceof Uint8Array)
    return;
  if (allowJwk && isJWK(key)) {
    if (isSecretJWK(key) && jwkMatchesOp(alg, key, usage))
      return;
    throw new TypeError(`JSON Web Key for symmetric algorithms must have JWK "kty" (Key Type) equal to "oct" and the JWK "k" (Key Value) present`);
  }
  if (!is_key_like_default(key)) {
    throw new TypeError(withAlg(alg, key, ...types, "Uint8Array", allowJwk ? "JSON Web Key" : null));
  }
  if (key.type !== "secret") {
    throw new TypeError(`${tag(key)} instances for symmetric algorithms must be of type "secret"`);
  }
}, "symmetricTypeCheck");
var asymmetricTypeCheck = /* @__PURE__ */ __name((alg, key, usage, allowJwk) => {
  if (allowJwk && isJWK(key)) {
    switch (usage) {
      case "sign":
        if (isPrivateJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a private JWK`);
      case "verify":
        if (isPublicJWK(key) && jwkMatchesOp(alg, key, usage))
          return;
        throw new TypeError(`JSON Web Key for this operation be a public JWK`);
    }
  }
  if (!is_key_like_default(key)) {
    throw new TypeError(withAlg(alg, key, ...types, allowJwk ? "JSON Web Key" : null));
  }
  if (key.type === "secret") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithms must not be of type "secret"`);
  }
  if (usage === "sign" && key.type === "public") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm signing must be of type "private"`);
  }
  if (usage === "decrypt" && key.type === "public") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm decryption must be of type "private"`);
  }
  if (key.algorithm && usage === "verify" && key.type === "private") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm verifying must be of type "public"`);
  }
  if (key.algorithm && usage === "encrypt" && key.type === "private") {
    throw new TypeError(`${tag(key)} instances for asymmetric algorithm encryption must be of type "public"`);
  }
}, "asymmetricTypeCheck");
function checkKeyType(allowJwk, alg, key, usage) {
  const symmetric = alg.startsWith("HS") || alg === "dir" || alg.startsWith("PBES2") || /^A\d{3}(?:GCM)?KW$/.test(alg);
  if (symmetric) {
    symmetricTypeCheck(alg, key, usage, allowJwk);
  } else {
    asymmetricTypeCheck(alg, key, usage, allowJwk);
  }
}
__name(checkKeyType, "checkKeyType");
var check_key_type_default = checkKeyType.bind(void 0, false);
var checkKeyTypeWithJwk = checkKeyType.bind(void 0, true);

// node_modules/jose/dist/browser/lib/validate_crit.js
function validateCrit(Err, recognizedDefault, recognizedOption, protectedHeader, joseHeader) {
  if (joseHeader.crit !== void 0 && protectedHeader?.crit === void 0) {
    throw new Err('"crit" (Critical) Header Parameter MUST be integrity protected');
  }
  if (!protectedHeader || protectedHeader.crit === void 0) {
    return /* @__PURE__ */ new Set();
  }
  if (!Array.isArray(protectedHeader.crit) || protectedHeader.crit.length === 0 || protectedHeader.crit.some((input) => typeof input !== "string" || input.length === 0)) {
    throw new Err('"crit" (Critical) Header Parameter MUST be an array of non-empty strings when present');
  }
  let recognized;
  if (recognizedOption !== void 0) {
    recognized = new Map([...Object.entries(recognizedOption), ...recognizedDefault.entries()]);
  } else {
    recognized = recognizedDefault;
  }
  for (const parameter of protectedHeader.crit) {
    if (!recognized.has(parameter)) {
      throw new JOSENotSupported(`Extension Header Parameter "${parameter}" is not recognized`);
    }
    if (joseHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" is missing`);
    }
    if (recognized.get(parameter) && protectedHeader[parameter] === void 0) {
      throw new Err(`Extension Header Parameter "${parameter}" MUST be integrity protected`);
    }
  }
  return new Set(protectedHeader.crit);
}
__name(validateCrit, "validateCrit");
var validate_crit_default = validateCrit;

// node_modules/jose/dist/browser/lib/validate_algorithms.js
var validateAlgorithms = /* @__PURE__ */ __name((option, algorithms) => {
  if (algorithms !== void 0 && (!Array.isArray(algorithms) || algorithms.some((s) => typeof s !== "string"))) {
    throw new TypeError(`"${option}" option must be an array of strings`);
  }
  if (!algorithms) {
    return void 0;
  }
  return new Set(algorithms);
}, "validateAlgorithms");
var validate_algorithms_default = validateAlgorithms;

// node_modules/jose/dist/browser/runtime/subtle_dsa.js
function subtleDsa(alg, algorithm) {
  const hash = `SHA-${alg.slice(-3)}`;
  switch (alg) {
    case "HS256":
    case "HS384":
    case "HS512":
      return { hash, name: "HMAC" };
    case "PS256":
    case "PS384":
    case "PS512":
      return { hash, name: "RSA-PSS", saltLength: alg.slice(-3) >> 3 };
    case "RS256":
    case "RS384":
    case "RS512":
      return { hash, name: "RSASSA-PKCS1-v1_5" };
    case "ES256":
    case "ES384":
    case "ES512":
      return { hash, name: "ECDSA", namedCurve: algorithm.namedCurve };
    case "Ed25519":
      return { name: "Ed25519" };
    case "EdDSA":
      return { name: algorithm.name };
    default:
      throw new JOSENotSupported(`alg ${alg} is not supported either by JOSE or your javascript runtime`);
  }
}
__name(subtleDsa, "subtleDsa");

// node_modules/jose/dist/browser/runtime/get_sign_verify_key.js
async function getCryptoKey(alg, key, usage) {
  if (usage === "sign") {
    key = await normalize_key_default.normalizePrivateKey(key, alg);
  }
  if (usage === "verify") {
    key = await normalize_key_default.normalizePublicKey(key, alg);
  }
  if (isCryptoKey(key)) {
    checkSigCryptoKey(key, alg, usage);
    return key;
  }
  if (key instanceof Uint8Array) {
    if (!alg.startsWith("HS")) {
      throw new TypeError(invalid_key_input_default(key, ...types));
    }
    return webcrypto_default.subtle.importKey("raw", key, { hash: `SHA-${alg.slice(-3)}`, name: "HMAC" }, false, [usage]);
  }
  throw new TypeError(invalid_key_input_default(key, ...types, "Uint8Array", "JSON Web Key"));
}
__name(getCryptoKey, "getCryptoKey");

// node_modules/jose/dist/browser/runtime/verify.js
var verify = /* @__PURE__ */ __name(async (alg, key, signature, data) => {
  const cryptoKey = await getCryptoKey(alg, key, "verify");
  check_key_length_default(alg, cryptoKey);
  const algorithm = subtleDsa(alg, cryptoKey.algorithm);
  try {
    return await webcrypto_default.subtle.verify(algorithm, cryptoKey, signature, data);
  } catch {
    return false;
  }
}, "verify");
var verify_default = verify;

// node_modules/jose/dist/browser/jws/flattened/verify.js
async function flattenedVerify(jws, key, options) {
  if (!isObject(jws)) {
    throw new JWSInvalid("Flattened JWS must be an object");
  }
  if (jws.protected === void 0 && jws.header === void 0) {
    throw new JWSInvalid('Flattened JWS must have either of the "protected" or "header" members');
  }
  if (jws.protected !== void 0 && typeof jws.protected !== "string") {
    throw new JWSInvalid("JWS Protected Header incorrect type");
  }
  if (jws.payload === void 0) {
    throw new JWSInvalid("JWS Payload missing");
  }
  if (typeof jws.signature !== "string") {
    throw new JWSInvalid("JWS Signature missing or incorrect type");
  }
  if (jws.header !== void 0 && !isObject(jws.header)) {
    throw new JWSInvalid("JWS Unprotected Header incorrect type");
  }
  let parsedProt = {};
  if (jws.protected) {
    try {
      const protectedHeader = decode(jws.protected);
      parsedProt = JSON.parse(decoder.decode(protectedHeader));
    } catch {
      throw new JWSInvalid("JWS Protected Header is invalid");
    }
  }
  if (!is_disjoint_default(parsedProt, jws.header)) {
    throw new JWSInvalid("JWS Protected and JWS Unprotected Header Parameter names must be disjoint");
  }
  const joseHeader = {
    ...parsedProt,
    ...jws.header
  };
  const extensions = validate_crit_default(JWSInvalid, /* @__PURE__ */ new Map([["b64", true]]), options?.crit, parsedProt, joseHeader);
  let b64 = true;
  if (extensions.has("b64")) {
    b64 = parsedProt.b64;
    if (typeof b64 !== "boolean") {
      throw new JWSInvalid('The "b64" (base64url-encode payload) Header Parameter must be a boolean');
    }
  }
  const { alg } = joseHeader;
  if (typeof alg !== "string" || !alg) {
    throw new JWSInvalid('JWS "alg" (Algorithm) Header Parameter missing or invalid');
  }
  const algorithms = options && validate_algorithms_default("algorithms", options.algorithms);
  if (algorithms && !algorithms.has(alg)) {
    throw new JOSEAlgNotAllowed('"alg" (Algorithm) Header Parameter value not allowed');
  }
  if (b64) {
    if (typeof jws.payload !== "string") {
      throw new JWSInvalid("JWS Payload must be a string");
    }
  } else if (typeof jws.payload !== "string" && !(jws.payload instanceof Uint8Array)) {
    throw new JWSInvalid("JWS Payload must be a string or an Uint8Array instance");
  }
  let resolvedKey = false;
  if (typeof key === "function") {
    key = await key(parsedProt, jws);
    resolvedKey = true;
    checkKeyTypeWithJwk(alg, key, "verify");
    if (isJWK(key)) {
      key = await importJWK(key, alg);
    }
  } else {
    checkKeyTypeWithJwk(alg, key, "verify");
  }
  const data = concat(encoder.encode(jws.protected ?? ""), encoder.encode("."), typeof jws.payload === "string" ? encoder.encode(jws.payload) : jws.payload);
  let signature;
  try {
    signature = decode(jws.signature);
  } catch {
    throw new JWSInvalid("Failed to base64url decode the signature");
  }
  const verified = await verify_default(alg, key, signature, data);
  if (!verified) {
    throw new JWSSignatureVerificationFailed();
  }
  let payload;
  if (b64) {
    try {
      payload = decode(jws.payload);
    } catch {
      throw new JWSInvalid("Failed to base64url decode the payload");
    }
  } else if (typeof jws.payload === "string") {
    payload = encoder.encode(jws.payload);
  } else {
    payload = jws.payload;
  }
  const result = { payload };
  if (jws.protected !== void 0) {
    result.protectedHeader = parsedProt;
  }
  if (jws.header !== void 0) {
    result.unprotectedHeader = jws.header;
  }
  if (resolvedKey) {
    return { ...result, key };
  }
  return result;
}
__name(flattenedVerify, "flattenedVerify");

// node_modules/jose/dist/browser/jws/compact/verify.js
async function compactVerify(jws, key, options) {
  if (jws instanceof Uint8Array) {
    jws = decoder.decode(jws);
  }
  if (typeof jws !== "string") {
    throw new JWSInvalid("Compact JWS must be a string or Uint8Array");
  }
  const { 0: protectedHeader, 1: payload, 2: signature, length } = jws.split(".");
  if (length !== 3) {
    throw new JWSInvalid("Invalid Compact JWS");
  }
  const verified = await flattenedVerify({ payload, protected: protectedHeader, signature }, key, options);
  const result = { payload: verified.payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(compactVerify, "compactVerify");

// node_modules/jose/dist/browser/lib/epoch.js
var epoch_default = /* @__PURE__ */ __name((date) => Math.floor(date.getTime() / 1e3), "default");

// node_modules/jose/dist/browser/lib/secs.js
var minute = 60;
var hour = minute * 60;
var day = hour * 24;
var week = day * 7;
var year = day * 365.25;
var REGEX = /^(\+|\-)? ?(\d+|\d+\.\d+) ?(seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)(?: (ago|from now))?$/i;
var secs_default = /* @__PURE__ */ __name((str) => {
  const matched = REGEX.exec(str);
  if (!matched || matched[4] && matched[1]) {
    throw new TypeError("Invalid time period format");
  }
  const value = parseFloat(matched[2]);
  const unit = matched[3].toLowerCase();
  let numericDate;
  switch (unit) {
    case "sec":
    case "secs":
    case "second":
    case "seconds":
    case "s":
      numericDate = Math.round(value);
      break;
    case "minute":
    case "minutes":
    case "min":
    case "mins":
    case "m":
      numericDate = Math.round(value * minute);
      break;
    case "hour":
    case "hours":
    case "hr":
    case "hrs":
    case "h":
      numericDate = Math.round(value * hour);
      break;
    case "day":
    case "days":
    case "d":
      numericDate = Math.round(value * day);
      break;
    case "week":
    case "weeks":
    case "w":
      numericDate = Math.round(value * week);
      break;
    default:
      numericDate = Math.round(value * year);
      break;
  }
  if (matched[1] === "-" || matched[4] === "ago") {
    return -numericDate;
  }
  return numericDate;
}, "default");

// node_modules/jose/dist/browser/lib/jwt_claims_set.js
var normalizeTyp = /* @__PURE__ */ __name((value) => value.toLowerCase().replace(/^application\//, ""), "normalizeTyp");
var checkAudiencePresence = /* @__PURE__ */ __name((audPayload, audOption) => {
  if (typeof audPayload === "string") {
    return audOption.includes(audPayload);
  }
  if (Array.isArray(audPayload)) {
    return audOption.some(Set.prototype.has.bind(new Set(audPayload)));
  }
  return false;
}, "checkAudiencePresence");
var jwt_claims_set_default = /* @__PURE__ */ __name((protectedHeader, encodedPayload, options = {}) => {
  let payload;
  try {
    payload = JSON.parse(decoder.decode(encodedPayload));
  } catch {
  }
  if (!isObject(payload)) {
    throw new JWTInvalid("JWT Claims Set must be a top-level JSON object");
  }
  const { typ } = options;
  if (typ && (typeof protectedHeader.typ !== "string" || normalizeTyp(protectedHeader.typ) !== normalizeTyp(typ))) {
    throw new JWTClaimValidationFailed('unexpected "typ" JWT header value', payload, "typ", "check_failed");
  }
  const { requiredClaims = [], issuer, subject, audience, maxTokenAge } = options;
  const presenceCheck = [...requiredClaims];
  if (maxTokenAge !== void 0)
    presenceCheck.push("iat");
  if (audience !== void 0)
    presenceCheck.push("aud");
  if (subject !== void 0)
    presenceCheck.push("sub");
  if (issuer !== void 0)
    presenceCheck.push("iss");
  for (const claim of new Set(presenceCheck.reverse())) {
    if (!(claim in payload)) {
      throw new JWTClaimValidationFailed(`missing required "${claim}" claim`, payload, claim, "missing");
    }
  }
  if (issuer && !(Array.isArray(issuer) ? issuer : [issuer]).includes(payload.iss)) {
    throw new JWTClaimValidationFailed('unexpected "iss" claim value', payload, "iss", "check_failed");
  }
  if (subject && payload.sub !== subject) {
    throw new JWTClaimValidationFailed('unexpected "sub" claim value', payload, "sub", "check_failed");
  }
  if (audience && !checkAudiencePresence(payload.aud, typeof audience === "string" ? [audience] : audience)) {
    throw new JWTClaimValidationFailed('unexpected "aud" claim value', payload, "aud", "check_failed");
  }
  let tolerance;
  switch (typeof options.clockTolerance) {
    case "string":
      tolerance = secs_default(options.clockTolerance);
      break;
    case "number":
      tolerance = options.clockTolerance;
      break;
    case "undefined":
      tolerance = 0;
      break;
    default:
      throw new TypeError("Invalid clockTolerance option type");
  }
  const { currentDate } = options;
  const now = epoch_default(currentDate || /* @__PURE__ */ new Date());
  if ((payload.iat !== void 0 || maxTokenAge) && typeof payload.iat !== "number") {
    throw new JWTClaimValidationFailed('"iat" claim must be a number', payload, "iat", "invalid");
  }
  if (payload.nbf !== void 0) {
    if (typeof payload.nbf !== "number") {
      throw new JWTClaimValidationFailed('"nbf" claim must be a number', payload, "nbf", "invalid");
    }
    if (payload.nbf > now + tolerance) {
      throw new JWTClaimValidationFailed('"nbf" claim timestamp check failed', payload, "nbf", "check_failed");
    }
  }
  if (payload.exp !== void 0) {
    if (typeof payload.exp !== "number") {
      throw new JWTClaimValidationFailed('"exp" claim must be a number', payload, "exp", "invalid");
    }
    if (payload.exp <= now - tolerance) {
      throw new JWTExpired('"exp" claim timestamp check failed', payload, "exp", "check_failed");
    }
  }
  if (maxTokenAge) {
    const age = now - payload.iat;
    const max = typeof maxTokenAge === "number" ? maxTokenAge : secs_default(maxTokenAge);
    if (age - tolerance > max) {
      throw new JWTExpired('"iat" claim timestamp check failed (too far in the past)', payload, "iat", "check_failed");
    }
    if (age < 0 - tolerance) {
      throw new JWTClaimValidationFailed('"iat" claim timestamp check failed (it should be in the past)', payload, "iat", "check_failed");
    }
  }
  return payload;
}, "default");

// node_modules/jose/dist/browser/jwt/verify.js
async function jwtVerify(jwt, key, options) {
  const verified = await compactVerify(jwt, key, options);
  if (verified.protectedHeader.crit?.includes("b64") && verified.protectedHeader.b64 === false) {
    throw new JWTInvalid("JWTs MUST NOT use unencoded payload");
  }
  const payload = jwt_claims_set_default(verified.protectedHeader, verified.payload, options);
  const result = { payload, protectedHeader: verified.protectedHeader };
  if (typeof key === "function") {
    return { ...result, key: verified.key };
  }
  return result;
}
__name(jwtVerify, "jwtVerify");

// node_modules/jose/dist/browser/jwks/local.js
function getKtyFromAlg(alg) {
  switch (typeof alg === "string" && alg.slice(0, 2)) {
    case "RS":
    case "PS":
      return "RSA";
    case "ES":
      return "EC";
    case "Ed":
      return "OKP";
    default:
      throw new JOSENotSupported('Unsupported "alg" value for a JSON Web Key Set');
  }
}
__name(getKtyFromAlg, "getKtyFromAlg");
function isJWKSLike(jwks) {
  return jwks && typeof jwks === "object" && Array.isArray(jwks.keys) && jwks.keys.every(isJWKLike);
}
__name(isJWKSLike, "isJWKSLike");
function isJWKLike(key) {
  return isObject(key);
}
__name(isJWKLike, "isJWKLike");
function clone(obj) {
  if (typeof structuredClone === "function") {
    return structuredClone(obj);
  }
  return JSON.parse(JSON.stringify(obj));
}
__name(clone, "clone");
var LocalJWKSet = class {
  static {
    __name(this, "LocalJWKSet");
  }
  constructor(jwks) {
    this._cached = /* @__PURE__ */ new WeakMap();
    if (!isJWKSLike(jwks)) {
      throw new JWKSInvalid("JSON Web Key Set malformed");
    }
    this._jwks = clone(jwks);
  }
  async getKey(protectedHeader, token) {
    const { alg, kid } = { ...protectedHeader, ...token?.header };
    const kty = getKtyFromAlg(alg);
    const candidates = this._jwks.keys.filter((jwk2) => {
      let candidate = kty === jwk2.kty;
      if (candidate && typeof kid === "string") {
        candidate = kid === jwk2.kid;
      }
      if (candidate && typeof jwk2.alg === "string") {
        candidate = alg === jwk2.alg;
      }
      if (candidate && typeof jwk2.use === "string") {
        candidate = jwk2.use === "sig";
      }
      if (candidate && Array.isArray(jwk2.key_ops)) {
        candidate = jwk2.key_ops.includes("verify");
      }
      if (candidate) {
        switch (alg) {
          case "ES256":
            candidate = jwk2.crv === "P-256";
            break;
          case "ES256K":
            candidate = jwk2.crv === "secp256k1";
            break;
          case "ES384":
            candidate = jwk2.crv === "P-384";
            break;
          case "ES512":
            candidate = jwk2.crv === "P-521";
            break;
          case "Ed25519":
            candidate = jwk2.crv === "Ed25519";
            break;
          case "EdDSA":
            candidate = jwk2.crv === "Ed25519" || jwk2.crv === "Ed448";
            break;
        }
      }
      return candidate;
    });
    const { 0: jwk, length } = candidates;
    if (length === 0) {
      throw new JWKSNoMatchingKey();
    }
    if (length !== 1) {
      const error = new JWKSMultipleMatchingKeys();
      const { _cached } = this;
      error[Symbol.asyncIterator] = async function* () {
        for (const jwk2 of candidates) {
          try {
            yield await importWithAlgCache(_cached, jwk2, alg);
          } catch {
          }
        }
      };
      throw error;
    }
    return importWithAlgCache(this._cached, jwk, alg);
  }
};
async function importWithAlgCache(cache, jwk, alg) {
  const cached = cache.get(jwk) || cache.set(jwk, {}).get(jwk);
  if (cached[alg] === void 0) {
    const key = await importJWK({ ...jwk, ext: true }, alg);
    if (key instanceof Uint8Array || key.type !== "public") {
      throw new JWKSInvalid("JSON Web Key Set members must be public keys");
    }
    cached[alg] = key;
  }
  return cached[alg];
}
__name(importWithAlgCache, "importWithAlgCache");
function createLocalJWKSet(jwks) {
  const set = new LocalJWKSet(jwks);
  const localJWKSet = /* @__PURE__ */ __name(async (protectedHeader, token) => set.getKey(protectedHeader, token), "localJWKSet");
  Object.defineProperties(localJWKSet, {
    jwks: {
      value: /* @__PURE__ */ __name(() => clone(set._jwks), "value"),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return localJWKSet;
}
__name(createLocalJWKSet, "createLocalJWKSet");

// node_modules/jose/dist/browser/runtime/fetch_jwks.js
var fetchJwks = /* @__PURE__ */ __name(async (url, timeout, options) => {
  let controller;
  let id;
  let timedOut = false;
  if (typeof AbortController === "function") {
    controller = new AbortController();
    id = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeout);
  }
  const response = await fetch(url.href, {
    signal: controller ? controller.signal : void 0,
    redirect: "manual",
    headers: options.headers
  }).catch((err) => {
    if (timedOut)
      throw new JWKSTimeout();
    throw err;
  });
  if (id !== void 0)
    clearTimeout(id);
  if (response.status !== 200) {
    throw new JOSEError("Expected 200 OK from the JSON Web Key Set HTTP response");
  }
  try {
    return await response.json();
  } catch {
    throw new JOSEError("Failed to parse the JSON Web Key Set HTTP response as JSON");
  }
}, "fetchJwks");
var fetch_jwks_default = fetchJwks;

// node_modules/jose/dist/browser/jwks/remote.js
function isCloudflareWorkers() {
  return typeof WebSocketPair !== "undefined" || typeof navigator !== "undefined" && true || typeof EdgeRuntime !== "undefined" && EdgeRuntime === "vercel";
}
__name(isCloudflareWorkers, "isCloudflareWorkers");
var USER_AGENT;
if (typeof navigator === "undefined" || !"Cloudflare-Workers"?.startsWith?.("Mozilla/5.0 ")) {
  const NAME = "jose";
  const VERSION = "v5.10.0";
  USER_AGENT = `${NAME}/${VERSION}`;
}
var jwksCache = /* @__PURE__ */ Symbol();
function isFreshJwksCache(input, cacheMaxAge) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  if (!("uat" in input) || typeof input.uat !== "number" || Date.now() - input.uat >= cacheMaxAge) {
    return false;
  }
  if (!("jwks" in input) || !isObject(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, isObject)) {
    return false;
  }
  return true;
}
__name(isFreshJwksCache, "isFreshJwksCache");
var RemoteJWKSet = class {
  static {
    __name(this, "RemoteJWKSet");
  }
  constructor(url, options) {
    if (!(url instanceof URL)) {
      throw new TypeError("url must be an instance of URL");
    }
    this._url = new URL(url.href);
    this._options = { agent: options?.agent, headers: options?.headers };
    this._timeoutDuration = typeof options?.timeoutDuration === "number" ? options?.timeoutDuration : 5e3;
    this._cooldownDuration = typeof options?.cooldownDuration === "number" ? options?.cooldownDuration : 3e4;
    this._cacheMaxAge = typeof options?.cacheMaxAge === "number" ? options?.cacheMaxAge : 6e5;
    if (options?.[jwksCache] !== void 0) {
      this._cache = options?.[jwksCache];
      if (isFreshJwksCache(options?.[jwksCache], this._cacheMaxAge)) {
        this._jwksTimestamp = this._cache.uat;
        this._local = createLocalJWKSet(this._cache.jwks);
      }
    }
  }
  coolingDown() {
    return typeof this._jwksTimestamp === "number" ? Date.now() < this._jwksTimestamp + this._cooldownDuration : false;
  }
  fresh() {
    return typeof this._jwksTimestamp === "number" ? Date.now() < this._jwksTimestamp + this._cacheMaxAge : false;
  }
  async getKey(protectedHeader, token) {
    if (!this._local || !this.fresh()) {
      await this.reload();
    }
    try {
      return await this._local(protectedHeader, token);
    } catch (err) {
      if (err instanceof JWKSNoMatchingKey) {
        if (this.coolingDown() === false) {
          await this.reload();
          return this._local(protectedHeader, token);
        }
      }
      throw err;
    }
  }
  async reload() {
    if (this._pendingFetch && isCloudflareWorkers()) {
      this._pendingFetch = void 0;
    }
    const headers = new Headers(this._options.headers);
    if (USER_AGENT && !headers.has("User-Agent")) {
      headers.set("User-Agent", USER_AGENT);
      this._options.headers = Object.fromEntries(headers.entries());
    }
    this._pendingFetch || (this._pendingFetch = fetch_jwks_default(this._url, this._timeoutDuration, this._options).then((json) => {
      this._local = createLocalJWKSet(json);
      if (this._cache) {
        this._cache.uat = Date.now();
        this._cache.jwks = json;
      }
      this._jwksTimestamp = Date.now();
      this._pendingFetch = void 0;
    }).catch((err) => {
      this._pendingFetch = void 0;
      throw err;
    }));
    await this._pendingFetch;
  }
};
function createRemoteJWKSet(url, options) {
  const set = new RemoteJWKSet(url, options);
  const remoteJWKSet = /* @__PURE__ */ __name(async (protectedHeader, token) => set.getKey(protectedHeader, token), "remoteJWKSet");
  Object.defineProperties(remoteJWKSet, {
    coolingDown: {
      get: /* @__PURE__ */ __name(() => set.coolingDown(), "get"),
      enumerable: true,
      configurable: false
    },
    fresh: {
      get: /* @__PURE__ */ __name(() => set.fresh(), "get"),
      enumerable: true,
      configurable: false
    },
    reload: {
      value: /* @__PURE__ */ __name(() => set.reload(), "value"),
      enumerable: true,
      configurable: false,
      writable: false
    },
    reloading: {
      get: /* @__PURE__ */ __name(() => !!set._pendingFetch, "get"),
      enumerable: true,
      configurable: false
    },
    jwks: {
      value: /* @__PURE__ */ __name(() => set._local?.jwks(), "value"),
      enumerable: true,
      configurable: false,
      writable: false
    }
  });
  return remoteJWKSet;
}
__name(createRemoteJWKSet, "createRemoteJWKSet");

// ../shared/gemini.ts
var languageInstruction = /* @__PURE__ */ __name((lang = "ja") => {
  if (lang === "ja") return "Respond in Japanese.";
  if (lang === "zh-CN") return "Respond in Simplified Chinese.";
  if (lang === "ko") return "Respond in Korean.";
  return "Respond in English.";
}, "languageInstruction");
var EXPLAIN_MODE_SUFFIXES = {
  "en-ja": "\u203B \u51FA\u529B\u8A00\u8A9E: \u65E5\u672C\u8A9E\u3067\u8A9E\u6E90\u3092\u4EA4\u3048\u3066\u8AAC\u660E\u3057\u3066\u304F\u3060\u3055\u3044\u3002meaning, etymology, mnemonic, logic, exampleSentenceTranslation \u304A\u3088\u3073 synonyms/collocations/idioms/relatedWords \u306E translation \u306F\u5168\u3066\u65E5\u672C\u8A9E\u3067\u8A18\u8FF0\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  "en-en": "\u203B Output language: Explain everything in simple English. All text fields (meaning, etymology, mnemonic, logic, exampleSentenceTranslation, and synonyms/collocations/idioms/relatedWords.translation) must be in English.",
  multilingual: "\u203B Output language: Use simple English as the primary language. You may add brief Japanese notes (in parentheses) for key etymology or memory hints when helpful."
};
var BASE_SYSTEM_INSTRUCTION = `\u3042\u306A\u305F\u306F\u4E16\u754C\u4E00\u308F\u304B\u308A\u3084\u3059\u3044\u82F1\u8A9E\u8B1B\u5E2B\u3067\u3059\u3002
  \u30E6\u30FC\u30B6\u30FC\u304C\u5165\u529B\u3057\u305F\u300C\u82F1\u5358\u8A9E\u300D\u307E\u305F\u306F\u300C\u719F\u8A9E\u300D\u306B\u3064\u3044\u3066\u3001\u4EE5\u4E0B\u306E3\u70B9\u3092\u8EF8\u306B\u3001**\u300C\u306A\u308B\u307B\u3069\uFF01\u3060\u304B\u3089\u3053\u3046\u3044\u3046\u610F\u5473\u306B\u306A\u308B\u306E\u304B\uFF01\u300D\u3068\u819D\u3092\u6253\u3064\u3088\u3046\u306A\uFF08\u30A2\u30CF\u4F53\u9A13\u304C\u3067\u304D\u308B\uFF09\u89E3\u8AAC**\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

  1. **\u8A9E\u6E90\u30FB\u30B3\u30A2\u30A4\u30E1\u30FC\u30B8**: \u5358\u8A9E\u3092\u30D1\u30FC\u30C4\uFF08\u63A5\u982D\u8F9E\u30FB\u8A9E\u6839\u30FB\u63A5\u5C3E\u8F9E\uFF09\u306B\u5206\u89E3\u3057\u3001\u305D\u308C\u305E\u308C\u306E\u539F\u7FA9\u3092\u53EF\u8996\u5316\u3067\u304D\u308B\u3088\u3046\u306B\u8AAC\u660E\u3059\u308B\u3002\u719F\u8A9E\u306E\u5834\u5408\u306F\u524D\u7F6E\u8A5E\u306E\u6301\u3064\u7A7A\u9593\u7684\u30A4\u30E1\u30FC\u30B8\u3092\u5F37\u8ABF\u3059\u308B\u3002
  2. **\u8AD6\u7406\uFF08Logic\uFF09**: \u300C\u306A\u305C\u305D\u306E\u539F\u7FA9\u304C\u3001\u73FE\u5728\u306E\u610F\u5473\u306B\u306A\u308B\u306E\u304B\uFF1F\u300D\u3068\u3044\u3046\u5909\u9077\u306E\u30ED\u30B8\u30C3\u30AF\u3092\u3001\u98DB\u8E8D\u306A\u304F\u3001\u30B9\u30C8\u30FC\u30EA\u30FC\u3068\u3057\u3066\u7D0D\u5F97\u611F\u3092\u6301\u3063\u3066\u7E4B\u3052\u308B\u3002\u3053\u3053\u304C\u6700\u3082\u91CD\u8981\u3067\u3059\u3002\u300C\u3059\u3063\u3068\u982D\u306B\u5165\u308B\u300D\u8AAC\u660E\u3092\u5FC3\u304C\u3051\u3066\u304F\u3060\u3055\u3044\u3002
  3. **\u8A18\u61B6\u306E\u30D5\u30C3\u30AF\uFF08Mnemonic\uFF09**: \u601D\u308F\u305A\u7B11\u3063\u3066\u3057\u307E\u3046\u3088\u3046\u306A\u8A9E\u5442\u5408\u308F\u305B\u3084\u3001\u5F37\u70C8\u306A\u8996\u899A\u30A4\u30E1\u30FC\u30B8\u3092\u559A\u8D77\u3059\u308B\u899A\u3048\u65B9\u3092\u63D0\u6848\u3059\u308B\u3002

  \u91CD\u8981\uFF1A
  - \u5C02\u9580\u7528\u8A9E\u3092\u4E26\u3079\u308B\u306E\u3067\u306F\u306A\u304F\u3001\u4E2D\u5B66\u751F\u3067\u3082\u76F4\u611F\u7684\u306B\u308F\u304B\u308B\u8A00\u8449\u9078\u3073\u3092\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  - \u719F\u8A9E\uFF08\u53E5\u52D5\u8A5E\uFF09\u306E\u5834\u5408\u306F\u3001\u76F4\u8A33\u3067\u306F\u306A\u304F\u300C\u6838\u5FC3\u306E\u30A4\u30E1\u30FC\u30B8\u300D\u304B\u3089\u610F\u5473\u3092\u5C0E\u304D\u51FA\u3057\u3066\u304F\u3060\u3055\u3044\u3002

  \u4EE5\u4E0B\u306E\u8981\u7D20\u3092\u542B\u3080JSON\u5F62\u5F0F\u3067\u56DE\u7B54\u3057\u3066\u304F\u3060\u3055\u3044\u3002
  1. word
  2. meaning
  3. pronunciation
  4. etymology
  5. mnemonic
  6. logic
  7. exampleSentence
  8. exampleSentenceTranslation
  9. synonyms: [{ term, translation }]
  10. collocations: [{ term, translation }]
  11. derivatives: string[]
  12. idioms: [{ term, translation }]
  13. nuance
  14. relatedWords: [{ term, translation }]

  \u5FC5\u305A\u7D14\u7C8B\u306AJSON\u306E\u307F\u3092\u8FD4\u3057\u3066\u304F\u3060\u3055\u3044\u3002`;
var AI_MODEL_BY_SPEED = {
  fast: "gemini-2.5-flash-lite",
  standard: "gemini-3-flash-preview"
};
var GEMINI_MODEL = "gemini-3-flash-preview";
var SEARCH_FOCUS_SUFFIXES = {
  all: "",
  idioms: "\u203B \u91CD\u70B9: idioms\uFF08\u719F\u8A9E\u30FB\u53E5\u52D5\u8A5E\uFF09\u3092\u6700\u512A\u5148\u3067\u5145\u5B9F\u3055\u305B\u3066\u304F\u3060\u3055\u3044\u3002idioms \u306F\u6700\u4F4E5\u4EF6\u3092\u76EE\u5B89\u306B\u5177\u4F53\u7684\u306B\u51FA\u529B\u3057\u3001logic \u3067\u3082\u53E5\u52D5\u8A5E\u30A4\u30E1\u30FC\u30B8\u3092\u4E01\u5BE7\u306B\u8AAC\u660E\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
  etymology: "\u203B \u91CD\u70B9: etymology \u3068 logic \u3092\u6700\u3082\u8A73\u3057\u304F\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u8A9E\u6E90\u5206\u89E3\u3084\u610F\u5473\u5909\u9077\u306E\u8AAC\u660E\u3092\u901A\u5E38\u3088\u308A\u539A\u304F\u66F8\u3044\u3066\u304F\u3060\u3055\u3044\u3002",
  core: "\u203B \u91CD\u70B9: meaning / nuance / exampleSentence \u3092\u77ED\u304F\u5B9F\u7528\u7684\u306B\u3001\u521D\u5B66\u8005\u5411\u3051\u306B\u7C21\u6F54\u306B\u307E\u3068\u3081\u3066\u304F\u3060\u3055\u3044\u3002"
};
var buildLookupContents = /* @__PURE__ */ __name((word) => `\u6B21\u306E\u82F1\u5358\u8A9E/\u719F\u8A9E\u3092\u89E3\u8AAC\u3057\u3066\u304F\u3060\u3055\u3044: ${word}`, "buildLookupContents");
var buildLookupSystemInstruction = /* @__PURE__ */ __name((explainMode, focus) => `${BASE_SYSTEM_INSTRUCTION}

${EXPLAIN_MODE_SUFFIXES[explainMode]}
${SEARCH_FOCUS_SUFFIXES[focus]}`, "buildLookupSystemInstruction");
var buildQuizContents = /* @__PURE__ */ __name((level, count) => `\u82F1\u8A9E\u30EC\u30D9\u30EB\u300C${level}\u300D\u306B\u5408\u308F\u305B\u3066\u3001\u5B66\u7FD2\u3059\u3079\u304D\u91CD\u8981\u306A\u82F1\u5358\u8A9E\u3092${count}\u500B\u9078\u51FA\u3057\u3001\u8A73\u7D30\u306A\u5B66\u7FD2\u30C7\u30FC\u30BF\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002`, "buildQuizContents");
var QUIZ_SYSTEM_INSTRUCTION = `\u3042\u306A\u305F\u306F\u82F1\u8A9E\u6559\u6750\u4F5C\u6210\u306E\u30D7\u30ED\u30D5\u30A7\u30C3\u30B7\u30E7\u30CA\u30EB\u3067\u3059\u3002
\u6307\u5B9A\u3055\u308C\u305F\u30EC\u30D9\u30EB\u306B\u9069\u3057\u305F\u3001\u5B66\u7FD2\u52B9\u679C\u306E\u9AD8\u3044\u82F1\u5358\u8A9E\u3092\u9078\u5B9A\u3057\u3001JSON\u5F62\u5F0F\u306E\u30EA\u30B9\u30C8\u3067\u51FA\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u5404\u5358\u8A9E\u306B\u3064\u3044\u3066\u3001\u5B66\u7FD2\u8005\u304C\u300C\u306A\u308B\u307B\u3069\uFF01\u300D\u3068\u76F4\u611F\u7684\u306B\u7406\u89E3\u3067\u304D\u308B\uFF08\u8179\u843D\u3061\u3059\u308B\uFF09\u89E3\u8AAC\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u7279\u306B\u4EE5\u4E0B\u306E\u8981\u7D20\u3092\u91CD\u8996\u3057\u3066\u304F\u3060\u3055\u3044\uFF1A
1. **\u8A9E\u6E90\u30FB\u30B3\u30A2\u30A4\u30E1\u30FC\u30B8**: \u30D1\u30FC\u30C4\u5206\u89E3\u3084\u539F\u7FA9\u306E\u89E3\u8AAC\u3002
2. **Logic\uFF08\u306A\u305C\u305D\u306E\u610F\u5473\uFF1F\uFF09**: \u539F\u7FA9\u304B\u3089\u73FE\u5728\u306E\u610F\u5473\u3078\u306E\u7E4B\u304C\u308A\u3092\u8AD6\u7406\u7684\u306B\u8AAC\u660E\u3002
3. **\u899A\u3048\u65B9**: \u8A18\u61B6\u306B\u6B8B\u308B\u8A9E\u5442\u5408\u308F\u305B\u3084\u30A4\u30E1\u30FC\u30B8\u3002

\u51FA\u529B\u30D5\u30A9\u30FC\u30DE\u30C3\u30C8\u306F\u4EE5\u4E0B\u306EJSON\u914D\u5217\u3067\u3059\u3002
[
  {
    "word": "\u5358\u8A9E",
    "meaning": "\u610F\u5473",
    "pronunciation": "\u767A\u97F3",
    "etymology": "\u8A9E\u6E90\u89E3\u8AAC",
    "mnemonic": "\u899A\u3048\u65B9",
    "logic": "\u8AD6\u7406\u7684\u80CC\u666F",
    "exampleSentence": "\u4F8B\u6587",
    "exampleSentenceTranslation": "\u4F8B\u6587\u8A33",
    "synonyms": [{"term": "\u985E\u8A9E", "translation": "\u8A33"}],
    "collocations": [{"term": "\u30B3\u30ED\u30B1\u30FC\u30B7\u30E7\u30F3", "translation": "\u8A33"}],
    "derivatives": ["\u6D3E\u751F\u8A9E"],
    "idioms": [{"term": "\u719F\u8A9E", "translation": "\u8A33"}],
    "nuance": "\u30CB\u30E5\u30A2\u30F3\u30B9",
    "relatedWords": [{"term": "\u95A2\u9023\u8A9E", "translation": "\u8A33"}]
  }
]`;
var buildChatSystemInstruction = /* @__PURE__ */ __name((vocabularyContext, responseLanguage = "ja") => `\u3042\u306A\u305F\u306F\u89AA\u5207\u3067\u77E5\u8B58\u8C4A\u5BCC\u306A\u82F1\u8A9E\u5B66\u7FD2\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8\u3067\u3059\u3002
\u30E6\u30FC\u30B6\u30FC\u304B\u3089\u306E\u82F1\u5358\u8A9E\u3001\u6587\u6CD5\u3001\u30CB\u30E5\u30A2\u30F3\u30B9\u3001\u307E\u305F\u306F\u82F1\u8A9E\u5B66\u7FD2\u5168\u822C\u306B\u95A2\u3059\u308B\u8CEA\u554F\u306B\u7B54\u3048\u3066\u304F\u3060\u3055\u3044\u3002
\u56DE\u7B54\u306F\u7C21\u6F54\u304B\u3064\u5206\u304B\u308A\u3084\u3059\u304F\u3001\u5B66\u7FD2\u8005\u304C\u300C\u306A\u308B\u307B\u3069\u300D\u3068\u7D0D\u5F97\u3067\u304D\u308B\u3088\u3046\u306B\u5FC3\u304C\u3051\u3066\u304F\u3060\u3055\u3044\u3002
\u5358\u8A9E\u306E\u89E3\u8AAC\u3092\u3059\u308B\u969B\u306F\u3001\u8A9E\u6E90\u3084\u30B3\u30A2\u30A4\u30E1\u30FC\u30B8\uFF08Logic\uFF09\u3092\u4EA4\u3048\u3066\u3001\u8A18\u61B6\u306B\u5B9A\u7740\u3057\u3084\u3059\u3044\u3088\u3046\u306B\u8AAC\u660E\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u30E6\u30FC\u30B6\u30FC\u306E\u5B66\u7FD2\u30C7\u30FC\u30BF\u3011
\u30E6\u30FC\u30B6\u30FC\u306F\u4EE5\u4E0B\u306E\u5358\u8A9E\u3092\u65E2\u306B\u5B66\u7FD2\uFF08\u307E\u305F\u306F\u691C\u7D22\uFF09\u3057\u3066\u3044\u307E\u3059\u3002
\u8CEA\u554F\u306B\u7B54\u3048\u308B\u969B\u3001\u53EF\u80FD\u3067\u3042\u308C\u3070\u3053\u308C\u3089\u306E\u5358\u8A9E\u3092\u4F8B\u306B\u6319\u3052\u305F\u308A\u3001\u6BD4\u8F03\u5BFE\u8C61\u3068\u3057\u3066\u4F7F\u3046\u3053\u3068\u3067\u3001\u30E6\u30FC\u30B6\u30FC\u306E\u8A18\u61B6\u306E\u5B9A\u7740\u3092\u52A9\u3051\u3066\u304F\u3060\u3055\u3044\u3002
\u307E\u305F\u3001\u300C\u79C1\u306E\u5358\u8A9E\u5E33\u304B\u3089\u30AF\u30A4\u30BA\u3092\u51FA\u3057\u3066\u300D\u3084\u300C\u4FDD\u5B58\u3057\u305F\u5358\u8A9E\u3092\u4F7F\u3063\u3066\u4F8B\u6587\u3092\u4F5C\u3063\u3066\u300D\u3068\u3044\u3063\u305F\u30EA\u30AF\u30A8\u30B9\u30C8\u306B\u3082\u5FDC\u3058\u3066\u304F\u3060\u3055\u3044\u3002

\u5B66\u7FD2\u6E08\u307F\u5358\u8A9E\u30EA\u30B9\u30C8:
${vocabularyContext}

\u5FC5\u8981\u306B\u5FDC\u3058\u3066\u3001\u985E\u7FA9\u8A9E\u306E\u30EA\u30B9\u30C8\u30A2\u30C3\u30D7\u3084\u4F8B\u6587\u306E\u4F5C\u6210\u3092\u884C\u3063\u3066\u304F\u3060\u3055\u3044\u3002

${languageInstruction(responseLanguage)}`, "buildChatSystemInstruction");
var buildNotePrompt = /* @__PURE__ */ __name((conversationText, responseLanguage = "ja") => `\u4EE5\u4E0B\u306E\u82F1\u8A9E\u5B66\u7FD2\u306B\u95A2\u3059\u308B\u4F1A\u8A71\u30ED\u30B0\u3092\u3001\u30E6\u30FC\u30B6\u30FC\u304C\u5F8C\u3067\u5FA9\u7FD2\u3059\u308B\u305F\u3081\u306E\u300C\u69CB\u9020\u5316\u3055\u308C\u305F\u5B66\u7FD2\u30CE\u30FC\u30C8\u300D\u306B\u5909\u63DB\u3057\u3066\u304F\u3060\u3055\u3044\u3002
\u5358\u306A\u308B\u4F1A\u8A71\u306E\u8981\u7D04\u3067\u306F\u306A\u304F\u3001\u4F1A\u8A71\u306E\u4E2D\u3067\u767B\u5834\u3057\u305F\u300C\u91CD\u8981\u306A\u82F1\u5358\u8A9E\u300D\u300C\u6587\u6CD5\u4E8B\u9805\u300D\u300C\u30CB\u30E5\u30A2\u30F3\u30B9\u306E\u9055\u3044\u300D\u300C\u4F8B\u6587\u300D\u306A\u3069\u3092\u62BD\u51FA\u3057\u3001\u6559\u79D1\u66F8\u3084\u53C2\u8003\u66F8\u306E\u3088\u3046\u306B\u6574\u7406\u3057\u3066\u304F\u3060\u3055\u3044\u3002

\u3010\u8981\u4EF6\u3011
1. \u30BF\u30A4\u30C8\u30EB: \u4F1A\u8A71\u306E\u30C6\u30FC\u30DE\u3092\u4E00\u8A00\u3067\u8868\u3059\u9B45\u529B\u7684\u306A\u30BF\u30A4\u30C8\u30EB\uFF08\u4F8B\uFF1A\u300CGo\u3068Come\u306E\u4F7F\u3044\u5206\u3051\u5B8C\u5168\u30AC\u30A4\u30C9\u300D\uFF09
2. \u672C\u6587 (Content): Markdown\u5F62\u5F0F\u3067\u8A18\u8FF0\u3057\u3066\u304F\u3060\u3055\u3044\u3002
   - \u898B\u51FA\u3057 (#, ##) \u3092\u4F7F\u3063\u3066\u69CB\u9020\u5316\u3059\u308B\u3002
   - \u91CD\u8981\u306A\u30DD\u30A4\u30F3\u30C8\u306F\u7B87\u6761\u66F8\u304D (-) \u306B\u3059\u308B\u3002
   - \u4F8B\u6587\u3084\u5358\u8A9E\u306F\u592A\u5B57 (**) \u306B\u3059\u308B\u3002
   - \u8B1B\u5E2B\u306E\u30A2\u30C9\u30D0\u30A4\u30B9\u3084Tips\u3092\u542B\u3081\u308B\u3002
3. \u30BF\u30B0: \u691C\u7D22\u3057\u3084\u3059\u3044\u30AD\u30FC\u30EF\u30FC\u30C9\uFF083\u3064\u301C5\u3064\uFF09\u3002

\u3010\u4F1A\u8A71\u30ED\u30B0\u3011
${conversationText}

${languageInstruction(responseLanguage)}`, "buildNotePrompt");

// ../shared/eikenSpeaking.ts
var EIKEN_SPEAKING_MODEL = "gemini-3.5-flash";
var EIKEN_SPEAKING_SYSTEM_INSTRUCTION = `
You are an expert examiner and professional coach for the Eiken Grade Pre-1 Speaking Test (Interview) in Japan.
Your task is to analyze the candidate's spoken or typed answer and provide sharp, actionable feedback in Japanese (and English where helpful).

The user's core training focus is: "Secure 1 keyword in 3 seconds -> Turn it into a sentence while speaking." (3\u79D2\u3067\u30AD\u30FC\u30EF\u30FC\u30C9\u30921\u3064\u78BA\u4FDD\u3057\u3001\u305D\u308C\u3092\u8A71\u3057\u59CB\u3081\u306E\u8DB3\u304C\u304B\u308A\u306B\u3059\u308B)

You MUST evaluate the candidate's response and output a JSON object adhering exactly to the provided schema.

Important transcription tolerance:
- The user's answer may come from speech-to-text. Treat common filler words such as "um", "uh", "er", "well", "you know", repeated restarts, and short self-corrections as normal spoken hesitation. Do not punish them unless they seriously block comprehension.
- Do not penalize obvious STT transcription mistakes or homophone-like substitutions when the intended meaning is clear from context.
- Prioritize semantic consistency, concrete reasoning, and logical organization over perfect grammatical completeness. Grammar remains part of the score, but a meaningful, coherent answer should not be over-penalized for minor spoken-language fragments.
- Preserve the existing scoring balance across vocabulary, grammar, logic, and reflex strategy. Add tolerance for speech/transcription noise; do not make the rubric easier in substance.

Guidelines for Evaluation:

1. Vocabulary & Expressions (\u8A9E\u5F59\u30FB\u8868\u73FE)
- Verify if they are appropriately utilizing Eiken Pre-1 level vocabulary/expressions (e.g., "promote exports", "income inequality", "stimulate the economy", "environmental impact", "take measures", "alternative energy").
- Correct unnatural word choices with explicit explanations. For example:
  * Nudge "pass down" instead of "hand down"
  * Nudge "can't afford to" instead of "poorness"
  * Nudge "university tuition" or "school fees" instead of "university money"
  * Recommend higher-level verbs or collocations.
- If a suspicious word appears to be a speech-to-text error but the user's intended phrase is inferable, mention the likely intended phrase gently and do not count it as a vocabulary failure.

2. Grammar & Sentence Structure (\u6587\u6CD5\u30FB\u6587\u69CB\u9020)
- Check verb patterns (e.g., "convey/hand A to B" or "explain A to B", making sure they don't say "explain me").
- Check for correct articles and correct noun forms (e.g., "social media" instead of "social medias", "university tuition" instead of "university tuitions").
- Verify if subjunctive mood is used correctly for hypothetical situations. For example: "If tuition were free, more students could..." instead of "If tuition is free, more students will...".
- Be precise but fair: spoken answers may contain incomplete starts, fillers, or repaired phrases. Penalize grammar mainly when errors repeatedly damage meaning or make the argument unclear.

3. Logic & Argumentation (\u8AD6\u7406\u30FB\u69CB\u6210) - VERY CRITICAL!
- Logic, meaning, and argument development are more important than surface grammatical perfection.
- Check if the reason is just a circular repetition of the main claim ("\u8A00\u3044\u63DB\u3048\u554F\u984C" - repeating the same thing in different words).
- Ensure the reason is concrete, persuasive, and steps forward (e.g., instead of just "everyone can go to college," state "regardless of economic disparity, high-achieving students from low-income families can pursue higher education").
- Critique the use of the "Of course... However..." template. Ensure it is only used when addressing a genuine counterargument, not just as meaningless filler. It must actually contrast two balanced ideas.

4. Next Action (\u6B21\u306E\u30A2\u30AF\u30B7\u30E7\u30F3)
- Always remind the user of the core strategy: "Did you secure a single keyword in 3 seconds before speaking?"
- Provide 1 concrete tip or prompt they should try in their next session to solidify this habit.

Provide a perfect Model Answer (\u7406\u60F3\u7684\u306A\u89E3\u7B54\u4F8B) of Eiken Pre-1 caliber that directly addresses the prompt.
`.trim();
var buildEikenSpeakingUserPrompt = /* @__PURE__ */ __name(({
  mode,
  text,
  context,
  userProfile
}) => `
[Exam Mode]: ${mode === "narration" ? "Narration (4-Panel Comic Description)" : "Q&A (Social Issues)"}
[Prompt Context / Question]: ${context}
[User's Answer]: "${text}"
[User Profile / Specific Focus]: ${JSON.stringify(userProfile || {})}

Analyze the User's Answer carefully and provide the detailed critique strictly in the JSON format requested.
`.trim(), "buildEikenSpeakingUserPrompt");

// src/index.ts
var DEFAULT_FIREBASE_PROJECT_ID = "etymolingua-61e6d";
var GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
var JWKS_URL = new URL(
  "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
);
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
var QUOTA_MESSAGE = "AI\u306E\u5229\u7528\u4E0A\u9650\uFF08\u30AF\u30A9\u30FC\u30BF\uFF09\u306B\u9054\u3057\u307E\u3057\u305F\u3002\n\u3057\u3070\u3089\u304F\u6642\u9593\uFF081\u301C2\u5206\u7A0B\u5EA6\uFF09\u3092\u304A\u3044\u3066\u304B\u3089\u518D\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002";
var OVERLOADED_MESSAGE = "AI\u30B5\u30FC\u30D0\u30FC\u304C\u6DF7\u96D1\u3057\u3066\u3044\u307E\u3059\u3002\u3057\u3070\u3089\u304F\u5F85\u3063\u3066\u304B\u3089\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
var GENERIC_MESSAGE = "AI\u30B5\u30FC\u30D0\u30FC\u3067\u30A8\u30E9\u30FC\u304C\u767A\u751F\u3057\u307E\u3057\u305F\u3002\u6642\u9593\u3092\u304A\u3044\u3066\u518D\u8A66\u884C\u3057\u3066\u304F\u3060\u3055\u3044\u3002";
var HttpError = class extends Error {
  static {
    __name(this, "HttpError");
  }
  status;
  /** true のとき message をそのままユーザーへ返してよい */
  expose;
  constructor(status, message2, expose = true) {
    super(message2);
    this.status = status;
    this.expose = expose;
  }
};
var badRequest = /* @__PURE__ */ __name((message2) => new HttpError(400, message2), "badRequest");
var cachedJwks = null;
var getJwks = /* @__PURE__ */ __name(() => {
  if (!cachedJwks) cachedJwks = createRemoteJWKSet(JWKS_URL);
  return cachedJwks;
}, "getJwks");
var requireAuth = /* @__PURE__ */ __name(async (request, env) => {
  const header = request.headers.get("Authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new HttpError(401, "\u8A8D\u8A3C\u304C\u5FC5\u8981\u3067\u3059\u3002\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304B\u3089\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002");
  }
  const projectId = env.FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_PROJECT_ID;
  try {
    const { payload } = await jwtVerify(match[1].trim(), getJwks(), {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId
    });
    return payload.sub ?? "";
  } catch {
    throw new HttpError(401, "\u8A8D\u8A3C\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u518D\u5EA6\u30ED\u30B0\u30A4\u30F3\u3057\u3066\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002");
  }
}, "requireAuth");
var requireString = /* @__PURE__ */ __name((value, name, maxLength) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw badRequest(`\u300C${name}\u300D\u306F\u5FC5\u9808\u3067\u3059\u3002`);
  }
  if (value.length > maxLength) {
    throw badRequest(`\u300C${name}\u300D\u304C\u9577\u3059\u304E\u307E\u3059\uFF08\u6700\u5927${maxLength}\u6587\u5B57\uFF09\u3002`);
  }
  return value;
}, "requireString");
var optionalString = /* @__PURE__ */ __name((value, name, maxLength, fallback = "") => {
  if (value === void 0 || value === null) return fallback;
  if (typeof value !== "string") {
    throw badRequest(`\u300C${name}\u300D\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002`);
  }
  if (value.length > maxLength) {
    throw badRequest(`\u300C${name}\u300D\u304C\u9577\u3059\u304E\u307E\u3059\uFF08\u6700\u5927${maxLength}\u6587\u5B57\uFF09\u3002`);
  }
  return value;
}, "optionalString");
var optionalEnum = /* @__PURE__ */ __name((value, allowed, fallback, name) => {
  if (value === void 0 || value === null) return fallback;
  if (typeof value === "string" && allowed.includes(value)) {
    return value;
  }
  throw badRequest(`\u300C${name}\u300D\u306E\u5024\u304C\u4E0D\u6B63\u3067\u3059\u3002`);
}, "optionalEnum");
var parseChatHistory = /* @__PURE__ */ __name((value, name, maxMessages) => {
  if (value === void 0 || value === null) return [];
  if (!Array.isArray(value)) {
    throw badRequest(`\u300C${name}\u300D\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002`);
  }
  if (value.length > maxMessages) {
    throw badRequest(`\u300C${name}\u300D\u304C\u9577\u3059\u304E\u307E\u3059\uFF08\u6700\u5927${maxMessages}\u4EF6\uFF09\u3002`);
  }
  return value.map((msg) => {
    if (!msg || typeof msg !== "object") {
      throw badRequest(`\u300C${name}\u300D\u306E\u5F62\u5F0F\u304C\u4E0D\u6B63\u3067\u3059\u3002`);
    }
    const role = msg.role;
    const text = msg.text;
    if (role !== "user" && role !== "model") {
      throw badRequest(`\u300C${name}\u300D\u306E role \u304C\u4E0D\u6B63\u3067\u3059\uFF08'user' | 'model' \u306E\u307F\uFF09\u3002`);
    }
    if (typeof text !== "string") {
      throw badRequest(`\u300C${name}\u300D\u306E text \u304C\u4E0D\u6B63\u3067\u3059\u3002`);
    }
    if (text.length > 4e3) {
      throw badRequest(`\u300C${name}\u300D\u306E\u30E1\u30C3\u30BB\u30FC\u30B8\u304C\u9577\u3059\u304E\u307E\u3059\uFF08\u6700\u59274000\u6587\u5B57\uFF09\u3002`);
    }
    return { role, text };
  });
}, "parseChatHistory");
var sanitizeString = /* @__PURE__ */ __name((value, maxLength) => {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}, "sanitizeString");
var translationItemSchema = {
  type: "OBJECT",
  properties: {
    term: { type: "STRING" },
    translation: { type: "STRING" }
  },
  required: ["term", "translation"]
};
var wordDetailsSchema = {
  type: "OBJECT",
  properties: {
    word: { type: "STRING" },
    meaning: { type: "STRING" },
    pronunciation: { type: "STRING" },
    etymology: { type: "STRING" },
    mnemonic: { type: "STRING" },
    logic: { type: "STRING" },
    exampleSentence: { type: "STRING" },
    exampleSentenceTranslation: { type: "STRING" },
    synonyms: { type: "ARRAY", items: translationItemSchema },
    collocations: { type: "ARRAY", items: translationItemSchema },
    derivatives: { type: "ARRAY", items: { type: "STRING" } },
    idioms: { type: "ARRAY", items: translationItemSchema },
    nuance: { type: "STRING" },
    relatedWords: { type: "ARRAY", items: translationItemSchema }
  },
  required: [
    "word",
    "meaning",
    "pronunciation",
    "etymology",
    "mnemonic",
    "logic",
    "exampleSentence",
    "exampleSentenceTranslation",
    "synonyms",
    "collocations",
    "derivatives",
    "idioms",
    "nuance",
    "relatedWords"
  ]
};
var noteSchema = {
  type: "OBJECT",
  properties: {
    title: { type: "STRING", description: "\u30CE\u30FC\u30C8\u306E\u30BF\u30A4\u30C8\u30EB" },
    content: { type: "STRING", description: "Markdown\u5F62\u5F0F\u306E\u5B66\u7FD2\u30CE\u30FC\u30C8\u672C\u6587" },
    tags: { type: "ARRAY", items: { type: "STRING" }, description: "\u95A2\u9023\u30BF\u30B0" }
  },
  required: ["title", "content", "tags"]
};
var eikenSpeakingSchema = {
  type: "OBJECT",
  required: ["score", "grades", "feedback", "modelAnswer", "suggestedKeywords"],
  properties: {
    score: {
      type: "INTEGER",
      description: "Overall evaluation score from 1 to 10 (10 being perfect Pre-1 standard)."
    },
    grades: {
      type: "OBJECT",
      required: ["vocabulary", "grammar", "logic", "reflex"],
      properties: {
        vocabulary: { type: "STRING", description: "Grade A, B, C, or D for Vocabulary" },
        grammar: { type: "STRING", description: "Grade A, B, C, or D for Grammar" },
        logic: { type: "STRING", description: "Grade A, B, C, or D for Logic & Argumentation" },
        reflex: { type: "STRING", description: "Grade A, B, C, or D for Reflex & Strategy" }
      }
    },
    feedback: {
      type: "OBJECT",
      required: ["vocabulary", "grammar", "logic", "nextAction"],
      properties: {
        vocabulary: { type: "STRING" },
        grammar: { type: "STRING" },
        logic: { type: "STRING" },
        nextAction: { type: "STRING" }
      }
    },
    modelAnswer: { type: "STRING" },
    suggestedKeywords: {
      type: "ARRAY",
      items: { type: "STRING" }
    }
  }
};
var callGemini = /* @__PURE__ */ __name(async (env, options) => {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new HttpError(500, GENERIC_MESSAGE, false);
  }
  const body = { contents: options.contents };
  if (options.systemInstruction) {
    body.system_instruction = { parts: [{ text: options.systemInstruction }] };
  }
  const generationConfig = {};
  if (options.responseMimeType) generationConfig.responseMimeType = options.responseMimeType;
  if (options.responseSchema) generationConfig.responseSchema = options.responseSchema;
  if (Object.keys(generationConfig).length > 0) {
    body.generationConfig = generationConfig;
  }
  let response;
  try {
    response = await fetch(
      `${GEMINI_API_BASE}/models/${options.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(body)
      }
    );
  } catch {
    throw new HttpError(500, options.genericMessage ?? GENERIC_MESSAGE, false);
  }
  if (response.status === 429) {
    throw new HttpError(429, QUOTA_MESSAGE);
  }
  if (response.status === 503) {
    throw new HttpError(503, OVERLOADED_MESSAGE);
  }
  if (!response.ok) {
    console.error(`Gemini upstream error: HTTP ${response.status}`);
    throw new HttpError(500, options.genericMessage ?? GENERIC_MESSAGE, false);
  }
  const data = await response.json().catch(() => null);
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts.map((part) => part?.text ?? "").join("");
}, "callGemini");
var parseGeminiJson = /* @__PURE__ */ __name((text, emptyMessage, parseMessage) => {
  if (!text) {
    throw new HttpError(502, emptyMessage);
  }
  const cleanText = text.replace(/^```json\s*/, "").replace(/\s*```$/, "").trim();
  try {
    return JSON.parse(cleanText);
  } catch {
    throw new HttpError(502, parseMessage);
  }
}, "parseGeminiJson");
var userContent = /* @__PURE__ */ __name((text) => [
  { role: "user", parts: [{ text }] }
], "userContent");
var lookupWord = /* @__PURE__ */ __name(async (body, env) => {
  const word = requireString(body?.word, "word", 100);
  const explainMode = optionalEnum(
    body?.explainMode,
    ["en-ja", "en-en", "multilingual"],
    "en-ja",
    "explainMode"
  );
  const focus = optionalEnum(
    body?.focus,
    ["all", "idioms", "etymology", "core"],
    "all",
    "focus"
  );
  const aiSpeedMode = optionalEnum(
    body?.aiSpeedMode,
    ["fast", "standard"],
    "fast",
    "aiSpeedMode"
  );
  const text = await callGemini(env, {
    model: AI_MODEL_BY_SPEED[aiSpeedMode],
    systemInstruction: buildLookupSystemInstruction(explainMode, focus),
    contents: userContent(buildLookupContents(word)),
    responseMimeType: "application/json",
    responseSchema: wordDetailsSchema
  });
  return parseGeminiJson(text, "AI\u304B\u3089\u306E\u5FDC\u7B54\u304C\u7A7A\u3067\u3057\u305F\u3002", "AI\u306E\u5FDC\u7B54\u3092\u89E3\u6790\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002");
}, "lookupWord");
var generateAiQuiz = /* @__PURE__ */ __name(async (body, env) => {
  const level = requireString(body?.level, "level", 50);
  const count = body?.count;
  if (typeof count !== "number" || !Number.isInteger(count) || count < 1 || count > 20) {
    throw badRequest("\u300Ccount\u300D\u306F1\u301C20\u306E\u6574\u6570\u3067\u6307\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044\u3002");
  }
  const text = await callGemini(env, {
    model: GEMINI_MODEL,
    systemInstruction: QUIZ_SYSTEM_INSTRUCTION,
    contents: userContent(buildQuizContents(level, count)),
    responseMimeType: "application/json"
  });
  const data = parseGeminiJson(text, "AI\u304B\u3089\u306E\u5FDC\u7B54\u304C\u7A7A\u3067\u3057\u305F\u3002", "\u30AF\u30A4\u30BA\u30C7\u30FC\u30BF\u306E\u89E3\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
  if (!Array.isArray(data)) {
    throw new HttpError(502, "\u30AF\u30A4\u30BA\u30C7\u30FC\u30BF\u306E\u89E3\u6790\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002");
  }
  return data;
}, "generateAiQuiz");
var chatWithTutor = /* @__PURE__ */ __name(async (body, env) => {
  const history = parseChatHistory(body?.history, "history", 30);
  const newMessage = requireString(body?.newMessage, "newMessage", 4e3);
  const vocabularyContext = optionalString(body?.vocabularyContext, "vocabularyContext", 2e4, "");
  const responseLanguage = optionalEnum(
    body?.responseLanguage,
    ["ja", "en", "zh-CN", "ko"],
    "ja",
    "responseLanguage"
  );
  const contents = [
    ...history.map((msg) => ({ role: msg.role, parts: [{ text: msg.text }] })),
    { role: "user", parts: [{ text: newMessage }] }
  ];
  const text = await callGemini(env, {
    model: GEMINI_MODEL,
    systemInstruction: buildChatSystemInstruction(vocabularyContext, responseLanguage),
    contents
  });
  return { text: text || "Failed to generate response." };
}, "chatWithTutor");
var generateNote = /* @__PURE__ */ __name(async (body, env) => {
  const chatHistory = parseChatHistory(body?.chatHistory, "chatHistory", 50);
  const responseLanguage = optionalEnum(
    body?.responseLanguage,
    ["ja", "en", "zh-CN", "ko"],
    "ja",
    "responseLanguage"
  );
  const relevantHistory = chatHistory.slice(1);
  if (relevantHistory.length === 0) {
    throw badRequest("\u8981\u7D04\u3059\u308B\u4F1A\u8A71\u30C7\u30FC\u30BF\u304C\u3042\u308A\u307E\u305B\u3093\u3002");
  }
  const conversationText = relevantHistory.map((msg) => `${msg.role}: ${msg.text}`).join("\n");
  const text = await callGemini(env, {
    model: GEMINI_MODEL,
    contents: userContent(buildNotePrompt(conversationText, responseLanguage)),
    responseMimeType: "application/json",
    responseSchema: noteSchema
  });
  return parseGeminiJson(
    text,
    "\u8981\u7D04\u306E\u751F\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
    "\u30CE\u30FC\u30C8\u306E\u4F5C\u6210\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002\u3082\u3046\u4E00\u5EA6\u304A\u8A66\u3057\u304F\u3060\u3055\u3044\u3002"
  );
}, "generateNote");
var evaluateEikenSpeaking = /* @__PURE__ */ __name(async (body, env) => {
  const payload = {
    mode: body?.mode === "narration" ? "narration" : "qa",
    text: sanitizeString(body?.text, 12e3),
    context: sanitizeString(body?.context, 8e3),
    userProfile: body?.userProfile && typeof body.userProfile === "object" && !Array.isArray(body.userProfile) ? body.userProfile : {}
  };
  if (!payload.text) {
    throw new HttpError(400, "No response text was provided to analyze.");
  }
  if (!payload.context) {
    throw new HttpError(400, "No prompt context was provided.");
  }
  const text = await callGemini(env, {
    model: EIKEN_SPEAKING_MODEL,
    systemInstruction: EIKEN_SPEAKING_SYSTEM_INSTRUCTION,
    contents: userContent(buildEikenSpeakingUserPrompt(payload)),
    responseMimeType: "application/json",
    responseSchema: eikenSpeakingSchema,
    genericMessage: "Failed to evaluate the response. Please try again."
  });
  const jsonText = text ? text.trim() : "{}";
  try {
    return JSON.parse(jsonText);
  } catch {
    throw new HttpError(500, "Failed to evaluate the response. Please try again.", false);
  }
}, "evaluateEikenSpeaking");
var ROUTES = {
  "/lookupWord": lookupWord,
  "/generateAiQuiz": generateAiQuiz,
  "/chatWithTutor": chatWithTutor,
  "/generateNote": generateNote,
  "/evaluateEikenSpeaking": evaluateEikenSpeaking
};
var jsonResponse = /* @__PURE__ */ __name((data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { "Content-Type": "application/json", ...CORS_HEADERS }
}), "jsonResponse");
var respondError = /* @__PURE__ */ __name((error, logLabel) => {
  if (error instanceof HttpError) {
    console.error(`${logLabel} failed: HTTP ${error.status}`);
    if (error.status === 429) {
      return jsonResponse({ error: QUOTA_MESSAGE }, 429);
    }
    if (error.status === 503) {
      return jsonResponse({ error: OVERLOADED_MESSAGE }, 503);
    }
    return jsonResponse({ error: error.expose ? error.message : GENERIC_MESSAGE }, error.status);
  }
  console.error(`${logLabel} failed:`, error);
  return jsonResponse({ error: GENERIC_MESSAGE }, 500);
}, "respondError");
var index_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }
    const { pathname } = new URL(request.url);
    const logic = ROUTES[pathname];
    if (!logic) {
      return jsonResponse({ error: "Not found." }, 404);
    }
    if (request.method !== "POST") {
      return jsonResponse({ error: "Method not allowed." }, 405);
    }
    try {
      await requireAuth(request, env);
      const body = await request.json().catch(() => ({}));
      const result = await logic(body ?? {}, env);
      return jsonResponse(result);
    } catch (error) {
      return respondError(error, pathname);
    }
  }
};
export {
  index_default as default
};
