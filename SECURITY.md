# Security Policy

## Reporting Security Issues

If you discover a security vulnerability, please report it responsibly to **security@dnyansindhu.in** instead of using the issue tracker. We take security seriously and will respond promptly to valid security reports.

## Security Measures Implemented

### Frontend Security

#### 1. Content Security Policy (CSP)
All HTML files include a strict CSP that:
- Restricts resource loading to same-origin by default
- Whitelists only necessary external resources (CDN, fonts, analytics)
- Prevents inline script execution (except for necessary bootstrap scripts)
- Disables object embedding and frame embedding from unauthorized sources
- Restricts form submission to same-origin endpoints

#### 2. Security Headers
The following HTTP headers are configured:
- **X-Content-Type-Options: nosniff** - Prevents MIME type sniffing
- **X-Frame-Options: SAMEORIGIN** - Prevents clickjacking attacks
- **Referrer-Policy: strict-origin-when-cross-origin** - Controls referrer information
- **Permissions-Policy** - Disables camera, microphone, and geolocation access

#### 3. Input Validation & Sanitization
All form inputs are validated and sanitized:
- **Email validation** - Ensures valid email format
- **Phone validation** - Validates Indian phone numbers (10 digits, starts with 6-9)
- **Name validation** - Alphanumeric and spaces only (supports Devanagari)
- **HTML sanitization** - Removes dangerous characters (<, >, ", ') to prevent XSS
- **Input trimming** - Removes leading/trailing whitespace

#### 4. CSRF Protection
- Unique CSRF tokens generated on page load
- Tokens stored in sessionStorage
- Validated on form submission
- Tokens expire when session ends

#### 5. Sensitive Data Protection
- **Client-side encryption** - Sensitive data encrypted at rest using base64 + obfuscation
- **SecureStorage wrapper** - Encrypted localStorage for sensitive user data
- **Session-based storage** - CSRF tokens and temporary data stored in sessionStorage
- **No password storage** - Passwords not stored in localStorage

#### 6. Browser Security
- Disabled unnecessary browser features (camera, microphone, geolocation)
- Removed browser dev tools accessibility patterns
- User-agent parsing disabled
- Tap highlight color disabled on mobile

### Code Security

#### Protected Against:
- ✓ **XSS (Cross-Site Scripting)** - Input sanitization and CSP
- ✓ **CSRF (Cross-Site Request Forgery)** - CSRF token validation
- ✓ **HTML Injection** - HTML entity encoding
- ✓ **Clickjacking** - X-Frame-Options header
- ✓ **MIME sniffing** - X-Content-Type-Options header
- ✓ **Information disclosure** - Strict-Origin-When-Cross-Origin referrer policy

#### Code Quality:
- No eval() usage
- No hardcoded secrets or credentials
- No inline sensitive data
- Proper error handling without sensitive information disclosure

### File Security

#### .gitignore Configuration
Prevents accidental commit of:
- Environment files (.env, .env.local)
- Private keys (*.key, *.pem)
- Credentials and secrets directories
- Service account JSON files (except manifest.json and package.json)

### CI/CD Security

#### GitHub Actions Workflow
Automated security checks on every push/pull request:
- Scans for hardcoded secrets
- Verifies presence of security headers
- Checks for vulnerable code patterns
- Prevents merged code with security issues

## Security Recommendations

### For Deployment

1. **HTTPS Only**
   - Deploy only over HTTPS
   - Set HSTS headers on server
   - Redirect all HTTP traffic to HTTPS

2. **Server-Side Validation**
   - Validate all inputs server-side (never trust client validation)
   - Implement rate limiting on APIs
   - Use parameterized queries if using database

3. **Authentication & Authorization**
   - Use OAuth 2.0 or JWT for authentication
   - Implement proper session management
   - Store passwords using bcrypt or similar
   - Implement multi-factor authentication (MFA)

4. **CORS Configuration**
   - Enable CORS only for trusted domains
   - Use whitelist of allowed origins
   - Validate Origin header on server

5. **Monitoring & Logging**
   - Log security-related events
   - Monitor for suspicious patterns
   - Implement intrusion detection
   - Regular security audits

6. **API Security**
   - Implement API key rotation
   - Use OAuth 2.0 for user authentication
   - Implement request signing
   - Rate limit API endpoints
   - Validate all API inputs

7. **Database Security**
   - Use parameterized queries
   - Implement principle of least privilege
   - Encrypt sensitive data at rest
   - Regular backups with encryption

### For Users

1. **Keep Browsers Updated**
   - Use latest browser versions
   - Enable automatic updates

2. **Use Strong Passwords**
   - Passwords should be 12+ characters
   - Include uppercase, lowercase, numbers, symbols
   - Never reuse passwords

3. **Enable MFA**
   - Use two-factor authentication where available

4. **Report Vulnerabilities**
   - Report security issues to security@dnyansindhu.in
   - Do not publicly disclose until patch is available

## Security Contact

For security issues or questions:
- **Email:** security@dnyansindhu.in
- **Response Time:** We aim to respond within 24 hours
- **Responsible Disclosure:** We follow responsible disclosure practices

## Version History

### v1.0 (Current)
- Implemented comprehensive client-side security measures
- Added Content Security Policy headers
- Implemented input validation and sanitization
- Added CSRF protection
- Implemented secure data handling
- Added GitHub Actions security workflow

## Disclaimer

While comprehensive security measures have been implemented, no system is 100% secure. This security policy covers the following:
- **Client-side protection** against common web vulnerabilities
- **Best practices** for secure development
- **Recommendations** for deployment security

Server-side security, infrastructure security, and third-party dependencies require additional measures beyond the scope of this client-side implementation.

## Security Audit

This codebase has been hardened against common attack vectors. However, for production deployment, we recommend:
- Professional security audit by third-party experts
- Regular penetration testing
- Security vulnerability scanning tools
- Code review by security specialists

---

**Last Updated:** January 2024
**Maintained By:** Dnyansindhu Classes Development Team
