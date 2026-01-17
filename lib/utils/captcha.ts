// Google reCAPTCHA v3 validation
// Get your keys from: https://www.google.com/recaptcha/admin

export async function verifyCaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    // In development, allow requests without CAPTCHA if not configured
    if (process.env.NODE_ENV === 'development') {
      console.warn('reCAPTCHA not configured - allowing request in development');
      return true;
    }
    return false;
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    
    // Score threshold (0.0 to 1.0) - 0.5 is recommended
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');
    
    return data.success === true && (data.score || 0) >= scoreThreshold;
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return false;
  }
}
