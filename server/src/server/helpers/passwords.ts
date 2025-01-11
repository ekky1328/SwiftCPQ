import brcrypt from 'brcrypt';

export function validatePasswordStrengh(plaintextPassword: string): boolean {

  const minimumStrengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_])(?=.*\d).{12,}$/;
  if (minimumStrengthRegex.test(plaintextPassword)) {
    return true;
  } 
  
  else {
    return false;
  }

}


export async function hashPassword(plaintextPassword: string): Promise<string> {
  try {

    if (validatePasswordStrengh(plaintextPassword)) {
      const saltRounds = 10;
      const hashedPassword = await brcrypt.hash(plaintextPassword, saltRounds);
      return hashedPassword; 
    }

    else {
      const errorMessage = "Password does not meet strength requirements: Password must be at least 12 characters, include at least one lowercase letter, one uppercase letter, one number, and one special character.";
      throw Error(errorMessage)
    }
    
  } 
  
  catch (error) {
    console.error('Error hashing password:', error);
    throw error;
  }
};