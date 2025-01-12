import bcrypt from 'bcrypt';

const isStrongPassword = (password: string) => {
  
  const hasLowercase = /[a-z]/;
  const hasUppercase = /[A-Z]/;
  const hasDigit = /\d/;
  const hasSpecialChar = /(?=.*[\W_&&[^'"`;\\<>%&])/;
  const hasMinLength = /^.{12,}$/;

  return (
    hasLowercase.test(password) && 
    hasUppercase.test(password) && 
    hasDigit.test(password) && 
    hasSpecialChar.test(password) && 
    hasMinLength.test(password)
  )
};

export async function hashPassword(plaintextPassword: string): Promise<string> {
  try {

    const result = isStrongPassword(plaintextPassword);
    if (result) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(plaintextPassword, saltRounds);
      return hashedPassword; 
    }

    else {
      const errorMessage = "Password does not meet strength requirements: Password must be at least 12 characters, include at least one lowercase letter, one uppercase letter, one number, and one special character (!#$*+,./:=?@[]^_{}|~').";
      throw Error(errorMessage)
    }
    
  } 
  
  catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};