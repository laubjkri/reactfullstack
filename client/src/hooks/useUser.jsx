import { useState, useEffect } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";

function useUser() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  
  
  useEffect(() => {
    const unsubsribe = onAuthStateChanged(getAuth(), user => {
      setUser(user);
      setIsLoading(false);
    });
    
    // Will be executed when the user navigates away
    return unsubsribe;
    
  }, []);
  
  return { user, isLoading };  
}

export default useUser;