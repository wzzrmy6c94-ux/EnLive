import RegisterForm from "./register-form";

export default async function RegisterPage() {
  const siteKey = process.env.RECAPTCHA_SITE_KEY || "";
  return <RegisterForm recaptchaSiteKey={siteKey} />;
}
