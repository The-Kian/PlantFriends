import { CredentialsType } from "@context/auth/AuthTypes";

function validateCredentials(
    credentials: CredentialsType,
    authScreenType: string
  ) {
    let { email, confirmEmail, password, confirmPassword } = credentials;
  
    email = email.trim();
    password = password.trim();
  
    const emailIsValid = email.includes('@');
    const passwordIsValid = password.length > 6;
    const emailsAreEqual = email === confirmEmail;
    const passwordsAreEqual = password === confirmPassword;
  
    const isValid =
      emailIsValid &&
      passwordIsValid &&
      (authScreenType !== 'signUp' || (emailsAreEqual && passwordsAreEqual));
  
    return { isValid };
  }
  
  export default validateCredentials;